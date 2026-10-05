import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, MapPin, Activity, Satellite } from 'lucide-react';
import { bleService } from '../utils/bluetooth';
import { DEMO_CONFIG } from '../config';

/**
 * LocationDashboard
 *
 * Data flow (real mode):
 *   User clicks "Get Location"
 *     → sends "GET_LOCATION" over BLE (bleService.requestLocation)
 *       → ESP32 reads NEO-6M GPS
 *         → ESP32 sends "lat,lng" via BLE notify
 *           → bleService resolves the Promise
 *             → we parse lat + lng and update the map
 *
 * Data flow (demo mode):
 *   Locally generated coordinates near DEMO_CONFIG origin with random jitter.
 *   Never mixed with real data.
 *
 * Props:
 *   demoMode        {boolean}
 *   bleConnected    {boolean}           — from App; disables button when not connected
 *   onLocationUpdate {(data) => void}   — lifts location data up to App
 */

// Fix Leaflet's default icon path issues in React/Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/** Imperatively re-centres the map whenever `center` changes. */
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

// GPS status labels
const GPS_STATUS = {
  IDLE: 'Waiting',
  REQUESTING: 'Requesting...',
  LOCKED: 'GPS Fix Available',
  NOT_READY: 'GPS fix not available',
  ERROR: 'Location Unavailable',
};

