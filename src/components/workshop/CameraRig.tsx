'use client'

import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useDampedSpring } from './useSpring'

// ─────────────────────────────────────────────────────────────────────────────
// SPLINE DEFINITION
// The camera path routes through six waypoints following the vertical-climb
// floorplan (Section 18/20 of brief). The path passes ADJACENT to Nova's Desk,
// not stopping there — per the prototype spec.
//
// Coordinates are in Three.js world units (roughly 1 unit ≈ 1 meter):
//
//   Entrance   (0):  bottom of scene, warm entry
//   Workbench  (1):  lower-left, experimentation side
//   Creations  (2):  lower-right, project shelves  
//   Mindset    (3):  upper-center, reflection zone
//   NovaNear   (4):  passing point near Nova's desk (central)
//   Window     (5):  top, the wow reveal
// ─────────────────────────────────────────────────────────────────────────────

export const ZONE_NAMES = ['Entrance', 'Workbench', 'Creations', 'Mindset', "Nova's Desk", 'Window'] as const
export type ZoneName = typeof ZONE_NAMES[number]

// Camera positions along the path
const CAM_WAYPOINTS = [
  new THREE.Vector3(0,    1.6,  8),    // Entrance — standing at door, looking in
  new THREE.Vector3(-2.5, 1.6,  2),    // Workbench — slightly left
  new THREE.Vector3(2.5,  1.8,  -4),   // Creations — slightly right, higher
  new THREE.Vector3(-1,   2.2,  -10),  // Mindset — center-left, camera rises
  new THREE.Vector3(1,    2.0,  -14),  // Near Nova's Desk — passing through center
  new THREE.Vector3(0,    2.6,  -20),  // Window — highest, widest
]

// Camera look-at targets (where the camera points from each waypoint)
const LOOK_WAYPOINTS = [
  new THREE.Vector3(0,    1.0,  0),    // Looking into the room from entrance
  new THREE.Vector3(-3,   1.2,  -2),   // Looking at workbench
  new THREE.Vector3(3,    1.4,  -8),   // Looking at shelves
  new THREE.Vector3(0,    1.8,  -14),  // Looking deeper, toward mindset wall
  new THREE.Vector3(0,    1.8,  -18),  // Looking toward window from nova's desk
  new THREE.Vector3(0,    1.2,  -12),  // Looking BACK into the room — the wow moment
]

// FOV at each waypoint (interpolated between them)
// Tightest near Nova's Desk, widest at Window — per brief Section 5.1a
const FOV_VALUES = [60, 62, 64, 56, 52, 75]

// Progress thresholds that map nav zones to 0–1 range
// Not uniform — segments have different "weights" creating pacing variation
// (Slower segments use more of the 0–1 range)
export const ZONE_PROGRESS: Record<ZoneName, number> = {
  'Entrance':    0.00,
  'Workbench':   0.15,  // brisk entry pace
  'Creations':   0.30,  // still brisk
  'Mindset':     0.50,  // noticeably slower — 20% more range
  "Nova's Desk": 0.68,  // settling, lingering
  'Window':      1.00,  // slowest — longest segment of all (0.32 of range)
}

// ─────────────────────────────────────────────────────────────────────────────

function lerpFov(progress: number): number {
  const n = FOV_VALUES.length - 1
  const t = progress * n
  const i = Math.floor(Math.min(t, n - 1))
  const f = t - i
  return FOV_VALUES[i] + (FOV_VALUES[i + 1] - FOV_VALUES[i]) * f
}

interface CameraRigProps {
  targetProgress: React.MutableRefObject<number>
}

/**
 * CameraRig — the heart of the camera system.
 *
 * RULE: This component reads `targetProgress` (set by scroll/nav) and
 * moves the camera via a critically-damped spring. It never receives
 * raw scroll delta. It never sets the camera directly from input.
 * The spring is what moves the camera. Always.
 */
export function CameraRig({ targetProgress }: CameraRigProps) {
  const { camera } = useThree()
  
  // Spring-damped progress — the only variable that drives camera position
  const currentProgress = useDampedSpring(targetProgress, 120, 20)

  // Build the spline curves (memoized — only constructed once)
  const { positionSpline, lookAtSpline } = useMemo(() => {
    return {
      positionSpline: new THREE.CatmullRomCurve3(CAM_WAYPOINTS, false, 'catmullrom', 0.5),
      lookAtSpline:   new THREE.CatmullRomCurve3(LOOK_WAYPOINTS, false, 'catmullrom', 0.5),
    }
  }, [])

  const tempPos    = useRef(new THREE.Vector3())
  const tempLookAt = useRef(new THREE.Vector3())

  useFrame(() => {
    const p = currentProgress.current

    // Sample position and look-at from splines
    positionSpline.getPoint(p, tempPos.current)
    lookAtSpline.getPoint(p, tempLookAt.current)

    // Apply to camera
    camera.position.copy(tempPos.current)
    camera.lookAt(tempLookAt.current)

    // Interpolate FOV
    if ('fov' in camera) {
      const targetFov = lerpFov(p);
      (camera as THREE.PerspectiveCamera).fov += (targetFov - (camera as THREE.PerspectiveCamera).fov) * 0.05;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
  })

  return null
}

// Export splines for DOF focal distance computation
export { CAM_WAYPOINTS, LOOK_WAYPOINTS }
