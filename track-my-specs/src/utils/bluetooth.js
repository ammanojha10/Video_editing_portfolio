/**
 * bluetooth.js — Web Bluetooth service for Track My Specs
 *
 * Architecture:
 *   Website (BLE Central/Client)
 *     ↓  Web Bluetooth API
 *   ESP32-C3 (BLE Peripheral/GATT Server)
 *     ├── Buzzer   (BUZZ_ON / BUZZ_OFF)
 *     └── NEO-6M   (GET_LOCATION → "lat,lng" notification)
 *
 * Single characteristic, PROPERTY_READ | PROPERTY_WRITE | PROPERTY_NOTIFY
 *
 * UUIDs — do NOT change these; they match the Arduino firmware exactly.
 */

import { BLE_CONFIG, STORAGE_KEYS } from '../config';

class BluetoothService {
  constructor() {
    /** @type {BluetoothDevice|null} */
    this.device = null;
    /** @type {BluetoothRemoteGATTServer|null} */
    this.server = null;
    /** @type {BluetoothRemoteGATTService|null} */
    this.service = null;
    /** @type {BluetoothRemoteGATTCharacteristic|null} */
    this.characteristic = null;

    // Bound reference kept so we can properly removeEventListener later
    this._boundNotificationHandler = this._handleNotification.bind(this);

    /**
     * Persistent notification callback registered by the UI layer.
     * Receives every decoded string value sent by the ESP32 via notify.
     * @type {((value: string) => void)|null}
     */
    this._notifyCallback = null;

    /**
     * One-shot resolver set by requestLocation().
     * Intercepts the next notification, resolves/rejects, then clears itself.
     * @type {((value: string) => void)|null}
     */
    this._locationResolver = null;
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  /**
   * Returns true when the Web Bluetooth API is available in this browser.
   * Chrome, Edge, and Opera support it on desktop. Firefox and Safari do not.
   */
  isSupported() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  }

