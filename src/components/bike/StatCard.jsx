import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, unit, icon: Icon, accent = "cyan" }) {
  const accentColors = {
    cyan: "text-cyan-400 shadow-cyan-500/20",
    magenta: "text-fuchsia-400 shadow-fuchsia-500/20",
    green: "text-emerald-400 shadow-emerald-500/20",
    orange: "text-orange-400 shadow-orange-500/20",
    purple: "text-violet-400 shadow-violet-500/20",
    red: "text-rose-400 shadow-rose-500/20"
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn("w-4 h-4", accentColors[accent])} />}
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold", accentColors[accent])}>{value}</span>
        <span className="text-sm text-zinc-500">{unit}</span>
      </div>
    </div>
  );
}