import React from 'react';

export default function HowItWorks() {
  const steps = [
    { num: '01', title: 'Attach', desc: 'Clip the tracker onto your spectacle frame.' },
    { num: '02', title: 'Connect', desc: 'Connect the tracker to your phone using Bluetooth.' },
    { num: '03', title: 'Find', desc: 'Open the Track My Specs website.' },
    { num: '04', title: 'Ring', desc: 'Press “Find My Specs” and the tracker activates its buzzer.' }
  ];

  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <h2>How It Works</h2>
        <div className="grid">
          {steps.map((step) => (
            <div key={step.num} className="block">
              <span className="feature-number">{step.num}</span>
              <h3 className="uppercase">— {step.title}</h3>
              <p style={{ marginBottom: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
