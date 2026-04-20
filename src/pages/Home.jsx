import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Power, User, History, Volume2 } from 'lucide-react';
import { playTypewriterClick } from '../components/bike/sounds';
import { mockDB } from '@/api/mockDataService';
import SplashScreen from '../components/bike/SplashScreen';
import ChangeProfileModal from '../components/bike/ChangeProfileModal';
import VolumeSlider from '../components/bike/VolumeSlider';

// Module-level flag: splash shows once per app session (resets on page reload).
// Navigating back to Home from another page does NOT trigger it again.
let splashShownThisSession = false;

const PROGRAM_CHARTS = {
  'gc-fat-burn':    [3,3,3,3,3,3,3,3,3,3],
  'small-plateau':  [2,4,6,6,6,6,6,6,4,2],
  'small-step':     [2,4,6,4,2,2,4,6,4,2],
  'small-interval': [2,2,6,2,6,2,6,2,6,2],
  'manual':         [3,3,3,3,3,3,3,3,3,3],
  'large-plateau':  [3,6,9,9,9,9,9,9,6,3],
  'big-step':       [3,6,9,6,3,3,6,9,6,3],
  'large-interval': [3,3,9,3,9,3,9,3,9,3],
};

function MiniChart({ levels }) {
  const max = 9;
  return (
    <svg viewBox="0 0 109 28" className="w-full h-full" preserveAspectRatio="none">
      {levels.map((level, i) => {
        const h = (level / max) * 28;
        return (
          <rect key={i} x={i * 11} y={28 - h} width="10" height={h}
            fill="rgba(255,63,3,0.25)" rx="1.5" />
        );
      })}
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [activeProfile, setActiveProfile] = useState(null);
  const [isPoweredOff, setIsPoweredOff] = useState(false);
  const [showSplash, setShowSplash] = useState(!splashShownThisSession); // only on first app load
  const [showChangeProfile, setShowChangeProfile] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('bikeVolume') ?? 100));

  const handleVolumeChange = (val) => {
    setVolume(val);
    localStorage.setItem('bikeVolume', String(val));
  };

  useEffect(() => {
    mockDB.entities.Profile.list('-created_date', 1).then((results) => {
      if (results.length > 0) setActiveProfile(results[0]);
    });
  }, []);

  const programs = [
    { name: 'GC Fat Burn',      id: 'gc-fat-burn',      selectTime: true },
    { name: 'Small Plateau',    id: 'small-plateau',    selectTime: true },
    { name: 'Small Pyramids',   id: 'small-step',       selectTime: true },
    { name: 'Small Interval',   id: 'small-interval',   selectTime: true },
    { name: 'Manual',           id: 'manual',           selectTime: false },
    { name: 'Large Plateau',    id: 'large-plateau',    selectTime: true },
    { name: 'Large Pyramids',   id: 'big-step',         selectTime: true },
    { name: 'Large Interval',   id: 'large-interval',   selectTime: true },
  ];

  const handleSplashComplete = useCallback(() => {
    splashShownThisSession = true;
    setShowSplash(false);
  }, []);

  const handleProgramSelect = (program) => {
    playTypewriterClick();
    if (program.selectTime) {
      navigate(createPageUrl('Time') + `?program=${program.id}&name=${encodeURIComponent(program.name)}`);
    } else {
      navigate(createPageUrl('BikeComputer') + `?program=${program.id}`);
    }
  };

  if (isPoweredOff) {
    return <div className="h-screen w-screen bg-black cursor-pointer" onClick={() => { setIsPoweredOff(false); setShowSplash(true); }} />;
  }

  const initials = activeProfile?.name ? activeProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col text-white relative"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0800 0%, #0d0d0d 60%, #080808 100%)' }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF3F03]/60 to-transparent" />

      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {showVolumeSlider && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setShowVolumeSlider(false)}>
          <div className="z-50" onClick={e => e.stopPropagation()}>
            <VolumeSlider volume={volume} setVolume={handleVolumeChange} onClose={() => setShowVolumeSlider(false)} />
          </div>
        </div>
      )}
      {showChangeProfile && (
        <ChangeProfileModal
          currentProfile={activeProfile}
          onSelect={p => setActiveProfile(p)}
          onClose={() => setShowChangeProfile(false)}
          onDelete={() => setActiveProfile(null)}
        />
      )}

      <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">

        {/* Top bar */}
        <div className="flex gap-2 flex-shrink-0" style={{ height: '60px' }}>
          {/* Profile card */}
          <div className="flex-1 flex items-center gap-2.5 px-3 rounded-xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-[#FF3F03]/20 border border-[#FF3F03]/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#FF3F03]">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 leading-none">Rider</div>
              <div className="text-xl font-bold text-white truncate leading-tight">
                {activeProfile ? activeProfile.name : 'No Profile'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {[
            { icon: Volume2,  action: () => setShowVolumeSlider(true),  label: 'Volume' },
            { icon: History,  action: () => navigate(createPageUrl('WorkoutHistory')), label: 'History' },
            { icon: User,     action: () => setShowChangeProfile(true), label: 'Profile' },
          ].map(({ icon: Icon, action, label }) => (
            <button key={label}
              onClick={() => { playTypewriterClick(); action(); }}
              className="w-16 flex flex-col items-center justify-center gap-0.5 rounded-xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-sm hover:bg-zinc-800/80 hover:border-[#FF3F03]/30 transition-all active:scale-95"
            >
              <Icon className="w-6 h-6 text-[#FF3F03]" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>

        {/* Program grid */}
        <div className="flex-1 grid grid-cols-4 gap-2 min-h-0" style={{ gridTemplateRows: '1fr 1fr' }}>
          {programs.map((program) => (
            <button key={program.id}
              onClick={() => handleProgramSelect(program)}
              className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all active:scale-[0.97] group"
              style={{
                background: 'linear-gradient(145deg, #1e1e1e 0%, #141414 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,63,3,0.12) 0%, transparent 70%)' }} />
              {/* Top accent on hover */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF3F03]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Program name */}
              <span className="relative z-10 font-bold text-base text-white text-center leading-tight px-2 mb-2">{program.name}</span>

              {/* Mini chart */}
              <div className="absolute bottom-0 left-0 right-0 h-10 px-3 pb-2">
                <MiniChart levels={PROGRAM_CHARTS[program.id] || [3,3,3,3,3,3,3,3,3,3]} />
              </div>
            </button>
          ))}
        </div>

        {/* Power Off */}
        <button
          onClick={() => { playTypewriterClick(); setIsPoweredOff(true); }}
          className="flex-shrink-0 flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/30 hover:bg-red-900/40 transition-all active:scale-[0.98]"
          style={{ height: '44px' }}
        >
          <Power className="w-5 h-5 text-red-500" />
          <span className="text-base font-bold text-red-500 uppercase tracking-wider">Power Off</span>
        </button>

      </div>
    </div>
  );
}
