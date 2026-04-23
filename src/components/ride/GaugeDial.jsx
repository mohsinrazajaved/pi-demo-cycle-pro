export default function GaugeDial({ value, max, label }) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180 - 90;

  const ticks = [];
  const tickCount = 10;
  for (let i = 0; i <= tickCount; i++) {
    const tickAngle = (i / tickCount) * 180 - 90;
    const tickValue = Math.round((i / tickCount) * max);
    const isMainTick = i % 2 === 0;
    const innerRadius = isMainTick ? 55 : 60;
    const outerRadius = 68;

    const x1 = 50 + innerRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
    const y1 = 50 + innerRadius * Math.sin((tickAngle - 90) * Math.PI / 180);
    const x2 = 50 + outerRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
    const y2 = 50 + outerRadius * Math.sin((tickAngle - 90) * Math.PI / 180);

    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isMainTick ? "#666" : "#444"}
        strokeWidth={isMainTick ? 2 : 1} />
    );

    if (isMainTick) {
      const labelRadius = 45;
      const lx = 50 + labelRadius * Math.cos((tickAngle - 90) * Math.PI / 180);
      const ly = 50 + labelRadius * Math.sin((tickAngle - 90) * Math.PI / 180);
      ticks.push(
        <text key={`label-${i}`} x={lx} y={ly}
          fill="#888" fontSize="7" textAnchor="middle" dominantBaseline="middle">
          {tickValue}
        </text>
      );
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 100 62"
        className="flex-1 w-full min-h-0"
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Background arc */}
        <path d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none" stroke="#333" strokeWidth="6" strokeLinecap="round" />

        {/* Value arc */}
        <path d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none" stroke="#FF3F03" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          style={{ filter: 'drop-shadow(0 0 4px #FF3F03)' }} />

        {ticks}

        {/* Needle */}
        <g transform={`rotate(${angle}, 50, 50)`}>
          <polygon points="50,20 48,50 52,50" fill="#FF3F03"
            style={{ filter: 'drop-shadow(0 0 2px #FF3F03)' }} />
          <circle cx="50" cy="50" r="3" fill="#FF3F03" />
        </g>

        {/* Center value — positioned above the arc baseline so it never overlaps the label */}
        <text x="50" y="44" fill="white" fontSize="14" fontWeight="bold"
          textAnchor="middle" dominantBaseline="middle">
          {typeof value === 'number' ? Math.round(value) : value}
        </text>
      </svg>
      {/* Label flows naturally below the SVG — no absolute positioning, never gets clipped */}
      <div className="flex-shrink-0 pt-1 pb-1">
        <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
    </div>
  );
}
