import React from 'react';
import { Bluetooth, MapPin, Wifi, Battery } from 'lucide-react';

export default function HardwareStatus({ bleStatus, gpsStatus, battery }) {
  const isBleConnected = bleStatus === 'Connected' || bleStatus === 'Buzzer Active';
  const isGpsLocked = gpsStatus === 'Locked';

  return (
    <div className="block mb-4">
      <h3 className="uppercase m-0 mb-4" style={{ fontSize: '1rem' }}>Hardware Status</h3>
      
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bluetooth size={18} />
            <span className="uppercase font-bold text-sm">BLE</span>
          </div>
          <span className="uppercase font-bold" style={{ color: isBleConnected ? 'var(--success-color)' : 'var(--text-color)', opacity: isBleConnected ? 1 : 0.5 }}>
            {isBleConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin size={18} />
            <span className="uppercase font-bold text-sm">GPS</span>
          </div>
          <span className="uppercase font-bold" style={{ color: isGpsLocked ? 'var(--success-color)' : 'var(--text-color)', opacity: isGpsLocked ? 1 : 0.5 }}>
            {isGpsLocked ? 'Locked' : 'Searching'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wifi size={18} />
            <span className="uppercase font-bold text-sm">Network</span>
          </div>
          <span className="uppercase font-bold" style={{ color: 'var(--success-color)' }}>
            Connected
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Battery size={18} />
            <span className="uppercase font-bold text-sm">Battery</span>
          </div>
          <span className="uppercase font-bold">
            {battery ? `${battery}%` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
