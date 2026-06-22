'use client'

import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE REFERENCE
//
// Camera path: z = +8 (Entrance) → z = -20 (Window), x swings ±2.5, y = 1.6–2.6
// Room width: 10 units (x: -5 to +5) matches Section 20's ~10m overall width
// Ceiling: 3.0 units — cozy loft proportions (Section 20: 2.8–3.2m)
//
// Zone z-centres (derived from camera waypoints):
//   Entrance:     z ≈ +5
//   Workbench:    z ≈ +2  (left side, x ≈ -2.5)
//   Creations:    z ≈ -4  (right side, x ≈ +2.5)
//   Nova's Desk:  z ≈ -12 (central — always near, the constant anchor)
//   Mindset:      z ≈ -11
//   Window:       z ≈ -20
//
// Prototype 0.4 material change:
//   All surfaces are now meshStandardMaterial (PBR) — previously Lambert.
//   This is required for the zone lighting pass: Lambert ignores specular and
//   provides no roughness/metalness control, making lights look the same on every
//   surface. Standard lets each zone's colour temperature actually *read*.
//   Roughness is kept high (0.85–0.95) to stay matte — no shiny plastic.
// ─────────────────────────────────────────────────────────────────────────────

const W     = 10    // room width (x: -5 to +5)
const CEIL  = 3.0   // ceiling height (Section 20: 2.8–3.2m, cozy)
const HALF  = W / 2

// ── MATERIAL PALETTE ─────────────────────────────────────────────────────────
// Flat gray base — no colour information of its own so zone lights do all the
// emotive work. The surfaces need to be neutral enough that #ffc870 at the
// Entrance reads as warm-golden, and #5580c8 at the Window reads as cool-blue.
// If the surfaces were already warm/cool, the light effect would be muddy.
//
// Roughness 0.88 = matte concrete-style (studio-wall feel) — holds light well
// without washing out or looking plasticky.
//
// Wall/floor/ceiling get slightly different base brightnesses so they read as
// distinct surfaces even in the neutral ambient (same as 0.3 behaviour).
const WALL_ROUGHNESS  = 0.88
const FLOOR_ROUGHNESS = 0.92  // slightly rougher — grabs directional light harder
const CEIL_ROUGHNESS  = 0.85

const WALL_COLOR  = '#4a4a52'
const FLOOR_COLOR = '#3a3a40'
const CEIL_COLOR  = '#2e2e34'

// Wall thickness
const T = 0.15

