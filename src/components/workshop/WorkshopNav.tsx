'use client'

import { ZONE_NAMES, ZONE_PROGRESS, ZoneName } from './CameraRig'

interface WorkshopNavProps {
  currentProgress: number
  onNavigate: (progress: number) => void
}

function getActiveZone(progress: number): ZoneName {
  // Find the zone whose threshold we most recently crossed
  const zones = Object.entries(ZONE_PROGRESS) as [ZoneName, number][]
  let active: ZoneName = 'Entrance'
  for (const [name, threshold] of zones) {
    if (progress >= threshold) {
      active = name
    }
  }
  return active
}

/**
 * WorkshopNav — six zone name buttons.
 *
 * RULE: Clicking a nav item calls `onNavigate(targetProgress)` — it sets
 * the TARGET progress value only. The spring in CameraRig then glides
 * the camera there. The motion is identical to scrolling, by design.
 * Nav clicks do NOT directly move the camera.
 */
export function WorkshopNav({ currentProgress, onNavigate }: WorkshopNavProps) {
  const activeZone = getActiveZone(currentProgress)

  return (
    <nav
      style={{
        position: 'fixed',
        left: '28px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'all',
      }}
    >
      {/* Logo / initials */}
      <div
        style={{
          color: '#ff8c42',
          fontSize: '18px',
          fontWeight: '800',
          letterSpacing: '0.05em',
          marginBottom: '20px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        AS
      </div>

      {ZONE_NAMES.map((name) => {
        const isActive = name === activeZone
        return (
          <button
            key={name}
            onClick={() => onNavigate(ZONE_PROGRESS[name])}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'color 0.3s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'
              }
            }}
          >
            {/* Active indicator dot */}
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: isActive ? '#ff8c42' : 'transparent',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            />
            {name}
          </button>
        )
      })}
    </nav>
  )
}
