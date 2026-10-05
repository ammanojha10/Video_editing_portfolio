import React, { useState, useEffect } from 'react';
import { bleService } from '../utils/bluetooth';
import { BLE_CONFIG } from '../config';
import {
  Bluetooth,
  BluetoothConnected,
  BellRing,
  BellOff,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';

/**
 * DeviceControl
 *
 * Manages the full BLE lifecycle:
 *   Connect → BUZZ_ON / BUZZ_OFF → Disconnect
 *
 * Props:
 *   demoMode        {boolean}          — simulate hardware; never touches real BLE
 *   setDemoMode     {(bool) => void}   — toggle demo mode from the checkbox
 *   onBleStatusChange {(status) => void} — lifts status up to App for HardwareStatus
 */

// All possible BLE connection states
const STATUS = {
  DISCONNECTED: 'Disconnected',
  CONNECTING: 'Connecting',
  CONNECTED: 'Connected',
  BUZZER_ACTIVE: 'Buzzer Active',
  BUZZER_OFF: 'Buzzer Off',
  ERROR: 'Connection Failed',
};

export default function DeviceControl({ demoMode, setDemoMode, onBleStatusChange }) {
  const [status, setStatus] = useState(STATUS.DISCONNECTED);
  const [deviceName, setDeviceName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // command in-flight

  // Lift BLE status to parent (HardwareStatus display)
  useEffect(() => {
    if (onBleStatusChange) onBleStatusChange(status);
  }, [status, onBleStatusChange]);

  // Derived flags
  const isConnected =
    status === STATUS.CONNECTED ||
    status === STATUS.BUZZER_ACTIVE ||
    status === STATUS.BUZZER_OFF;

  const isBleAvailable = bleService.isSupported();

  // ─── Handle remote disconnection ──────────────────────────────────────────
  // Called by bleService when the ESP32 drops the GATT connection.
  const handleRemoteDisconnect = () => {
    setStatus(STATUS.DISCONNECTED);
    setDeviceName('');
    setErrorMessage('Device disconnected. You can reconnect when it is back in range.');
    setIsSending(false);
  };

  // ─── Connect ──────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setErrorMessage('');

    // ── Demo Mode path ────────────────────────────────────────────────────
    if (demoMode) {
      setStatus(STATUS.CONNECTING);
      await new Promise((r) => setTimeout(r, 1500)); // simulate pairing delay
      setDeviceName('Track My Specs (Demo)');
      setStatus(STATUS.CONNECTED);
      return;
    }

    // ── Real BLE path ─────────────────────────────────────────────────────
    if (!isBleAvailable) {
      setErrorMessage(
        'Web Bluetooth is not supported in this browser. ' +
        'Please use Google Chrome or Microsoft Edge on desktop.'
      );
      return;
    }

    setStatus(STATUS.CONNECTING);

    try {
      // bleService.connect() opens the browser chooser, connects GATT,
      // gets the service + characteristic, and starts notifications.
      const { name } = await bleService.connect(handleRemoteDisconnect);
      setDeviceName(name);
      setStatus(STATUS.CONNECTED);
    } catch (err) {
      console.error('[DeviceControl] Connect error:', err);
      setStatus(STATUS.ERROR);
      // Show the descriptive message from bluetooth.js
      setErrorMessage(err.message || 'Connection failed. Please try again.');
    }
  };

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const handleDisconnect = () => {
    if (demoMode) {
      setStatus(STATUS.DISCONNECTED);
      setDeviceName('');
      return;
    }
    bleService.disconnect();
    setStatus(STATUS.DISCONNECTED);
    setDeviceName('');
    setErrorMessage('');
    setIsSending(false);
  };

  // ─── Find My Specs → BUZZ_ON ──────────────────────────────────────────────
  const handleFindSpecs = async () => {
    setErrorMessage('');
    setIsSending(true);

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      setStatus(STATUS.BUZZER_ACTIVE);
      setIsSending(false);
      return;
    }

    try {
      await bleService.sendCommand(BLE_CONFIG.COMMANDS.BUZZ_ON);
      setStatus(STATUS.BUZZER_ACTIVE);
    } catch (err) {
      setErrorMessage('Failed to activate buzzer: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // ─── Stop Buzzer → BUZZ_OFF ───────────────────────────────────────────────
  const handleStopBuzzer = async () => {
    setErrorMessage('');
    setIsSending(true);

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 500));
      setStatus(STATUS.CONNECTED);
      setIsSending(false);
      return;
    }

    try {
      await bleService.sendCommand(BLE_CONFIG.COMMANDS.BUZZ_OFF);
      setStatus(STATUS.CONNECTED);
    } catch (err) {
      setErrorMessage('Failed to stop buzzer: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // ─── Demo Mode toggle ─────────────────────────────────────────────────────
  const handleDemoToggle = (e) => {
    setDemoMode(e.target.checked);
    // Disconnect from real hardware if we switch to demo while connected
    if (isConnected && !e.target.checked) handleDisconnect();
    if (isConnected && e.target.checked) {
      setStatus(STATUS.DISCONNECTED);
      setDeviceName('');
    }
    setErrorMessage('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="block mt-4 flex flex-col">

      {/* ── Header row: status pill + demo checkbox ── */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`}
          />
          <strong className="uppercase">
            {status}
            {demoMode && isConnected ? ' · DEMO' : ''}
          </strong>
        </div>

        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            id="demo-mode-toggle"
            checked={demoMode}
            onChange={handleDemoToggle}
            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--text-color)' }}
          />
          <span className="uppercase font-bold" style={{ fontSize: '0.9rem' }}>
            Demo Mode
          </span>
        </label>
      </div>

      {/* ── Browser compatibility warning ── */}
      {!isBleAvailable && !demoMode && (
        <div
          className="mb-4 flex items-center gap-2"
          style={{
            color: 'var(--error-color)',
            border: '1px solid var(--error-color)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
          }}
        >
          <WifiOff size={18} />
          <span className="uppercase font-bold">
            Web Bluetooth not supported — use Chrome or Edge on desktop
          </span>
        </div>
      )}

      {/* ── Error banner ── */}
      {errorMessage && (
        <div
          className="mb-4 flex items-center gap-2"
          style={{
            color: 'var(--error-color)',
            border: '1px solid var(--error-color)',
            padding: '1rem',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* CONNECTED STATE                             */}
      {/* ════════════════════════════════════════════ */}
      {isConnected ? (
        <div className="flex flex-col gap-4">
          {/* Connected sub-header */}
          <div className="flex flex-col gap-1">
            <span
              className="uppercase font-bold text-center"
              style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}
            >
              {demoMode ? '● Demo — Simulated Connection' : '● Bluetooth Connected'}
            </span>
            {deviceName && (
              <span
                className="text-center uppercase font-bold"
                style={{ fontSize: '0.8rem', opacity: 0.6 }}
              >
                {deviceName}
              </span>
            )}
          </div>

          {/* ── Buzzer controls ── */}
          <div className="mt-2 flex flex-col gap-4">
            {status !== STATUS.BUZZER_ACTIVE ? (
              <button
                id="btn-find-specs"
                className="btn btn-primary btn-large w-full"
                onClick={handleFindSpecs}
                disabled={isSending}
              >
                <BellRing size={24} />
                {isSending ? 'Sending...' : 'Find My Specs'}
              </button>
            ) : (
              <button
                id="btn-stop-buzzer"
                className="btn btn-large w-full animate-pulse"
                style={{
                  backgroundColor: 'var(--error-color)',
                  color: '#fff',
                  borderColor: 'var(--error-color)',
                }}
                onClick={handleStopBuzzer}
                disabled={isSending}
              >
                <BellOff size={24} />
                {isSending ? 'Stopping...' : 'Stop Buzzer'}
              </button>
            )}

            <button
              id="btn-disconnect"
              className="btn w-full"
              onClick={handleDisconnect}
            >
              Disconnect Bluetooth
            </button>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════ */
        /* DISCONNECTED / ERROR STATE                */
        /* ══════════════════════════════════════════ */
        <div className="flex flex-col gap-4 text-center">
          <span
            className="uppercase font-bold text-center"
            style={{
              color: 'var(--text-color)',
              opacity: 0.5,
              fontSize: '0.9rem',
            }}
          >
            {status === STATUS.ERROR
              ? '✗ Connection Failed — Try Again'
              : 'Bluetooth Disconnected — Out of Range'}
          </span>

          <button
            id="btn-connect"
            className="btn btn-primary btn-large w-full"
            onClick={handleConnect}
            disabled={status === STATUS.CONNECTING || (!isBleAvailable && !demoMode)}
          >
            <BluetoothConnected size={24} />
            {status === STATUS.CONNECTING ? 'Connecting...' : 'Connect to Tracker'}
          </button>
        </div>
      )}
    </div>
  );
}
