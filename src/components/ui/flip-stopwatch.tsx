"use client";

import { useEffect, useState } from "react";
import { FlipDisplay } from "./flip-clock";

export function FlipStopwatch({ className, isRunning, onReset }: { className?: string, isRunning: boolean, onReset?: boolean }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (onReset) {
      setTime(0);
    }
  }, [onReset]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return <FlipDisplay hours={hours} minutes={minutes} seconds={seconds} className={className} />;
}