export default function LocationDashboard({ demoMode, bleConnected, onLocationUpdate }) {
  const [locationData, setLocationData] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(GPS_STATUS.IDLE);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Keep a stable map zoom level across re-renders
  const zoomRef = useRef(16);

  // ─── Clear stale data when switching between demo and real mode ─────────
  useEffect(() => {
    setLocationData(null);
    setGpsStatus(GPS_STATUS.IDLE);
    setErrorMsg('');
  }, [demoMode]);

  // ─── Clear stale data when BLE disconnects ───────────────────────────────
  useEffect(() => {
    if (!bleConnected && !demoMode) {
      setGpsStatus(GPS_STATUS.IDLE);
      setErrorMsg('');
      // Keep the last known location visible on the map
    }
  }, [bleConnected, demoMode]);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH LOCATION
  // ─────────────────────────────────────────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    if (isRequesting) return; // prevent double-clicks
    setIsRequesting(true);
    setErrorMsg('');
    setGpsStatus(GPS_STATUS.REQUESTING);

    // ── Demo Mode ──────────────────────────────────────────────────────────
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200)); // simulate GPS response time
      const data = {
        latitude: DEMO_CONFIG.START_LAT + (Math.random() - 0.5) * 0.002,
        longitude: DEMO_CONFIG.START_LNG + (Math.random() - 0.5) * 0.002,
        timestamp: new Date().toISOString(),
      };
      setLocationData(data);
      setGpsStatus(GPS_STATUS.LOCKED);
      if (onLocationUpdate) onLocationUpdate({ ...data, status: 'online' });
      setIsRequesting(false);
      return;
    }

    // ── Real BLE path ──────────────────────────────────────────────────────
    // Guard — bleConnected is already checked by the button disabled state,
    // but we double-check here for safety.
    if (!bleConnected) {
      setGpsStatus(GPS_STATUS.ERROR);
      setErrorMsg('Connect to the tracker first, then press Get Location.');
      setIsRequesting(false);
      return;
    }

    try {
      /**
       * bleService.requestLocation():
       *   1. Sends "GET_LOCATION" to the ESP32 via BLE write
       *   2. Waits for the ESP32's BLE notify response
       *   3. Parses "latitude,longitude" string
       *   4. Resolves with { latitude, longitude }
       *   5. Rejects with Error('GPS_NOT_READY') or timeout Error
       */
      const { latitude, longitude } = await bleService.requestLocation(15000);

      // Validate the received coordinates are real numbers in plausible ranges
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        throw new Error('Received out-of-range coordinates.');
      }

      const data = {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      };

      setLocationData(data);
      setGpsStatus(GPS_STATUS.LOCKED);
      if (onLocationUpdate) onLocationUpdate({ ...data, status: 'online' });

    } catch (err) {
      const msg = err.message || '';
      console.error('[LocationDashboard] GPS error:', msg);

      if (msg === 'GPS_NOT_READY') {
        setGpsStatus(GPS_STATUS.NOT_READY);
        setErrorMsg(
          'The GPS module has no satellite fix yet. ' +
          'Move to an area with a clear sky view and try again.'
        );
      } else if (msg.includes('timed out')) {
        setGpsStatus(GPS_STATUS.NOT_READY);
        setErrorMsg(
          'GPS request timed out. ' +
          'Ensure the device is outdoors and try again.'
        );
      } else if (msg.includes('Not connected')) {
        setGpsStatus(GPS_STATUS.ERROR);
        setErrorMsg('Bluetooth connection lost. Please reconnect and try again.');
      } else {
        setGpsStatus(GPS_STATUS.ERROR);
        setErrorMsg('Failed to retrieve location: ' + msg);
      }
    } finally {
      setIsRequesting(false);
    }
  }, [demoMode, bleConnected, onLocationUpdate, isRequesting]);

  // ─── Derived state ──────────────────────────────────────────────────────
  const position = locationData
    ? [locationData.latitude, locationData.longitude]
    : null;

  const isLocked = gpsStatus === GPS_STATUS.LOCKED;

  // Button is enabled when: in demo mode OR real BLE is connected
  const canRequest = demoMode || bleConnected;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="block h-full flex flex-col">

      {/* ── Section header ── */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="uppercase m-0">Tracker Location</h3>
        <button
          id="btn-get-location"
          className="btn"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          onClick={fetchLocation}
          disabled={isRequesting || !canRequest}
          title={
            !canRequest
              ? 'Connect via Bluetooth first, then request GPS'
              : 'Send GET_LOCATION to the ESP32'
          }
        >
          <RefreshCw size={16} className={isRequesting ? 'spin' : ''} />
          {isRequesting ? 'Requesting...' : 'Get Location'}
        </button>
      </div>

      {/* ── GPS Status row ── */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        {/* GPS lock indicator */}
        <div className="flex items-center gap-2 uppercase font-bold" style={{ fontSize: '0.9rem' }}>
          <span
            className={`status-indicator ${isLocked ? 'status-connected' : 'status-disconnected'}`}
          />
          {demoMode && isLocked ? 'Demo Location' : gpsStatus}
        </div>

        {/* Satellite icon when locked */}
        {isLocked && (
          <div
            className="flex items-center gap-2 uppercase font-bold"
            style={{ fontSize: '0.85rem', opacity: 0.7 }}
          >
            <Satellite size={15} /> GPS Fix
          </div>
        )}
      </div>

      {/* ── Instruction hint when no location yet ── */}
      {!canRequest && !locationData && (
        <div
          className="mb-4 uppercase font-bold"
          style={{
            opacity: 0.6,
            border: '1px solid var(--border-color)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.82rem',
          }}
        >
          <MapPin size={13} style={{ display: 'inline', marginRight: '0.4rem' }} />
          Connect Bluetooth → press &quot;Get Location&quot; for live GPS
        </div>
      )}

      {/* ── Error banner ── */}
      {errorMsg && (
        <div
          className="mb-4 uppercase font-bold"
          style={{
            color: 'var(--error-color)',
            border: '1px solid var(--error-color)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ── Interactive Leaflet Map ── */}
      <div
        className="map-container mb-4"
        style={{
          height: '300px',
          border: '2px solid var(--border-color)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {position ? (
          <MapContainer
            center={position}
            zoom={zoomRef.current}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            whenCreated={(map) => {
              map.on('zoomend', () => { zoomRef.current = map.getZoom(); });
            }}
          >
            {/* OpenStreetMap tiles — styled to match the brutalist b&w aesthetic */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              className="map-tiles-brutalist"
            />
            {/* Fly to new coordinates whenever they update */}
            <ChangeView center={position} zoom={zoomRef.current} />
            {/* Tracker marker */}
            <Marker position={position} />
          </MapContainer>
        ) : (
          <div
            className="flex items-center justify-center h-full w-full"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <p className="uppercase font-bold m-0" style={{ opacity: 0.4 }}>
              No GPS Data
            </p>
          </div>
        )}
      </div>

      {/* ── Coordinate details ── */}
      {locationData && (
        <div
          className="grid"
          style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}
        >
          <div>
            <p className="uppercase font-bold m-0" style={{ fontSize: '0.78rem', opacity: 0.6 }}>
              Latitude
            </p>
            <p className="font-bold m-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {locationData.latitude.toFixed(6)}
            </p>
          </div>
          <div>
            <p className="uppercase font-bold m-0" style={{ fontSize: '0.78rem', opacity: 0.6 }}>
              Longitude
            </p>
            <p className="font-bold m-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {locationData.longitude.toFixed(6)}
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p className="uppercase font-bold m-0" style={{ fontSize: '0.78rem', opacity: 0.6 }}>
              Last Updated
            </p>
            <p className="font-bold m-0">
              {new Date(locationData.timestamp).toLocaleTimeString()}
              {demoMode && (
                <span style={{ opacity: 0.5, marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                  (Demo)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
