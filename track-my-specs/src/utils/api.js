import { API_CONFIG, DEMO_CONFIG } from '../config';

class TrackerAPI {
  constructor() {
    this.demoLat = DEMO_CONFIG.START_LAT;
    this.demoLng = DEMO_CONFIG.START_LNG;
  }

  async fetchLocation(isDemoMode) {
    if (isDemoMode) {
      return this.simulateDemoLocation();
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/tracker/location?device_id=${API_CONFIG.DEVICE_ID}`);
      
      if (!response.ok) {
        throw new Error('Backend unavailable or invalid response');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch location:', error);
      throw error;
    }
  }

  simulateDemoLocation() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Slightly random movement for the demo
        this.demoLat += (Math.random() - 0.5) * 0.0005;
        this.demoLng += (Math.random() - 0.5) * 0.0005;

        resolve({
          latitude: this.demoLat,
          longitude: this.demoLng,
          battery: Math.floor(Math.random() * (100 - 60 + 1)) + 60, // Random battery between 60-100
          timestamp: new Date().toISOString(),
          status: 'online'
        });
      }, 800); // Simulate network delay
    });
  }
}

export const trackerApi = new TrackerAPI();
