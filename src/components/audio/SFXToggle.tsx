"use client";

import { useState } from "react";
import { useAudioEngine } from "@/components/audio/useAudioEngine";

/**
 * SFXToggle — top-right fixed button, muted by default.
 * Initializes Web Audio API on first click (browser requires user gesture).
 */
export function SFXToggle() {
  const { isMuted, toggleMute } = useAudioEngine();

  return (
    <button
      className={`sfx-toggle ${!isMuted ? "active" : ""}`}
      onClick={toggleMute}
      aria-label={isMuted ? "Enable sound effects" : "Disable sound effects"}
      aria-pressed={!isMuted}
    >
      {isMuted ? "[ SFX OFF ]" : "[ SFX ON ]"}
    </button>
  );
}
