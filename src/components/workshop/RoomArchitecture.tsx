'use client'

import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// Room bounding box — matches Section 20 of the brief
// 1 unit ≈ 1 metre; cozy loft-studio proportions
// ─────────────────────────────────────────────────────────────────────────────
const ROOM_W     = 10     // total width  (x: -5 to +5)
const ROOM_CEIL  = 3.8    // ceiling height
const ROOM_Z_BACK  = 11   // back wall (behind entrance camera start)
const ROOM_Z_FRONT = -24  // window wall
const ROOM_DEPTH   = ROOM_Z_BACK - ROOM_Z_FRONT  // 35
const ROOM_Z_MID   = (ROOM_Z_BACK + ROOM_Z_FRONT) / 2  // -6.5

// Zone divider openings — each creates a doorway feel as the camera passes through.
// Positions verified against the camera path: the camera's x coordinate at each
// z-boundary is near 0, so a centred opening fits without blocking the path.
const DIVIDERS = [
  { z: -1,  openW: 3.2, openH: 2.7, label: 'Entrance → Workbench' },
  { z: -8,  openW: 3.0, openH: 2.7, label: 'Creations → Mindset'  },
  { z: -17, openW: 4.5, openH: 3.0, label: 'Mindset → Window'     },
]

// Subtle warm-dark material props (no textures — prototype rule)
const matWall    = { color: '#0d0d1c' as const, roughness: 0.95, metalness: 0 }
const matFloor   = { color: '#0f0e1c' as const, roughness: 1.00, metalness: 0 }
const matCeil    = { color: '#07070c' as const, roughness: 1.00, metalness: 0 }
const matDivider = { color: '#121228' as const, roughness: 0.90, metalness: 0 }

