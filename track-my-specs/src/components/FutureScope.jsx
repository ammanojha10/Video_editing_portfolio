import React from 'react';

export default function FutureScope() {
  const scope = [
    'Leave-behind alerts',
    'More accurate proximity detection',
    'UWB integration',
    'Find My Device ecosystem integration',
    'Improved battery optimization',
    'Smaller custom PCB',
    'Waterproof enclosure'
  ];

  return (
    <section className="section">
      <div className="container">
        <h2>Future Scope</h2>
        <div className="grid">
          <ul style={{ listStyle: 'none' }}>
            {scope.map((item, idx) => (
              <li key={idx} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span className="uppercase font-bold" style={{ opacity: 0.5, marginRight: '1rem' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-bold">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
