import React from 'react';

export default function Features() {
  const features = [
    { num: '01', title: 'BLE Connectivity', desc: 'Connect directly to the tracker using Bluetooth Low Energy.' },
    { num: '02', title: 'Instant Alert', desc: 'Activate the buzzer with one tap.' },
    { num: '03', title: 'Compact Design', desc: 'Small clip-on form factor designed for spectacles.' },
    { num: '04', title: 'Rechargeable', desc: 'Designed for convenient everyday use with a rechargeable battery.' }
  ];

  return (
    <section id="features" className="section" style={{ backgroundColor: 'var(--accent-color)' }}>
      <div className="container">
        <h2>Features</h2>
        <div className="grid">
          {features.map((feature) => (
            <div key={feature.num} className="block" style={{ backgroundColor: 'var(--bg-color)' }}>
              <span className="feature-number">{feature.num}</span>
              <h3 className="uppercase">{feature.title}</h3>
              <p style={{ marginBottom: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