// ─────────────────────────────────────────────────────────────────────────────
// DividerWall — a thin wall at z with a centred rectangular opening
// Composed of three box segments: left column, right column, top bar.
// Thickness T is exaggerated slightly (0.22) so the opening reads as a wall,
// not just a floating line.
// ─────────────────────────────────────────────────────────────────────────────
function DividerWall({ z, openW, openH }: { z: number; openW: number; openH: number }) {
  const T      = 0.22
  const half   = ROOM_W / 2        // 5
  const colW   = half - openW / 2  // width of each side column
  const topH   = ROOM_CEIL - openH // height of the bar above the opening

  if (colW <= 0) return null

  return (
    <group position={[0, 0, z]}>
      {/* Left column */}
      <mesh position={[-(openW / 2 + colW / 2), ROOM_CEIL / 2, 0]}>
        <boxGeometry args={[colW, ROOM_CEIL, T]} />
        <meshStandardMaterial {...matDivider} />
      </mesh>

      {/* Right column */}
      <mesh position={[(openW / 2 + colW / 2), ROOM_CEIL / 2, 0]}>
        <boxGeometry args={[colW, ROOM_CEIL, T]} />
        <meshStandardMaterial {...matDivider} />
      </mesh>

      {/* Top bar — above the opening */}
      {topH > 0.01 && (
        <mesh position={[0, openH + topH / 2, 0]}>
          <boxGeometry args={[openW, topH, T]} />
          <meshStandardMaterial {...matDivider} />
        </mesh>
      )}

      {/* Thin emissive strip at floor level — zone threshold marker */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[openW * 0.6, 0.06]} />
        <meshStandardMaterial
          color="#2a2a6a"
          emissive="#2a2a8a"
          emissiveIntensity={1.5}
          roughness={0}
        />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WindowWall — the front wall at the Window zone.
// Large opening (most of the wall is open) with a subtle city-glow backdrop.
// ─────────────────────────────────────────────────────────────────────────────
function WindowWall() {
  const z        = ROOM_Z_FRONT
  const T        = 0.22
  const frameW   = 1.2              // width of each side frame pillar
  const openW    = ROOM_W - frameW * 2  // opening width
  const openH    = ROOM_CEIL - 0.5  // opening almost full height, small bottom sill
  const topH     = ROOM_CEIL - openH
  const sillH    = 0.5

  return (
    <group position={[0, 0, z]}>
      {/* Left frame pillar */}
      <mesh position={[-(openW / 2 + frameW / 2), ROOM_CEIL / 2, 0]}>
        <boxGeometry args={[frameW, ROOM_CEIL, T]} />
        <meshStandardMaterial {...matWall} />
      </mesh>

      {/* Right frame pillar */}
      <mesh position={[(openW / 2 + frameW / 2), ROOM_CEIL / 2, 0]}>
        <boxGeometry args={[frameW, ROOM_CEIL, T]} />
        <meshStandardMaterial {...matWall} />
      </mesh>

      {/* Top transom */}
      {topH > 0 && (
        <mesh position={[0, openH + topH / 2, 0]}>
          <boxGeometry args={[openW, topH, T]} />
          <meshStandardMaterial {...matWall} />
        </mesh>
      )}

      {/* Bottom windowsill */}
      <mesh position={[0, sillH / 2, 0]}>
        <boxGeometry args={[openW, sillH, T * 2]} />
        <meshStandardMaterial color="#0f0f20" roughness={0.8} metalness={0} />
      </mesh>

      {/* City-glow backdrop — a faint emissive plane behind the window opening.
          Validates the "city beyond glass" sightline without needing a skybox. */}
      <mesh position={[0, openH / 2 + sillH, -3]}>
        <planeGeometry args={[openW + 1, openH]} />
        <meshStandardMaterial
          color="#050510"
          emissive="#1a1a6a"
          emissiveIntensity={0.7}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle wide glow light from outside — gives the window a light source feel */}
      <pointLight
        position={[0, ROOM_CEIL * 0.5, -2]}
        intensity={2.0}
        color="#3a3a9a"
        distance={12}
        decay={2}
      />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomArchitecture — the full bounding shell of The Workshop
// ─────────────────────────────────────────────────────────────────────────────
export function RoomArchitecture() {
  return (
    <group>

      {/* ── FLOOR ─────────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ROOM_Z_MID]}>
        <planeGeometry args={[ROOM_W, ROOM_DEPTH]} />
        <meshStandardMaterial {...matFloor} side={THREE.DoubleSide} />
      </mesh>

      {/* ── CEILING ───────────────────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_CEIL, ROOM_Z_MID]}>
        <planeGeometry args={[ROOM_W, ROOM_DEPTH]} />
        <meshStandardMaterial {...matCeil} side={THREE.DoubleSide} />
      </mesh>

      {/* ── LEFT SIDE WALL (x = -5) ────────────────────────────────────────── */}
      <mesh position={[-ROOM_W / 2, ROOM_CEIL / 2, ROOM_Z_MID]}>
        <boxGeometry args={[0.15, ROOM_CEIL, ROOM_DEPTH]} />
        <meshStandardMaterial {...matWall} />
      </mesh>

      {/* ── RIGHT SIDE WALL (x = +5) ───────────────────────────────────────── */}
      <mesh position={[ROOM_W / 2, ROOM_CEIL / 2, ROOM_Z_MID]}>
        <boxGeometry args={[0.15, ROOM_CEIL, ROOM_DEPTH]} />
        <meshStandardMaterial {...matWall} />
      </mesh>

      {/* ── BACK WALL (behind camera start) ───────────────────────────────── */}
      <mesh position={[0, ROOM_CEIL / 2, ROOM_Z_BACK]}>
        <boxGeometry args={[ROOM_W, ROOM_CEIL, 0.15]} />
        <meshStandardMaterial {...matWall} />
      </mesh>

      {/* ── ZONE DIVIDERS ─────────────────────────────────────────────────── */}
      {DIVIDERS.map((d) => (
        <DividerWall key={d.z} z={d.z} openW={d.openW} openH={d.openH} />
      ))}

      {/* ── WINDOW WALL ───────────────────────────────────────────────────── */}
      <WindowWall />

      {/* ── ARCHITECTURAL GRAZING LIGHTS ──────────────────────────────────── 
          Low-angle lights that reveal the wall and ceiling surfaces as distinct
          planes, without being a designed lighting pass (that comes later). */}

      {/* Warm light washing down from ceiling at Entrance */}
      <pointLight position={[0, 3.5, 4]}    intensity={0.6} color="#b87a3a" distance={8}  decay={2} />
      {/* Workbench side */}
      <pointLight position={[-3.5, 2, -2]}  intensity={0.5} color="#4a7aff" distance={7}  decay={2} />
      {/* Creations side */}
      <pointLight position={[3.5, 2.5, -6]} intensity={0.5} color="#3dcc88" distance={7}  decay={2} />
      {/* Mindset — cooler, calmer */}
      <pointLight position={[0, 3, -12]}    intensity={0.5} color="#8866cc" distance={8}  decay={2} />
      {/* Nova marker glow  */}
      <pointLight position={[1.5, 1.8, -11]} intensity={1.0} color="#00e5ff" distance={5} decay={2} />
      {/* Window ambient (supplementary to WindowWall's own light) */}
      <pointLight position={[0, 2.5, -20]}  intensity={0.8} color="#5555bb" distance={8}  decay={2} />

    </group>
  )
}
