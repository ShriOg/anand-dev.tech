'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraRig, ZONE_PROGRESS } from './CameraRig'
import { ZoneBoxes } from './ZoneBoxes'
import { RoomArchitecture } from './RoomArchitecture'
import { ZoneLighting } from './ZoneLighting'
import { WorkshopNav } from './WorkshopNav'
import { useScrollProgress } from './useScrollProgress'

// ─────────────────────────────────────────────────────────────────────────────
// Zone label overlay — fades between zone names as camera progresses
// ─────────────────────────────────────────────────────────────────────────────
function getActiveZoneName(progress: number): string {
  const zones = Object.entries(ZONE_PROGRESS) as [string, number][]
  let active = 'Entrance'
  for (const [name, threshold] of zones) {
    if (progress >= threshold) active = name
  }
  return active
}

function ZoneLabelOverlay({ currentProgress }: { currentProgress: number }) {
  const zoneName = getActiveZoneName(currentProgress)
  const [displayName, setDisplayName] = useState(zoneName)
  const [opacity, setOpacity] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (zoneName !== displayName) {
      setOpacity(0)
      timerRef.current = setTimeout(() => {
        setDisplayName(zoneName)
        setOpacity(1)
      }, 200)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [zoneName, displayName])

  return (
    <div style={{
      position: 'fixed', bottom: '40px', left: '50%',
      transform: 'translateX(-50%)', textAlign: 'center',
      pointerEvents: 'none', zIndex: 100,
      transition: 'opacity 0.2s ease', opacity,
    }}>
      <div style={{
        color: 'rgba(255,255,255,0.9)',
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px', letterSpacing: '0.25em',
        textTransform: 'uppercase', fontWeight: '500',
      }}>
        {displayName}
      </div>
      <div style={{
        width: '40px', height: '1px',
        background: 'rgba(255,140,66,0.6)',
        margin: '6px auto 0',
      }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar — thin amber line at bottom
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '2px', background: 'rgba(255,255,255,0.08)',
      zIndex: 101, pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${progress * 100}%`,
        background: 'linear-gradient(90deg, #ff8c42, #ffcf86)',
        transition: 'none', // spring handles smoothing
      }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll hint — fades out as soon as the user begins scrolling
// ─────────────────────────────────────────────────────────────────────────────
function ScrollHint({ progress }: { progress: number }) {
  const opacity = Math.max(0, 1 - progress * 30)
  if (opacity <= 0) return null
  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '32px',
      opacity, pointerEvents: 'none', zIndex: 100,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '6px',
    }}>
      <div style={{
        color: 'rgba(255,255,255,0.5)',
        fontFamily: "'Inter', sans-serif",
        fontSize: '10px', letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        Scroll to explore
      </div>
      <div style={{
        width: '20px', height: '32px',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '10px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '6px', left: '50%',
          transform: 'translateX(-50%)',
          width: '3px', height: '8px',
          background: 'rgba(255,140,66,0.8)',
          borderRadius: '2px',
          animation: 'scrollDot 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Prototype badge
// ─────────────────────────────────────────────────────────────────────────────
function PrototypeBadge({ version = '0.1' }: { version?: string }) {
  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px',
      background: 'rgba(255,140,66,0.12)',
      border: '1px solid rgba(255,140,66,0.35)',
      borderRadius: '4px', padding: '4px 10px',
      color: 'rgba(255,140,66,0.85)',
      fontFamily: "'Inter', sans-serif",
      fontSize: '10px', fontWeight: '600',
      letterSpacing: '0.15em', textTransform: 'uppercase',
      zIndex: 200, pointerEvents: 'none',
    }}>
      Prototype {version}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ProgressReadout — syncs the ref-based targetProgress to React state
// for HTML overlays, using rAF outside of Canvas context
// ─────────────────────────────────────────────────────────────────────────────
function ProgressReadout({
  targetProgress,
  onDisplayUpdate,
}: {
  targetProgress: React.MutableRefObject<number>
  onDisplayUpdate: (p: number) => void
}) {
  useEffect(() => {
    let rafId: number
    let last = -1
    function tick() {
      const v = targetProgress.current
      if (Math.abs(v - last) > 0.0005) {
        onDisplayUpdate(v)
        last = v
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [targetProgress, onDisplayUpdate])
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkshopScene — the main export, full-screen 3D prototype
// ─────────────────────────────────────────────────────────────────────────────
export function WorkshopScene() {
  const [targetProgress, setTargetProgress] = useScrollProgress()
  const [displayProgress, setDisplayProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const setProgress = useCallback((v: number) => {
    targetProgress.current = Math.max(0, Math.min(1, v))
  }, [targetProgress])

  // Imperative wheel listener — React 19 synthetic onWheel is passive by default
  // (can't preventDefault) and the R3F Canvas captures events before they bubble.
  // Attaching directly with { passive: false } solves both issues.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setProgress(targetProgress.current + e.deltaY * 0.0004)
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [targetProgress, setProgress])

  // Keyboard navigation — all routes through setProgress → spring, same as scroll.
  // Arrow keys + WASD: forward/deeper = progress+, backward = progress-.
  // Page Up/Down: larger jumps (roughly one zone at a time).
  useEffect(() => {
    const STEP      = 0.04   // arrow / WASD single press
    const PAGE_STEP = 0.15   // Page Up / Page Down

    const handleKey = (e: KeyboardEvent) => {
      // Don't capture when user is typing
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.key) {
        // Forward — deeper into the workshop
        case 'ArrowDown':
        case 'ArrowRight':
        case 'w':
        case 'W':
          e.preventDefault()
          setProgress(targetProgress.current + STEP)
          break
        // Backward — back toward entrance
        case 'ArrowUp':
        case 'ArrowLeft':
        case 's':
        case 'S':
          e.preventDefault()
          setProgress(targetProgress.current - STEP)
          break
        // D also nudges forward (strafe right = toward window)
        case 'd':
        case 'D':
          e.preventDefault()
          setProgress(targetProgress.current + STEP)
          break
        // A also nudges backward (strafe left = toward entrance)
        case 'a':
        case 'A':
          e.preventDefault()
          setProgress(targetProgress.current - STEP)
          break
        case 'PageDown':
          e.preventDefault()
          setProgress(targetProgress.current + PAGE_STEP)
          break
        case 'PageUp':
          e.preventDefault()
          setProgress(targetProgress.current - PAGE_STEP)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [targetProgress, setProgress])

  // Touch drag support
  const lastTouchY = useRef<number | null>(null)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    lastTouchY.current = e.touches[0].clientY
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (lastTouchY.current === null) return
    const delta = lastTouchY.current - e.touches[0].clientY
    lastTouchY.current = e.touches[0].clientY
    setProgress(targetProgress.current + delta * 0.003)
  }, [targetProgress, setProgress])

  // Nav click — sets targetProgress only; spring handles the glide identically to scroll
  const handleNavigation = useCallback((progress: number) => {
    setProgress(progress)
  }, [setProgress])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', height: '100vh',
        position: 'fixed', inset: 0,
        background: '#080810', overflow: 'hidden',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes scrollDot {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(10px); opacity: 0.3; }
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; overflow: hidden; }
      `}</style>

      <Canvas
        camera={{ fov: 60, near: 0.1, far: 80, position: [0, 1.6, 8] }}
        gl={{
          antialias: true,
          toneMapping: 4,       // THREE.ACESFilmicToneMapping
          toneMappingExposure: 1.2,
        }}
        shadows                  // enable shadow map for directional shadow casters
        style={{ width: '100%', height: '100%' }}
      >
        {/* CameraRig — the ONLY thing that moves the camera (via spring) */}
        <CameraRig targetProgress={targetProgress} />

        {/* Architecture — walls, floor, ceiling, zone dividers, window wall.
            All surfaces are now meshStandardMaterial (PBR) so zone lights
            produce correct colour-temperature responses. */}
        <RoomArchitecture />

        {/* Zone lighting — per-zone directional lights + point anchors.
            This is the entire Prototype 0.4 experiment: does light alone,
            on flat gray geometry, produce emotionally distinct zones? */}
        <ZoneLighting />

        {/* Zone orientation markers — small glowing cubes, not room-filling boxes */}
        <ZoneBoxes />

        {/* Fog — warm golden-amber near entrance, thins to dark cool at window.
            Near start (22u) kept past the first wall so entrance reads fully.
            Far end (50u) reaches just past the window wall. */}
        <fog attach="fog" args={['#0c0a12', 22, 50]} />
      </Canvas>

      {/* HTML overlays — all driven by displayProgress synced from targetProgress */}
      <WorkshopNav currentProgress={displayProgress} onNavigate={handleNavigation} />
      <ZoneLabelOverlay currentProgress={displayProgress} />
      <ProgressBar progress={displayProgress} />
      <ScrollHint progress={displayProgress} />
      <PrototypeBadge version="0.4" />

      {/* rAF loop syncing ref → state for HTML overlays without blocking the R3F loop */}
      <ProgressReadout
        targetProgress={targetProgress}
        onDisplayUpdate={setDisplayProgress}
      />
    </div>
  )
}
