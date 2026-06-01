"use client";

import { useEffect, useState } from "react";
import { FlipDisplay } from "./flip-clock";

export function FlipTimer({ 
  className, 
  isRunning, 
  initialSeconds = 1500, // 25 minutes default 
  onReset 
}: { 
  className?: string; 
  isRunning: boolean;
  initialSeconds?: number;
  onReset?: boolean;
}) {
  const [time, setTime] = useState(initialSeconds);

  useEffect(() => {
    if (onReset) {
      setTime(initialSeconds);
    }
  }, [onReset, initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return <FlipDisplay hours={hours} minutes={minutes} seconds={seconds} className={className} />;
}