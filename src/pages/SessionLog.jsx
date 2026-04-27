import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataStore } from '@/services/localStore';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Flame, Clock, Route, TrendingUp } from 'lucide-react';
import { playTypewriterClick } from '../components/ride/audioCues';
import SessionCard from '../components/session/SessionCard';
import ChartCard from '../components/session/ChartCard';
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

export default function SessionLog() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => dataStore.entities.Workout.list('-workout_date', 500)
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
    <div className="h-screen w-screen text-white overflow-hidden relative" style={{ background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header — 56px */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ height: '56px', padding: '0 12px' }}>
        <Link
          to={createPageUrl('Launcher')}
          onClick={() => playTypewriterClick()}
          className="w-10 h-10 rounded-md flex items-center justify-center transition-all active:scale-95"
          style={{ background: '#3f3f3f' }}
        >
          <ArrowLeft className="text-[#FF3F03]" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black tracking-wide leading-none uppercase">
            Workout <span className="text-[#FF3F03]">History</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">{filteredWorkouts.length} workouts</p>
        </div>
        {/* Time Period Selector */}
        <div className="flex gap-0.5 rounded-md p-1" style={{ background: '#3f3f3f' }}>
          {TIME_PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => { playTypewriterClick(); setSelectedPeriod(p.label); }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${selectedPeriod === p.label
                  ? 'bg-[#FF3F03] text-white'
                  : 'text-zinc-300'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content — 544px */}
      <div className="overflow-y-auto px-4 py-3" style={{ height: '544px' }}>
        <div className="max-w-4xl mx-auto">

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
              to={createPageUrl('RideDisplay')}
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
                <div key={label} className="rounded-md p-3" style={{ background: '#3f3f3f' }}>
                  <Icon className="w-5 h-5 text-[#FF3F03] mb-1" strokeWidth={2.5} />
                  <p className="text-xl font-black text-white leading-none">{value}</p>
                  <p className="text-zinc-300 text-xs uppercase tracking-wider mt-1 font-semibold">{label}</p>
                </div>
              ))}
            </div>

            {/* Progress Charts */}
            {filteredWorkouts.length >= 2 && (
              <div className="space-y-2 mb-3">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Progress</h2>
                <div className="grid gap-2">
                  <ChartCard
                    data={[...filteredWorkouts].reverse()}
                    dataKey="calories"
                    label="Calories Burned"
                    unit="kcal"
                  />

                  {/* Time per day */}
                  <div className="rounded-xl p-3 border border-zinc-700/40" style={{ background: '#0a0a0a' }}>
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
                  <div className="rounded-xl p-3 border border-zinc-700/40" style={{ background: '#0a0a0a' }}>
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
                  <SessionCard key={workout.id} workout={workout} />
                ))}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
      </div>
    </div>
  );
}