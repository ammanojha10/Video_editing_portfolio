import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LocationDashboard from './components/LocationDashboard';
import DeviceControl from './components/DeviceControl';
import HardwareStatus from './components/HardwareStatus';
import LocationHistory from './components/LocationHistory';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import ProjectDetails from './components/ProjectDetails';
import HardwareDetails from './components/HardwareDetails';
import FutureScope from './components/FutureScope';
import Footer from './components/Footer';
import { STORAGE_KEYS } from './config';

function App() {
  const [theme, setTheme] = useState('light');
  const [demoMode, setDemoMode] = useState(false);
  const [bleStatus, setBleStatus] = useState('Disconnected');
  const [gpsStatus, setGpsStatus] = useState('Location Unavailable');
  const [battery, setBattery] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLocationUpdate = (data) => {
    setGpsStatus(data.status === 'online' ? 'Locked' : 'Offline');
    // Battery is not transmitted over GPS BLE characteristic — left as N/A

    // Add to location history (keep last 5)
    setHistory(prev => {
      const newHistory = [data, ...prev];
      return newHistory.slice(0, 5);
    });
  };

  // True whenever a real (or demo) BLE session is active
  const bleConnected =
    bleStatus === 'Connected' ||
    bleStatus === 'Buzzer Active' ||
    bleStatus === 'Buzzer Off';

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero />
        
        {/* Main Product Dashboard Layout */}
        <section id="dashboard" className="section" style={{ backgroundColor: 'var(--accent-color)', paddingTop: '4rem' }}>
          <div className="container">
            <h2 className="mb-4 text-center">Smart Tracker Dashboard</h2>
            <p className="text-center mb-4 uppercase font-bold" style={{ opacity: 0.7 }}>Connect → Monitor → Locate → Find</p>
            
            <div className="dashboard-grid">
              {/* Left Column: Map */}
              <div className="dashboard-col-left">
                <LocationDashboard
                  demoMode={demoMode}
                  bleConnected={bleConnected}
                  onLocationUpdate={handleLocationUpdate}
                />
              </div>
              
              {/* Right Column: Status and Controls */}
              <div className="dashboard-col-right">
                <HardwareStatus 
                  bleStatus={bleStatus} 
                  gpsStatus={gpsStatus} 
                  battery={battery} 
                />
                
                <DeviceControl 
                  demoMode={demoMode} 
                  setDemoMode={setDemoMode} 
                  onBleStatusChange={setBleStatus} 
                />
                
                <LocationHistory history={history} />
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
        <Features />
        <ProjectDetails />
        <HardwareDetails />
        <FutureScope />
      </main>
      <Footer />
    </>
  );
}

export default App;
