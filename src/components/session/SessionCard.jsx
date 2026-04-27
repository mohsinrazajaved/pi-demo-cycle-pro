import React from 'react';
import { format } from 'date-fns';
import { Flame, Clock, Route, Gauge, Heart, Zap, Activity } from 'lucide-react';

export default function SessionCard({ workout }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="rounded-md p-4" style={{ background: '#3f3f3f' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-zinc-200 text-sm font-bold">
            {format(new Date(workout.workout_date), 'EEEE, MMM d')}
          </p>
          <p className="text-zinc-400 text-xs mt-0.5">
            {format(new Date(workout.workout_date), 'h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{ background: '#000' }}>
          <Flame className="w-4 h-4 text-[#FF3F03]" strokeWidth={2.5} />
          <span className="text-[#FF3F03] font-black">{workout.calories}</span>
          <span className="text-zinc-400 text-xs">kcal</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded" style={{ background: '#000' }}>
          <Clock className="w-4 h-4 text-[#FF3F03] mx-auto mb-1" strokeWidth={2.5} />
          <p className="text-white font-black">{formatDuration(workout.duration_seconds)}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Duration</p>
        </div>
        <div className="text-center p-2 rounded" style={{ background: '#000' }}>
          <Route className="w-4 h-4 text-[#FF3F03] mx-auto mb-1" strokeWidth={2.5} />
          <p className="text-white font-black">{workout.distance_km?.toFixed(1)}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-wider">km</p>
        </div>
        <div className="text-center p-2 rounded" style={{ background: '#000' }}>
          <Gauge className="w-4 h-4 text-[#FF3F03] mx-auto mb-1" strokeWidth={2.5} />
          <p className="text-white font-black">{workout.avg_speed_kmh?.toFixed(1)}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-wider">km/h avg</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="flex items-center justify-between text-sm text-zinc-300 pt-3 border-t border-zinc-700">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-[#FF3F03]" strokeWidth={2.5} />
          <span className="font-semibold">{workout.avg_heart_rate || '--'} bpm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#FF3F03]" strokeWidth={2.5} />
          <span className="font-semibold">{workout.avg_power || '--'}w</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#FF3F03]" strokeWidth={2.5} />
          <span className="font-semibold">{workout.avg_cadence || '--'} rpm</span>
        </div>
      </div>
    </div>
  );
}