// ─────────────────────────────────────────────────────────────────────────────
// Zone partition walls — positioned at thresholds between zones per Sec. 20.
// Each has a centred doorway opening. The camera path has been verified to
// pass through each opening (camera x ≈ 0 at each threshold z).
//
// Opening sizing: widened to 2.4–4.0 for camera clearance and the
// "wide workshop door" feel.
// ─────────────────────────────────────────────────────────────────────────────
const PARTITIONS = [
  // Between Entrance and the Workbench/Creations level
  { z: 0,    openW: 3.0, openH: 2.6, label: 'Entrance → Workbench/Creations' },
  // Between Creations and Mindset
  { z: -7.5, openW: 3.0, openH: 2.6, label: 'Creations → Mindset' },
  // Between Mindset/Nova and Window — wider opening (the "approach" reads more open)
  { z: -16,  openW: 4.0, openH: 2.8, label: 'Mindset/Nova → Window' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A partition wall with a single centred doorway opening.
 *  Made of three box segments: left pillar, right pillar, top transom. */
function PartitionWall({ z, openW, openH }: { z: number; openW: number; openH: number }) {
  const pillarW = HALF - openW / 2  // width of each side pillar
  const transomH = CEIL - openH     // height of transom above door

  if (pillarW < 0.01) return null

  const pillarCX = openW / 2 + pillarW / 2   // centre-x of each pillar (symmetric)
  const transomCY = openH + transomH / 2      // centre-y of transom

  return (
    <group position={[0, 0, z]}>
      {/* Left pillar */}
      <mesh position={[-pillarCX, CEIL / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, CEIL, T]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[pillarCX, CEIL / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, CEIL, T]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
      </mesh>
      {/* Top transom */}
      {transomH > 0.02 && (
        <mesh position={[0, transomCY, 0]} castShadow receiveShadow>
          <boxGeometry args={[openW, transomH, T]} />
          <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
        </mesh>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Window wall — the far end (Sec. 20: "full window wall, city skyline").
// Wide opening with narrow frame pillars. The backdrop behind the opening
// is now upgraded from a dark plane to a deep night-sky panel that will
// catch the Window zone's cool blue light.
// ─────────────────────────────────────────────────────────────────────────────
function WindowWall() {
  const z          = -23
  const openW      = 6.0    // wide opening — feels like the room opens up
  const openH      = 2.5    // top of opening (leaves a transom + sill)
  const sillH      = 0.45   // sill height from floor
  const frameW     = HALF - openW / 2  // side frame pillar width
  const transomH   = CEIL - openH

  const frameCX    = openW / 2 + frameW / 2

  return (
    <group position={[0, 0, z]}>
      {/* Side frame pillars */}
      {frameW > 0.02 && (
        <>
          <mesh position={[-frameCX, CEIL / 2, 0]} receiveShadow castShadow>
            <boxGeometry args={[frameW, CEIL, T * 2]} />
            <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
          </mesh>
          <mesh position={[frameCX, CEIL / 2, 0]} receiveShadow castShadow>
            <boxGeometry args={[frameW, CEIL, T * 2]} />
            <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
          </mesh>
        </>
      )}
      {/* Transom — above the opening */}
      {transomH > 0.02 && (
        <mesh position={[0, openH + transomH / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[openW, transomH, T * 2]} />
          <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
        </mesh>
      )}
      {/* Sill — below the opening (thick, ground level) */}
      <mesh position={[0, sillH / 2, 0]} receiveShadow>
        <boxGeometry args={[openW, sillH, T * 3]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.75} metalness={0} />
      </mesh>
      {/* Backdrop — deep night-sky panel set back beyond the opening.
          Uses a dark near-black blue so the Window zone's cool city-glow
          point light can tint it upward without looking painted. */}
      <mesh position={[0, CEIL / 2, -1.8]}>
        <planeGeometry args={[openW, CEIL]} />
        <meshStandardMaterial color="#05060e" roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomArchitecture — the complete architectural shell.
//
// Prototype 0.4 change vs 0.3:
//   - All materials upgraded from meshLambertMaterial → meshStandardMaterial
//     (PBR required for zone lights to produce colour-temperature effects)
//   - The baked flat-test lighting (two fills + ambient that lived inside this
//     component) has been REMOVED — ZoneLighting replaces it entirely
//   - A minimal global ambient is retained here just to prevent any surface
//     from going pure black (unlit side of geometry)
//   - No props, furniture, textures, or decorative elements added
// ─────────────────────────────────────────────────────────────────────────────
export function RoomArchitecture() {
  // Room bounds
  const zBack  =  11    // back wall (behind camera entry point z=8)
  const zFront = -23    // window wall
  const depth  = zBack - zFront   // 34 units
  const zMid   = (zBack + zFront) / 2  // -6

  return (
    <group>

      {/* ── FLOOR ──────────────────────────────────────────────────────────── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, zMid]}
        receiveShadow
      >
        <planeGeometry args={[W, depth]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={FLOOR_ROUGHNESS} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── CEILING ────────────────────────────────────────────────────────── */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, CEIL, zMid]}
        receiveShadow
      >
        <planeGeometry args={[W, depth]} />
        <meshStandardMaterial color={CEIL_COLOR} roughness={CEIL_ROUGHNESS} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── LEFT WALL (x = -5) ─────────────────────────────────────────────── */}
      <mesh position={[-HALF, CEIL / 2, zMid]} receiveShadow castShadow>
        <boxGeometry args={[T, CEIL, depth]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
      </mesh>

      {/* ── RIGHT WALL (x = +5) ────────────────────────────────────────────── */}
      <mesh position={[HALF, CEIL / 2, zMid]} receiveShadow castShadow>
        <boxGeometry args={[T, CEIL, depth]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
      </mesh>

      {/* ── BACK WALL (behind entrance — closes the room) ─────────────────── */}
      <mesh position={[0, CEIL / 2, zBack]} receiveShadow castShadow>
        <boxGeometry args={[W, CEIL, T]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={WALL_ROUGHNESS} metalness={0} />
      </mesh>

      {/* ── PARTITION WALLS (zone thresholds with doorway openings) ─────────── */}
      {PARTITIONS.map((p) => (
        <PartitionWall key={p.z} z={p.z} openW={p.openW} openH={p.openH} />
      ))}

      {/* ── WINDOW WALL ────────────────────────────────────────────────────── */}
      <WindowWall />

      {/* ── MINIMAL GLOBAL AMBIENT ─────────────────────────────────────────────
          Keeps unlit sides of geometry from going pure black. Kept very low
          so it doesn't wash out the zone lighting effects. The real mood
          comes entirely from ZoneLighting, not this. */}
      <ambientLight intensity={0.18} color="#7070a0" />

    </group>
  )
}
