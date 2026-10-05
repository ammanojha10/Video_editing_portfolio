import React from 'react';

export default function LocationHistory({ history }) {
  return (
    <div className="block mt-4">
      <h3 className="uppercase m-0 mb-4" style={{ fontSize: '1rem' }}>Location History</h3>
      
      {history && history.length > 0 ? (
        <div className="flex flex-col gap-2">
          {history.map((loc, idx) => (
            <div key={idx} className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', opacity: idx === 0 ? 1 : 0.6 }}>
              <span className="uppercase font-bold text-sm">
                {new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-bold text-sm">
                {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="uppercase font-bold text-sm m-0" style={{ opacity: 0.5 }}>No history available</p>
      )}
    </div>
  );
}
