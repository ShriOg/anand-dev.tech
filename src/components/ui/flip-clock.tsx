"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipNumberProps {
  digit: number;
}

function FlipNumber({ digit }: FlipNumberProps) {
  const formattedDigit = digit.toString().padStart(2, "0");

  return (
    <div className="relative flex h-20 w-16 md:h-32 md:w-24 flex-col items-center justify-center overflow-hidden rounded-lg md:rounded-xl border border-neutral-800 bg-neutral-950 text-4xl md:text-7xl font-black text-white shadow-2xl">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={formattedDigit}
          initial={{ y: "50%", opacity: 0, scale: 0.8, rotateX: -45 }}
          animate={{ y: "0%", opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ y: "-50%", opacity: 0, scale: 0.8, rotateX: 45 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute drop-shadow-lg"
          style={{ perspective: "1000px" }}
        >
          {formattedDigit}
        </motion.span>
      </AnimatePresence>
      
      {/* Decorative horizontal line in the middle to give the flip clock feel */}
      <div className="absolute inset-x-0 top-1/2 z-10 h-[1px] md:h-0.5 w-full -translate-y-1/2 bg-neutral-900/80 shadow-sm" />
      
      {/* Subtle top/bottom gradients for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
    </div>
  );
}

export function FlipDisplay({ hours, minutes, seconds, className }: { hours: number, minutes: number, seconds: number, className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-2 md:gap-4", className)}>
        <div className="h-20 w-16 md:h-32 md:w-24 rounded-lg md:rounded-xl bg-neutral-900 animate-pulse" />
        <span className="text-3xl md:text-5xl font-bold text-neutral-600">:</span>
        <div className="h-20 w-16 md:h-32 md:w-24 rounded-lg md:rounded-xl bg-neutral-900 animate-pulse" />
        <span className="text-3xl md:text-5xl font-bold text-neutral-600">:</span>
        <div className="h-20 w-16 md:h-32 md:w-24 rounded-lg md:rounded-xl bg-neutral-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 md:gap-4", className)}>
      <FlipNumber digit={hours} />
      <span className="text-3xl md:text-5xl font-bold text-neutral-400 mb-1 lg:mb-2 animate-pulse">:</span>
      <FlipNumber digit={minutes} />
      <span className="text-3xl md:text-5xl font-bold text-neutral-400 mb-1 lg:mb-2 animate-pulse">:</span>
      <FlipNumber digit={seconds} />
    </div>
  );
}

export function FlipClock({ className }: { className?: string }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <FlipDisplay hours={0} minutes={0} seconds={0} className={className} />;

  let hours = time.getHours();
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return <FlipDisplay hours={hours} minutes={time.getMinutes()} seconds={time.getSeconds()} className={className} />;
}
