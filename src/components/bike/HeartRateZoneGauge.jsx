import React from 'react';

const ZONES = [
  { name: 'Light', min: 0, max: 60 },
  { name: 'Fat Burn', min: 60, max: 70 },
  { name: 'Aerobic', min: 70, max: 80 },
  { name: 'Threshold', min: 80, max: 90 },
  { name: 'Anaerobic', min: 90, max: 100 },
];

export default function HeartRateZoneGauge({ heartRate, maxHeartRate = 180 }) {
  const percentage = Math.min((heartRate / maxHeartRate) * 100, 100);
  
  // Find current zone
  const currentZone = ZONES.find(z => percentage >= z.min && percentage < z.max) || ZONES[ZONES.length - 1];
  
  // Calculate needle angle (0-180 degrees mapped to 0-100%)
  const angle = (percentage / 100) * 180 - 90;

  return (
    <div className="relative w-full h-full flex flex-col">
      <svg viewBox="0 0 100 58" className="w-full flex-1">
        <defs>
          <linearGradient id="zoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="25%" stopColor="#a3e635" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="75%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#FF3F03" />
          </linearGradient>
        </defs>
        
        {/* Full gradient arc background */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#333"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Gradient arc fill */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="url(#zoneGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Tick marks */}
        {[0, 20, 40, 60, 80, 100].map((tick, idx) => {
          const tickAngle = (tick / 100) * 180 - 90;
          const innerRadius = 32;
          const outerRadius = 42;
          const x1 = 50 + innerRadius * Math.cos((tickAngle) * Math.PI / 180);
          const y1 = 50 + innerRadius * Math.sin((tickAngle) * Math.PI / 180);
          const x2 = 50 + outerRadius * Math.cos((tickAngle) * Math.PI / 180);
          const y2 = 50 + outerRadius * Math.sin((tickAngle) * Math.PI / 180);
          
          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#666"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Needle */}
        <g transform={`rotate(${angle}, 50, 50)`}>
          <polygon
            points="50,15 48,50 52,50"
            fill="#FF3F03"
            style={{ filter: 'drop-shadow(0 0 2px #FF3F03)' }}
          />
          <circle cx="50" cy="50" r="4" fill="#FF3F03" />
        </g>
        
        {/* Heart rate value */}
        <text
          x="50"
          y="42"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
        >
          {heartRate}
        </text>
        <text
          x="50"
          y="50"
          fill="#888"
          fontSize="5"
          textAnchor="middle"
        >
          BPM
        </text>
      </svg>
      
      {/* Current zone label */}
      <div 
        className="text-center py-1 rounded-md mx-1 bg-[#FF3F03]/20"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-[#FF3F03]">{currentZone.name}</span>
      </div>
    </div>
  );
}