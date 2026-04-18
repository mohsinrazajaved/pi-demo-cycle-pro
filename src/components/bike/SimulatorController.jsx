import React, { useState, useRef } from 'react';
import { Slider } from "@/components/ui/slider";
import { Heart, Gauge, Zap, Settings2, GripVertical, ChevronDown } from 'lucide-react';

export default function SimulatorController({ 
  heartRate, 
  setHeartRate, 
  rpm, 
  setRpm, 
  power, 
  setPower, 
  resistance, 
  setResistance,
  maxResistance = 30,
  onHeartRateHold,
  timeMultiplier = 1,
  setTimeMultiplier
}) {
  const [isHoldingHR, setIsHoldingHR] = useState(false);
  const [position, setPosition] = useState({ x: 8, y: 8 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleHeartRateHold = () => {
    onHeartRateHold?.();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 288, e.clientX - offsetRef.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - offsetRef.current.y))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      ref={dragRef}
      className="fixed bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50"
      style={{ left: position.x, top: position.y, width: isExpanded ? '224px' : 'auto' }}
    >
      {/* Header with Drag Handle and Collapse Toggle */}
      <div 
        className="flex items-center justify-between p-3 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-xs font-bold text-[#FF3F03] uppercase tracking-widest">Sim</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center justify-center hover:text-[#FF3F03] transition-colors"
          >
            <ChevronDown 
              className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          <GripVertical className="w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {/* Collapsible Controls */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Heart Rate Sensor Simulation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span className="text-[10px] text-zinc-400">Heart Rate</span>
              </div>
              <span className="text-[10px] font-mono text-white">{heartRate}</span>
            </div>
            <Slider
              value={[heartRate]}
              onValueChange={(val) => setHeartRate(val[0])}
              min={40}
              max={220}
              step={1}
              className="mb-1"
            />
            <button
              onClick={handleHeartRateHold}
              className="w-full py-1 rounded text-[10px] font-bold transition-all bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            >
              HR Hold
            </button>
          </div>
          
          {/* RPM Dial */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-zinc-400">RPM</span>
              </div>
              <span className="text-[10px] font-mono text-white">{rpm}</span>
            </div>
            <Slider
              value={[rpm]}
              onValueChange={(val) => setRpm(val[0])}
              min={0}
              max={150}
              step={1}
            />
          </div>
          
          {/* Power Dial */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-[10px] text-zinc-400">Power</span>
              </div>
              <span className="text-[10px] font-mono text-white">{power}W</span>
            </div>
            <Slider
              value={[power]}
              onValueChange={(val) => setPower(val[0])}
              min={0}
              max={300}
              step={5}
            />
          </div>
          
          {/* Resistance Dial */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Settings2 className="w-3 h-3 text-[#FF3F03]" />
                <span className="text-[10px] text-zinc-400">Resist</span>
              </div>
              <span className="text-[10px] font-mono text-white">{resistance}</span>
            </div>
            <Slider
              value={[resistance]}
              onValueChange={(val) => setResistance(val[0])}
              min={1}
              max={maxResistance}
              step={1}
            />
          </div>

          {/* Time Multiplier */}
          {setTimeMultiplier && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-400">Time Speed</span>
                <span className="text-[10px] font-mono text-[#FF3F03]">{timeMultiplier}x</span>
              </div>
              <Slider
                value={[timeMultiplier]}
                onValueChange={(val) => setTimeMultiplier(val[0])}
                min={1}
                max={10}
                step={0.1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}