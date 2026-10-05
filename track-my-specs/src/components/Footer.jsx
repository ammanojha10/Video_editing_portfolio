import React from 'react';

export default function Footer() {
  return (
    <footer className="section" style={{ borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--bg-color)', padding: '4rem 0' }}>
      <div className="container text-center">
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Track My Specs</h2>
        <p className="uppercase font-bold" style={{ fontStyle: 'italic', opacity: 0.7 }}>
          “Never lose your glasses again.”
        </p>
        
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="uppercase" style={{ fontSize: '0.9rem', marginBottom: 0 }}>
            Engineering Minor Project<br />
            Department of Electronics and Computer Science
          </p>
        </div>
      </div>
    </footer>
  );
}
