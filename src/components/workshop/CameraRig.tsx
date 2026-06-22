'use client'

import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useDampedSpring } from './useSpring'

// ─────────────────────────────────────────────────────────────────────────────
// ZONE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const ZONE_NAMES = [
  'Entrance',
  'Workbench',
  'Creations',
  'Mindset',
  "Nova's Desk",
  'Window',
] as const
export type ZoneName = typeof ZONE_NAMES[number]

// User-facing progress thresholds — what value of targetProgress activates
// each zone in the nav and label overlay.
export const ZONE_PROGRESS: Record<ZoneName, number> = {
  'Entrance':    0.00,
  'Workbench':   0.15,
  'Creations':   0.30,
  'Mindset':     0.50,
  "Nova's Desk": 0.68,
  'Window':      1.00,
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA SPLINE
// Six waypoints following the vertical-climb floorplan (Section 18/20 of brief).
// Path routes ADJACENT to Nova's Desk, not stopping there as a hard waypoint.
// ─────────────────────────────────────────────────────────────────────────────

const CAM_WAYPOINTS = [
  new THREE.Vector3(0,    1.6,  8),    // Entrance — standing at door, looking in
  new THREE.Vector3(-2.5, 1.6,  2),    // Workbench — lower-left
  new THREE.Vector3(2.5,  1.8, -4),    // Creations — lower-right
  new THREE.Vector3(-1.0, 2.2, -10),   // Mindset — center-left, camera rises
  new THREE.Vector3(1.0,  2.0, -14),   // Near Nova's Desk — central pass
  new THREE.Vector3(0,    2.6, -20),   // Window — highest, widest
]

const LOOK_WAYPOINTS = [
  new THREE.Vector3(0,    1.0,  0),    // Looking into the room
  new THREE.Vector3(-3,   1.2, -2),    // Looking at workbench
  new THREE.Vector3(3,    1.4, -8),    // Looking at shelves
  new THREE.Vector3(0,    1.8, -14),   // Deeper, toward Nova/Window
  new THREE.Vector3(0,    1.8, -18),   // Toward window from Nova's desk
  new THREE.Vector3(0,    1.0, -12),   // Looking BACK — the wow reveal
]

// FOV at each waypoint — tightest near Nova's Desk, widest at Window (Section 5.1a)
const FOV_VALUES = [60, 62, 64, 56, 52, 75]

// ─────────────────────────────────────────────────────────────────────────────
// PER-SEGMENT PACING FUNCTION
//
// This is the mechanism that makes felt speed differences, not just
// "this segment uses more of the 0-1 range."
//
// Each segment has two independently tunable parameters:
//   1. splineStart/splineEnd → controls AVERAGE speed across the segment
//      (ratio (se-ss)/(ue-us): higher = faster camera on average)
//   2. easeExponent → controls the VELOCITY CURVE *within* the segment
//      using ease-out: 1-(1-t)^n. Higher n = brisk start, strong deceleration
//      toward the end of the segment.
//
// To verify pacing is actually working: scroll at a constant input rate and
// watch the camera — its on-screen speed should visibly change without you
// changing your scroll rate. If you have to scroll slower to make Window feel
// slow, the curve isn't doing its job.
//
// Segment table: [userStart, userEnd, splineStart, splineEnd, easeExponent]
// ─────────────────────────────────────────────────────────────────────────────

const PACING_SEGS: [number, number, number, number, number][] = [
  // user range       spline range      ease   avg-speed-ratio  feel
  [0.00, 0.15,   0.000, 0.213,   1.0],  // Entrance → Workbench:  1.42×  brisk, linear
  [0.15, 0.30,   0.213, 0.426,   1.1],  // Workbench → Creations: 1.42×  near-linear
  [0.30, 0.50,   0.426, 0.613,   1.6],  // Creations → Mindset:   0.93×  ease-out, clear slow
  [0.50, 0.68,   0.613, 0.769,   2.2],  // Mindset → Nova:        0.87×  strong ease-out
  [0.68, 1.00,   0.769, 1.000,   3.0],  // Nova → Window:         0.72×  extreme, unmistakable
]

/**
 * Maps user progress [0,1] → spline parameter [0,1] with per-segment
 * velocity curves. This is the single function responsible for producing
 * the felt pacing differences between zones.
 *
 * Ease-out formula: eased = 1 - (1-t)^n
 * At segment start: camera speed = n × avgSpeed (fastest)
 * At segment end:   camera speed → 0 (decelerates in)
 * Average across segment: exactly avgSpeed (set by splineRange ratio)
 */
function applyPacing(p: number): number {
  const clamped = Math.max(0, Math.min(1, p))
  for (const [us, ue, ss, se, exp] of PACING_SEGS) {
    if (clamped <= ue + 0.0001) {
      const t     = Math.max(0, Math.min(1, (clamped - us) / (ue - us)))
      const eased = 1 - Math.pow(1 - t, exp)   // ease-out: fast start → slow end
      return ss + eased * (se - ss)
    }
  }
  return 1.0
}

// ─────────────────────────────────────────────────────────────────────────────
// FOV interpolation — smooth linear between waypoint FOV values
// ─────────────────────────────────────────────────────────────────────────────

function lerpFov(progress: number): number {
  const n = FOV_VALUES.length - 1
  const t = Math.max(0, Math.min(1, progress)) * n
  const i = Math.floor(Math.min(t, n - 1))
  const f = t - i
  return FOV_VALUES[i] + (FOV_VALUES[i + 1] - FOV_VALUES[i]) * f
}

// ─────────────────────────────────────────────────────────────────────────────
// CameraRig
//
// THE RULE — repeated here for clarity because it's the most important
// constraint in this entire prototype:
//
//   scroll/nav input → targetProgress (0-1) only
//   spring → currentProgress (chases target every frame)
//   applyPacing(currentProgress) → splineT
//   spline.getPointAt(splineT) → camera position + lookAt
//
// Nothing else moves the camera. No exceptions.
// ─────────────────────────────────────────────────────────────────────────────

interface CameraRigProps {
  targetProgress: React.MutableRefObject<number>
}

export function CameraRig({ targetProgress }: CameraRigProps) {
  const { camera } = useThree()

  // The spring — this is the only thing that changes currentProgress
  const currentProgress = useDampedSpring(targetProgress, 120, 20)

  // Build splines once
  const { posSpline, lookSpline } = useMemo(() => ({
    posSpline:  new THREE.CatmullRomCurve3(CAM_WAYPOINTS,  false, 'catmullrom', 0.5),
    lookSpline: new THREE.CatmullRomCurve3(LOOK_WAYPOINTS, false, 'catmullrom', 0.5),
  }), [])

  const tempPos    = useRef(new THREE.Vector3())
  const tempLook   = useRef(new THREE.Vector3())

  useFrame(() => {
    const rawP    = currentProgress.current
    const splineT = applyPacing(rawP)  // per-segment velocity curve applied here

    // getPointAt uses arc-length parameterisation → equal Δt = equal metres
    posSpline.getPointAt(splineT,  tempPos.current)
    lookSpline.getPointAt(splineT, tempLook.current)

    camera.position.copy(tempPos.current)
    camera.lookAt(tempLook.current)

    // FOV interpolated by raw progress (not paced) so it tracks narrative, not speed
    if ('fov' in camera) {
      const targetFov = lerpFov(rawP)
      const cam = camera as THREE.PerspectiveCamera
      cam.fov += (targetFov - cam.fov) * 0.06
      cam.updateProjectionMatrix()
    }
  })

  return null
}

export { CAM_WAYPOINTS, LOOK_WAYPOINTS }
