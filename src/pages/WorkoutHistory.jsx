import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockDB } from '@/api/mockDataService';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Flame, Clock, Route, TrendingUp } from 'lucide-react';
import { playTypewriterClick } from '../components/bike/sounds';
import WorkoutCard from '../components/history/WorkoutCard';
import ProgressChart from '../components/history/ProgressChart';
import { Skeleton } from "@/components/ui/skeleton";
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { format } from 'date-fns';

const COLOR = '#FF3F03';
const TREND_COLOR = '#9ca3af';

function addTrend(points, valueKey) {
  const n = points.length;
  if (n < 2) return points;
  const sumX = points.reduce((s, _, i) => s + i, 0);
  const sumY = points.reduce((s, p) => s + (p[valueKey] || 0), 0);
  const sumXY = points.reduce((s, p, i) => s + i * (p[valueKey] || 0), 0);
  const sumX2 = points.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return points.map((p, i) => ({ ...p, trend: Math.max(0, Math.round((slope * i + intercept) * 10) / 10) }));
}

const TIME_PERIODS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
];

export default function WorkoutHistory() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => mockDB.entities.Workout.list('-workout_date', 500)
  });

  const filteredWorkouts = useMemo(() => {
    const period = TIME_PERIODS.find(p => p.label === selectedPeriod);
    if (!period || period.days === null) return workouts;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period.days);
    return workouts.filter(w => new Date(w.workout_date) >= cutoff);
  }, [workouts, selectedPeriod]);

  const totalCalories = filteredWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  const totalDuration = filteredWorkouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0);
  const totalDistance = filteredWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);

  const dailyMinutesData = useMemo(() => {
    const byDay = {};
    filteredWorkouts.forEach(w => {
      const day = format(new Date(w.workout_date), 'MMM d');
      byDay[day] = (byDay[day] || 0) + (w.duration_seconds || 0) / 60;
    });
    const points = [...filteredWorkouts].reverse().reduce((acc, w) => {
      const day = format(new Date(w.workout_date), 'MMM d');
      if (!acc.find(d => d.date === day)) acc.push({ date: day, minutes: Math.round(byDay[day]) });
      return acc;
    }, []);
    return addTrend(points, 'minutes');
  }, [filteredWorkouts]);

  const dailyWattsData = useMemo(() => {
    const byDay = {};
    const countByDay = {};
    filteredWorkouts.forEach(w => {
      const day = format(new Date(w.workout_date), 'MMM d');
      byDay[day] = (byDay[day] || 0) + (w.avg_power || 0);
      countByDay[day] = (countByDay[day] || 0) + 1;
    });
    const points = [...filteredWorkouts].reverse().reduce((acc, w) => {
      const day = format(new Date(w.workout_date), 'MMM d');
      if (!acc.find(d => d.date === day)) acc.push({ date: day, watts: Math.round(byDay[day] / countByDay[day]) });
      return acc;
    }, []);
    return addTrend(points, 'watts');
  }, [filteredWorkouts]);

  const formatTotalTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="h-screen w-screen text-white overflow-hidden flex flex-col"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0800 0%, #0d0d0d 60%, #080808 100%)' }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px z-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,63,3,0.6), transparent)' }} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
        <Link
          to={createPageUrl('Home')}
          onClick={() => playTypewriterClick()}
          className="w-8 h-8 rounded-xl border border-zinc-700/50 flex items-center justify-center transition-all hover:border-[#FF3F03]/40 active:scale-95"
          style={{ background: 'linear-gradient(145deg, #1e1e1e, #141414)' }}
        >
          <ArrowLeft className="w-4 h-4 text-[#FF3F03]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold tracking-tight leading-none">
            Workout <span className="text-[#FF3F03]">History</span>
          </h1>
          <p className="text-zinc-500 text-xs">{filteredWorkouts.length} workouts</p>
        </div>
        {/* Time Period Selector */}
        <div className="flex gap-0.5 rounded-xl border border-zinc-700/50 p-0.5"
          style={{ background: 'linear-gradient(145deg, #1a1a1a, #111)' }}
        >
          {TIME_PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => { playTypewriterClick(); setSelectedPeriod(p.label); }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${selectedPeriod === p.label
                  ? 'bg-[#FF3F03] text-white'
                  : 'text-zinc-400 hover:text-white'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="max-w-2xl mx-auto">

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-zinc-800" />
            <Skeleton className="h-40 w-full bg-zinc-800" />
            <Skeleton className="h-40 w-full bg-zinc-800" />
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-zinc-700/50 flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, #1e1e1e, #141414)' }}
            >
              <TrendingUp className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-base font-medium text-zinc-400 mb-1">No workouts yet</h3>
            <p className="text-zinc-600 text-xs mb-5">Complete your first ride to start tracking progress</p>
            <Link
              to={createPageUrl('BikeComputer')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-[#FF3F03]/50 text-[#FF3F03] font-medium text-sm transition-all hover:bg-[#FF3F03]/10"
            >
              Start Riding
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { icon: Flame, value: totalCalories.toLocaleString(), label: 'Calories' },
                { icon: Clock, value: formatTotalTime(totalDuration),  label: 'Time' },
                { icon: Route, value: `${totalDistance.toFixed(1)} km`, label: 'Distance' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl p-2.5 border border-[#FF3F03]/20 relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, rgba(30,15,5,0.9), rgba(15,8,3,0.9))' }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at 0% 0%, #FF3F03, transparent 70%)' }} />
                  <Icon className="w-4 h-4 text-[#FF3F03] mb-1 relative z-10" />
                  <p className="text-lg font-bold text-white leading-none relative z-10">{value}</p>
                  <p className="text-[#FF3F03]/60 text-xs uppercase tracking-wider mt-0.5 relative z-10">{label}</p>
                </div>
              ))}
            </div>

            {/* Progress Charts */}
            {filteredWorkouts.length >= 2 && (
              <div className="space-y-2 mb-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Progress</h2>
                <div className="grid gap-2">
                  <ProgressChart
                    data={[...filteredWorkouts].reverse()}
                    dataKey="calories"
                    label="Calories Burned"
                    unit="kcal"
                  />

                  {/* Time per day */}
                  <div className="rounded-xl p-3 border border-zinc-700/40" style={{ background: 'linear-gradient(145deg, #1a1a1a, #111)' }}>
                    <h3 className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-widest">Time Riding Per Day</h3>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dailyMinutesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradient-time" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLOR} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-zinc-400 text-xs mb-1">{label}</p>
                              <p className="text-white font-bold">{payload.find(p => p.dataKey === 'minutes')?.value} min</p>
                            </div>
                          ) : null} />
                          <Area type="monotone" dataKey="minutes" stroke={COLOR} strokeWidth={2} fill="url(#gradient-time)" dot={false} />
                          <Line type="monotone" dataKey="trend" stroke={TREND_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 4" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: COLOR }} /><span className="text-xs text-zinc-500">Daily minutes</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: TREND_COLOR }} /><span className="text-xs text-zinc-500">Trend</span></div>
                    </div>
                  </div>

                  {/* Avg watts per day */}
                  <div className="rounded-xl p-3 border border-zinc-700/40" style={{ background: 'linear-gradient(145deg, #1a1a1a, #111)' }}>
                    <h3 className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-widest">Avg Watts Per Day</h3>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dailyWattsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradient-watts" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLOR} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-zinc-400 text-xs mb-1">{label}</p>
                              <p className="text-white font-bold">{payload.find(p => p.dataKey === 'watts')?.value} W</p>
                            </div>
                          ) : null} />
                          <Area type="monotone" dataKey="watts" stroke={COLOR} strokeWidth={2} fill="url(#gradient-watts)" dot={false} />
                          <Line type="monotone" dataKey="trend" stroke={TREND_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 4" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: COLOR }} /><span className="text-xs text-zinc-500">Avg watts</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 rounded" style={{ background: TREND_COLOR }} /><span className="text-xs text-zinc-500">Trend</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workout List */}
            <div className="space-y-3 pb-2">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Workouts</h2>
              <div className="space-y-2">
                {filteredWorkouts.map(workout => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}