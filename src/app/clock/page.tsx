"use client";

import { useState, useEffect } from "react";
import { FlipClock } from "@/components/ui/flip-clock";
import { Button, buttonVariants } from "@/components/ui/button";
import { Maximize, Minimize, MoveLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClockPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Back button (hidden in actual fullscreen mode) */}
      {!isFullscreen && (
        <Link 
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "absolute top-6 left-6 z-10 border-neutral-800 bg-neutral-950 text-neutral-400 hover:bg-neutral-900 hover:text-white"
          )}
        >
          <MoveLeft className="h-4 w-4" />
        </Link>
      )}

      {/* The Clock - scaled up nicely */}
      <div className="scale-110 md:scale-150 transition-transform">
        <FlipClock />
      </div>
      
      {/* Fullscreen Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute bottom-6 right-6 text-neutral-500 hover:text-white hover:bg-neutral-900"
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </Button>
    </div>
  );
}
