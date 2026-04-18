import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function ControlButton({ onClick, icon: Icon, label, variant = "primary", size = "default" }) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black shadow-lg shadow-cyan-500/30",
    danger: "bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 text-white shadow-lg shadow-rose-500/30",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
    warning: "bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-black shadow-lg shadow-amber-500/30"
  };

  const sizes = {
    default: "w-16 h-16",
    large: "w-20 h-20"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "rounded-full flex flex-col items-center justify-center transition-all",
        variants[variant],
        sizes[size]
      )}
    >
      <Icon className="w-6 h-6" />
      {label && <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{label}</span>}
    </motion.button>
  );
}