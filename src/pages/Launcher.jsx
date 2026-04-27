import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Power, User, User as UserIcon, History, Volume2 } from 'lucide-react';
import { playTypewriterClick } from '../components/ride/audioCues';
import { dataStore } from '@/services/localStore';
import BootSplash from '../components/ride/BootSplash';
import RiderPicker from '../components/ride/RiderPicker';
import AudioControl from '../components/ride/AudioControl';

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
            fill="#5a5a5a" rx="1" />
        );
      })}
    </svg>
  );
}

export default function Launcher() {
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
    dataStore.entities.Profile.list('-created_date', 1).then((results) => {
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
      navigate(createPageUrl('DurationSelect') + `?program=${program.id}&name=${encodeURIComponent(program.name)}`);
    } else {
      navigate(createPageUrl('RideDisplay') + `?program=${program.id}`);
    }
  };

  if (isPoweredOff) {
    return <div className="h-screen w-screen bg-black cursor-pointer" onClick={() => { setIsPoweredOff(false); setShowSplash(true); }} />;
  }

  const initials = activeProfile?.name ? activeProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col text-white relative"
      style={{ background: '#000' }}
    >
      {showSplash && <BootSplash onComplete={handleSplashComplete} />}

      {showVolumeSlider && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setShowVolumeSlider(false)}>
          <div className="z-50" onClick={e => e.stopPropagation()}>
            <AudioControl volume={volume} setVolume={handleVolumeChange} onClose={() => setShowVolumeSlider(false)} />
          </div>
        </div>
      )}
      {showChangeProfile && (
        <RiderPicker
          currentProfile={activeProfile}
          onSelect={p => setActiveProfile(p)}
          onClose={() => setShowChangeProfile(false)}
          onDelete={() => setActiveProfile(null)}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '10px', gap: '8px' }}>

        {/* Top bar — 80px: profile name on left, three icon buttons on right */}
        <div className="flex items-center flex-shrink-0" style={{ height: '80px', gap: '24px' }}>
          {/* Profile section — flat, no card */}
          <div className="flex-1 flex items-center gap-3 min-w-0 pl-2">
            <UserIcon className="w-5 h-5 text-[#FF3F03] flex-shrink-0" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-widest text-zinc-500 leading-none mb-1">Profile Name</div>
              <div className="text-2xl font-black text-white truncate uppercase tracking-wide">
                {activeProfile ? activeProfile.name : 'No Profile'}
              </div>
            </div>
          </div>

          {/* Action icons — orange, no boxes */}
          {[
            { icon: Volume2, action: () => setShowVolumeSlider(true) },
            { icon: History, action: () => navigate(createPageUrl('SessionLog')) },
            { icon: User,    action: () => setShowChangeProfile(true) },
          ].map(({ icon: Icon, action }, i) => (
            <button key={i}
              onClick={() => { playTypewriterClick(); action(); }}
              className="flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
              style={{ width: '48px', height: '48px' }}
            >
              <Icon className="text-[#FF3F03]" style={{ width: '32px', height: '32px' }} strokeWidth={2.5} />
            </button>
          ))}
        </div>

        {/* Program grid — 222+8+222 = 452 */}
        <div className="grid grid-cols-4 gap-2" style={{ gridTemplateRows: '222px 222px' }}>
          {programs.map((program) => (
            <button key={program.id}
              onClick={() => handleProgramSelect(program)}
              className="relative rounded-lg overflow-hidden flex flex-col items-center justify-center transition-all active:scale-[0.97]"
              style={{ background: '#3f3f3f' }}
            >
              <span className="relative z-10 font-black text-[#FF3F03] text-center leading-tight px-2"
                style={{ fontSize: '24px', marginBottom: '32px' }}
              >
                {program.name}
              </span>

              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2" style={{ height: '36px' }}>
                <MiniChart levels={PROGRAM_CHARTS[program.id] || [3,3,3,3,3,3,3,3,3,3]} />
              </div>
            </button>
          ))}
        </div>

        {/* Power Off — 48px */}
        <button
          onClick={() => { playTypewriterClick(); setIsPoweredOff(true); }}
          className="flex-shrink-0 flex items-center justify-center gap-3 rounded-lg transition-all active:scale-[0.98]"
          style={{ height: '48px', background: '#1a1a1a' }}
        >
          <Power className="text-red-500" style={{ width: '22px', height: '22px' }} strokeWidth={2.5} />
          <span className="font-black text-red-500 tracking-wide" style={{ fontSize: '20px' }}>Power Off</span>
        </button>

      </div>
    </div>
  );
}
