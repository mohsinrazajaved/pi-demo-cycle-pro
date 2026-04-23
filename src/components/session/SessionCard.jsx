import React from 'react';
import { format } from 'date-fns';
import { Flame, Clock, Route, Gauge, Heart, Zap, Activity } from 'lucide-react';

export default function SessionCard({ workout }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-zinc-400 text-sm">
            {format(new Date(workout.workout_date), 'EEEE, MMM d')}
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">
            {format(new Date(workout.workout_date), 'h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 font-bold">{workout.calories}</span>
          <span className="text-orange-400/60 text-xs">kcal</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
          <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <p className="text-white font-semibold">{formatDuration(workout.duration_seconds)}</p>
          <p className="text-zinc-500 text-xs">Duration</p>
        </div>
        <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
          <Route className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-white font-semibold">{workout.distance_km?.toFixed(1)}</p>
          <p className="text-zinc-500 text-xs">km</p>
        </div>
        <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
          <Gauge className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <p className="text-white font-semibold">{workout.avg_speed_kmh?.toFixed(1)}</p>
          <p className="text-zinc-500 text-xs">km/h avg</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="flex items-center justify-between text-sm text-zinc-400 border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>{workout.avg_heart_rate || '--'} bpm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{workout.avg_power || '--'}w</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>{workout.avg_cadence || '--'} rpm</span>
        </div>
      </div>
    </div>
  );
}