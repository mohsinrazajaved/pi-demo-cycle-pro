import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

function addTrend(points, valueKey) {
  const n = points.length;
  if (n < 2) return points;
  const sumX = points.reduce((s, _, i) => s + i, 0);
  const sumY = points.reduce((s, p) => s + (p[valueKey] || 0), 0);
  const sumXY = points.reduce((s, p, i) => s + i * (p[valueKey] || 0), 0);
  const sumX2 = points.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return points.map((p, i) => ({
    ...p,
    trend: Math.max(0, Math.round((slope * i + intercept) * 10) / 10)
  }));
}

export default function ChartCard({ data, dataKey, label, unit }) {
  const COLOR = '#FF3F03';
  const TREND_COLOR = '#9ca3af';

  const chartData = addTrend(
    data.map(workout => ({
      date: format(new Date(workout.workout_date), 'MMM d'),
      value: workout[dataKey] || 0
    })),
    'value'
  );

  return (
    <div className="rounded-md p-4" style={{ background: '#0a0a0a' }}>
      <h3 className="text-xs font-bold text-zinc-300 mb-3 uppercase tracking-widest">{label}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-md px-3 py-2" style={{ background: '#3f3f3f' }}>
                    <p className="text-zinc-400 text-xs mb-1">{label}</p>
                    <p className="text-white font-bold">
                      {payload.find(p => p.dataKey === 'value')?.value?.toFixed(1)} {unit}
                    </p>
                  </div>
                ) : null
              }
            />
            <Area type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2} fill={`url(#gradient-${dataKey})`} dot={false} />
            <Line type="monotone" dataKey="trend" stroke={TREND_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: COLOR }} /><span className="text-xs text-zinc-500">{label}</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: TREND_COLOR }} /><span className="text-xs text-zinc-500">Trend</span></div>
      </div>
    </div>
  );
}