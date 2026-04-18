import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function CalorieDisplay({ calories }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 bg-gradient-to-r from-orange-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      </div>
      
      {/* Main display */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame className="w-8 h-8 text-orange-500" />
          </motion.div>
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-400 font-medium">Calories Burned</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            <Flame className="w-8 h-8 text-orange-500" />
          </motion.div>
        </div>
        
        <motion.div
          key={Math.floor(calories)}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <span className="text-[120px] md:text-[160px] font-black leading-none bg-gradient-to-b from-orange-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
            {Math.floor(calories)}
          </span>
          {/* Subtle glow behind number */}
          <div className="absolute inset-0 text-[120px] md:text-[160px] font-black leading-none text-orange-500/10 blur-xl -z-10">
            {Math.floor(calories)}
          </div>
        </motion.div>
        
        <span className="text-lg text-zinc-500 font-light tracking-wide">kcal</span>
      </div>
    </div>
  );
}