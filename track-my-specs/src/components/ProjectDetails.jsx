import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function ProjectDetails() {
  return (
    <section id="project" className="section">
      <div className="container">
        <h2>The Project</h2>
        <div className="grid">
          <div>
            <p>
              Track My Specs is an engineering minor project combining hardware and web technologies to solve a common everyday problem.
            </p>
            <div className="flex gap-2 flex-wrap mb-4">
              {['Embedded Systems', 'Bluetooth Low Energy', 'ESP32-C3', 'IoT', 'Web Bluetooth', 'Power Management', 'Compact Hardware Design'].map((tag) => (
                <span key={tag} style={{ border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="block">
            <h3 className="uppercase text-center mb-4">System Overview</h3>
            <p className="text-center font-bold mb-4" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Track My Specs combines BLE for nearby finding with GPS/GNSS and internet connectivity for remote location monitoring.
            </p>
            <div className="diagram-box">GPS / GNSS</div>
            <div className="diagram-arrow"><ArrowDown size={32} style={{ margin: '0 auto' }} /></div>
            <div className="diagram-box">ESP32-C3</div>
            <div className="diagram-arrow"><ArrowDown size={32} style={{ margin: '0 auto' }} /></div>
            <div className="diagram-box">COMMUNICATION MODULE (Wi-Fi/Cellular)</div>
            <div className="diagram-arrow"><ArrowDown size={32} style={{ margin: '0 auto' }} /></div>
            <div className="diagram-box">CLOUD / API</div>
            <div className="diagram-arrow"><ArrowDown size={32} style={{ margin: '0 auto' }} /></div>
            <div className="diagram-box">WEBSITE (MAP & DASHBOARD)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
