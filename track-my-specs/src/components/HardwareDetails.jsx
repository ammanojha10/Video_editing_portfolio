import React from 'react';

export default function HardwareDetails() {
  const components = [
    'ESP32-C3',
    'GPS Module (NMEA)',
    'Li-Po Battery',
    'Buzzer',
    'Charging Circuit',
    'LED',
    'Custom PCB',
    'Clip-on Enclosure',
  ];

  return (
    <section className="section" style={{ backgroundColor: 'var(--accent-color)' }}>
      <div className="container">
        <h2>Hardware Components</h2>
        <div className="flex flex-wrap gap-4">
          {components.map((comp, idx) => (
            <div key={idx} className="block flex-1" style={{ minWidth: '200px', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
              <span className="uppercase font-bold">{comp}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
