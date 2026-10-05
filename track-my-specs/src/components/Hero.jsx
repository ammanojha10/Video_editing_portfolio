import React from 'react';

export default function Hero() {
  return (
    <section className="section">
      <div className="container flex flex-col items-center text-center">
        <h1>
          Find Your Specs.<br />
          Before You Lose Your Time.
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Track My Specs is a compact BLE tracker designed to help you locate your spectacles quickly and easily.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#device-control" className="btn btn-primary btn-large">
            Connect My Specs
          </a>
          <a href="#how-it-works" className="btn btn-large">
            See How It Works
          </a>
        </div>
        
        <div className="mt-4 block hero-block" style={{ width: '100%', maxWidth: '800px', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
          <img src="/prototype_design.png" alt="Spectacles with Tracker Prototype" style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto', border: '1px solid var(--border-color)' }} />
          <p className="mt-4 uppercase font-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>Spectacles with Tracker (Fig. 1)</p>
        </div>
      </div>
    </section>
  );
}
