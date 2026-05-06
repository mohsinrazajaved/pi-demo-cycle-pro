export default function GaugeDial({ value, max, label }) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180 - 90;

  const ticks = [];
  const tickCount = 10;
  for (let i = 0; i <= tickCount; i++) {
    const tickAngle = (i / tickCount) * 180 - 90;
    const tickValue = Math.round((i / tickCount) * max);
    const isMainTick = i % 2 === 0;
    const innerRadius = isMainTick ? 50 : 55;
    const outerRadius = 60;

    const x1 = 50 + innerRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
    const y1 = 50 + innerRadius * Math.sin((tickAngle - 90) * Math.PI / 180);
    const x2 = 50 + outerRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
    const y2 = 50 + outerRadius * Math.sin((tickAngle - 90) * Math.PI / 180);

    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isMainTick ? "#9a9a9a" : "#5a5a5a"}
        strokeWidth={isMainTick ? 2.2 : 1.2} />
    );

    if (isMainTick) {
      const labelRadius = 46;
      const lx = 50 + labelRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
      const ly = 50 + labelRadius * Math.sin((tickAngle - 90) * Math.PI / 180);
      ticks.push(
        <text key={`label-${i}`} x={lx} y={ly}
          fill="#c0c0c0" fontSize="8.5" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
          {tickValue}
        </text>
      );
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center rounded-md overflow-hidden"
      style={{ background: '#000' }}
    >
      <svg
        viewBox="-14 -14 128 76"
        className="flex-1 w-full min-h-0 relative z-10"
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Background arc */}
        <path d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none" stroke="#2a2a2a" strokeWidth="8" strokeLinecap="round" />

        {/* Value arc */}
        <path d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none" stroke="#FF3F03" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          style={{ filter: 'drop-shadow(0 0 3px #FF3F03)' }} />

        {ticks}

        {/* Needle */}
        <g transform={`rotate(${angle}, 50, 50)`}>
          <polygon points="50,18 47.5,50 52.5,50" fill="#FF3F03"
            style={{ filter: 'drop-shadow(0 0 2px #FF3F03)' }} />
          <circle cx="50" cy="50" r="3.5" fill="#FF3F03" />
          <circle cx="50" cy="50" r="1.5" fill="#1a0500" />
        </g>

        {/* Center value — inside the dial face */}
        <text x="50" y="40" fill="white" fontSize="16" fontWeight="900"
          textAnchor="middle" dominantBaseline="middle">
          {typeof value === 'number' ? Math.round(value) : value}
        </text>
      </svg>
      {/* Label flows naturally below the SVG — no absolute positioning, never gets clipped */}
      <div className="flex-shrink-0 pb-2 pt-0.5 relative z-10">
        <span className="uppercase tracking-[0.2em] text-zinc-400 font-semibold" style={{ fontSize: 'clamp(10px, 1.8vh, 14px)' }}>{label}</span>
      </div>
    </div>
  );
}