  /**
   * Open the browser's Bluetooth device chooser, connect to the ESP32,
   * get the GATT service + characteristic, and start BLE notifications.
   *
   * @param {() => void} onDisconnect  Called when the GATT server disconnects.
   * @returns {Promise<{ name: string }>}
   * @throws Descriptive Error on any failure so the UI can display it.
   */
  async connect(onDisconnect) {
    // --- Guard: API availability ---
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth is not supported in this browser. ' +
        'Please use Google Chrome or Microsoft Edge on desktop.'
      );
    }

    // Avoid duplicate connections
    if (this.device && this.device.gatt.connected) {
      return { name: this.device.name || 'Track My Specs' };
    }

    // ── Step 1: Open browser device chooser ──────────────────────────────
    // Filter by device name so only "Track My Specs" appears in the list.
    // optionalServices must list the service UUID so we can access it after
    // connection (required by the Web Bluetooth permission model).
    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'Track My Specs' }],
        optionalServices: [BLE_CONFIG.SERVICE_UUID],
      });
    } catch (err) {
      // User dismissed the chooser or Bluetooth is off
      if (err.name === 'NotFoundError') {
        throw new Error(
          'No device selected. ' +
          'Make sure "Track My Specs" is powered on and in range, then try again.'
        );
      }
      if (err.name === 'NotAllowedError') {
        throw new Error(
          'Bluetooth access was denied. ' +
          'Please allow Bluetooth in your browser settings.'
        );
      }
      throw new Error('Device selection failed: ' + (err.message || err.name));
    }

    this.device = device;

    // ── Step 2: Listen for disconnection events ───────────────────────────
    // The browser fires this when the peripheral drops the connection.
    this.device.addEventListener('gattserverdisconnected', () => {
      console.log('[BLE] GATT server disconnected');
      this._cleanup(false); // don't call gatt.disconnect() — already gone
      if (onDisconnect) onDisconnect();
    });

    // ── Step 3: Connect GATT ─────────────────────────────────────────────
    try {
      this.server = await this.device.gatt.connect();
    } catch (err) {
      this._cleanup(false);
      throw new Error('GATT connection failed: ' + (err.message || err.name));
    }

    // ── Step 4: Get the primary service ──────────────────────────────────
    try {
      this.service = await this.server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
    } catch (err) {
      this._cleanup(true);
      throw new Error(
        'Could not find the tracker service (UUID: ' + BLE_CONFIG.SERVICE_UUID + '). ' +
        'Make sure you are connecting to the right device.'
      );
    }

    // ── Step 5: Get the characteristic ───────────────────────────────────
    try {
      this.characteristic = await this.service.getCharacteristic(
        BLE_CONFIG.CHARACTERISTIC_UUID
      );
    } catch (err) {
      this._cleanup(true);
      throw new Error(
        'Could not access the tracker characteristic. ' +
        'Characteristic UUID: ' + BLE_CONFIG.CHARACTERISTIC_UUID
      );
    }

    // ── Step 6: Start BLE notifications ──────────────────────────────────
    // The ESP32 uses pCharacteristic->notify() to push GPS data back.
    // We must call startNotifications() to enable the stream and then
    // register our listener on characteristicvaluechanged.
    try {
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this._boundNotificationHandler
      );
    } catch (err) {
      this._cleanup(true);
      throw new Error('Failed to start BLE notifications: ' + (err.message || err.name));
    }

    // Persist last-connected timestamp
    localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED, new Date().toISOString());

    console.log('[BLE] Connected to:', device.name);
    return { name: device.name || 'Track My Specs' };
  }

  /**
   * Cleanly disconnect from the ESP32.
   * Safe to call even when already disconnected.
   */
  disconnect() {
    this._cleanup(true);
  }

  /**
   * Send an ASCII command string to the ESP32 characteristic (write without response).
   *
   * @param {string} command  One of BUZZ_ON | BUZZ_OFF | GET_LOCATION
   */
  async sendCommand(command) {
    if (!this.characteristic) {
      throw new Error('Not connected — call connect() first.');
    }
    if (!this.device || !this.device.gatt.connected) {
      throw new Error('Bluetooth connection lost. Please reconnect.');
    }

    try {
      const encoded = new TextEncoder().encode(command);
      await this.characteristic.writeValue(encoded);
      console.log('[BLE] Sent command:', command);
    } catch (err) {
      console.error('[BLE] sendCommand failed:', err);
      throw new Error('Failed to send "' + command + '": ' + (err.message || err.name));
    }
  }

  /**
   * Send GET_LOCATION to the ESP32 and wait for the GPS notification.
   *
   * The ESP32 responds via BLE notify with one of:
   *   "latitude,longitude"   e.g. "20.296100,85.824500"
   *   "GPS_NOT_READY"
   *
   * @param {number} timeoutMs  Max wait time (default 15 s — GPS can be slow)
   * @returns {Promise<{ latitude: number, longitude: number }>}
   */
  requestLocation(timeoutMs = 15000) {
    return new Promise(async (resolve, reject) => {
      // Reject if not connected
      if (!this.characteristic || !this.device?.gatt.connected) {
        return reject(new Error('Not connected to tracker.'));
      }

      let settled = false;
      let timer = null;

      const settle = (fn) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this._locationResolver = null; // clear one-shot hook
        fn();
      };

      // Set timeout
      timer = setTimeout(() => {
        settle(() =>
          reject(
            new Error(
              'GPS request timed out after ' +
              (timeoutMs / 1000).toFixed(0) +
              ' s. Make sure the device has a clear sky view.'
            )
          )
        );
      }, timeoutMs);

      // Register one-shot interceptor — runs inside _handleNotification
      this._locationResolver = (rawValue) => {
        if (rawValue === 'GPS_NOT_READY') {
          settle(() => reject(new Error('GPS_NOT_READY')));
          return;
        }

        // Expected format: "lat,lng"  e.g. "20.296100,85.824500"
        const parts = rawValue.trim().split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            settle(() => resolve({ latitude: lat, longitude: lng }));
            return;
          }
        }

        // Unrecognised value — treat as error
        settle(() =>
          reject(new Error('Received invalid GPS data: "' + rawValue + '"'))
        );
      };

      // Send the command — if this throws, clean up immediately
      try {
        await this.sendCommand(BLE_CONFIG.COMMANDS.GET_LOCATION);
      } catch (err) {
        settle(() => reject(err));
      }
    });
  }

  /**
   * Register a persistent callback for ALL incoming BLE notifications.
   * Called AFTER any one-shot location resolver has been triggered.
   *
   * @param {(value: string) => void} callback
   */
  onNotification(callback) {
    this._notifyCallback = callback;
  }

  /** Remove the persistent notification callback. */
  offNotification() {
    this._notifyCallback = null;
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Decode the DataView from a characteristicvaluechanged event and
   * dispatch it to the one-shot location resolver (if active) or the
   * persistent notification callback.
   *
   * @param {Event} event
   */
  _handleNotification(event) {
    const value = new TextDecoder().decode(event.target.value);
    console.log('[BLE] Notification received:', value);

    // One-shot resolver takes priority (set by requestLocation)
    if (this._locationResolver) {
      this._locationResolver(value);
      return;
    }

    // Persistent callback (registered externally)
    if (this._notifyCallback) {
      this._notifyCallback(value);
    }
  }

  /**
   * Internal cleanup — remove event listeners, stop notifications, and
   * optionally call gatt.disconnect().
   *
   * @param {boolean} callDisconnect  false when the device already disconnected
   */
  _cleanup(callDisconnect) {
    if (this.characteristic) {
      try {
        this.characteristic.stopNotifications().catch(() => {});
        this.characteristic.removeEventListener(
          'characteristicvaluechanged',
          this._boundNotificationHandler
        );
      } catch (_) {
        // Ignore — characteristic may already be gone
      }
    }

    if (callDisconnect && this.device && this.device.gatt.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (_) {
        // Ignore
      }
    }

    this.characteristic = null;
    this.service = null;
    this.server = null;
    this._locationResolver = null;
    // Keep this.device so the user can see which device was connected
  }
}

// Singleton — import bleService wherever BLE access is needed
export const bleService = new BluetoothService();
