// Bluetooth Configuration Constants
// UUIDs match the ESP32-C3 Arduino firmware exactly
export const BLE_CONFIG = {
  SERVICE_UUID: '12345678-1234-1234-1234-1234567890ab',
  CHARACTERISTIC_UUID: '87654321-4321-4321-4321-ba0987654321',

  // Commands sent to the tracker
  COMMANDS: {
    BUZZ_ON: 'BUZZ_ON',
    BUZZ_OFF: 'BUZZ_OFF',
    GET_LOCATION: 'GET_LOCATION'
  }
};

// API / Backend Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.example.com', // Replace with your actual backend URL
  DEVICE_ID: 'TRACKER_001',
  POLLING_INTERVAL_MS: 15000 // 15 seconds
};

// Demo Mode Constants
export const DEMO_CONFIG = {
  START_LAT: 20.2961,
  START_LNG: 85.8245
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'track-my-specs-theme',
  LAST_CONNECTED: 'track-my-specs-last-connected'
};
