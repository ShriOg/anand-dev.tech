"use client";

import { useState, useEffect, useRef } from "react";
import { FlipClock } from "@/components/ui/flip-clock";
import { FlipStopwatch } from "@/components/ui/flip-stopwatch";
import { FlipTimer } from "@/components/ui/flip-timer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Maximize, Minimize, MoveLeft, Clock, Timer as TimerIcon, Play, Pause, RotateCcw, Hourglass } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Mode = "clock" | "stopwatch" | "timer";

export default function ClockPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<Mode>("clock");
  const [isRunning, setIsRunning] = useState(false);
  const [resetToggle, setResetToggle] = useState(false);
  const [showUI, setShowUI] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide UI in fullscreen when mouse is still
  useEffect(() => {
    const handleMouseMove = () => {
      setShowUI(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isFullscreen) {
        timerRef.current = setTimeout(() => setShowUI(false), 3000);
      }
    };
    const handleTouch = () => {
      setShowUI((prev) => !prev);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleTouch);
    
    // Initial hide timer if already in fullscreen
    if (isFullscreen) {
      timerRef.current = setTimeout(() => setShowUI(false), 3000);
    } else {
      setShowUI(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouch);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleReset = () => {
    setResetToggle((prev) => !prev);
    setIsRunning(false);
  };

  return (
    <div 
      className={cn(
        "relative flex h-screen w-screen flex-col items-center justify-center bg-black text-white overflow-hidden transition-cursor",
        (!showUI && isFullscreen) ? "cursor-none" : "cursor-default"
      )}
    >
      {/* Top navigation - hides in fullscreen after inactivity */}
      <div 
        className={cn(
          "absolute top-6 left-6 right-6 z-10 flex justify-between transition-opacity duration-500",
          (!showUI && isFullscreen) ? "opacity-0" : "opacity-100"
        )}
      >
        <Link 
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "border-neutral-800 bg-neutral-950 text-neutral-400 hover:bg-neutral-900 hover:text-white"
          )}
        >
          <MoveLeft className="h-4 w-4" />
        </Link>

        {/* Mode Selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-sm">
          <Button
            variant={mode === "clock" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("clock")}
            className={mode === "clock" ? "bg-white text-black hover:bg-neutral-200" : "text-neutral-400 hover:text-white"}
          >
            <Clock className="w-4 h-4 mr-2" />
            Clock
          </Button>
          <Button
            variant={mode === "stopwatch" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setMode("stopwatch"); setIsRunning(false); }}
            className={mode === "stopwatch" ? "bg-white text-black hover:bg-neutral-200" : "text-neutral-400 hover:text-white"}
          >
            <TimerIcon className="w-4 h-4 mr-2" />
            Stopwatch
          </Button>
          <Button
            variant={mode === "timer" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setMode("timer"); setIsRunning(false); }}
            className={mode === "timer" ? "bg-white text-black hover:bg-neutral-200" : "text-neutral-400 hover:text-white"}
          >
            <Hourglass className="w-4 h-4 mr-2" />
            Timer
          </Button>
        </div>
      </div>

      {/* The Clock/Timer Component */}
      <div className="scale-110 md:scale-150 transition-transform flex flex-col items-center gap-8">
        {mode === "clock" && <FlipClock />}
        {mode === "stopwatch" && <FlipStopwatch isRunning={isRunning} onReset={resetToggle} />}
        {mode === "timer" && <FlipTimer isRunning={isRunning} onReset={resetToggle} initialSeconds={1500} />}
      </div>
      
      {/* Controls for Stopwatch and Timer */}
      {mode !== "clock" && (
        <div 
          className={cn(
            "absolute bottom-24 flex gap-4 transition-opacity duration-500",
            (!showUI && isFullscreen) ? "opacity-0" : "opacity-100"
          )}
        >
          <Button 
            size="lg" 
            onClick={() => setIsRunning(!isRunning)}
            className="rounded-full w-14 h-14 bg-white text-black hover:bg-neutral-200 shadow-xl"
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={handleReset}
            className="rounded-full w-14 h-14 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 shadow-xl"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Fullscreen Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className={cn(
          "absolute bottom-6 right-6 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-opacity duration-500",
          (!showUI && isFullscreen) ? "opacity-0" : "opacity-100"
        )}
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </Button>
    </div>
  );
}
