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
//   Nova's Desk:  z ≈ -9  (central — always near, the constant anchor)
//   Mindset:      z ≈ -11
//   Window:       z ≈ -20
// ─────────────────────────────────────────────────────────────────────────────

const W     = 10    // room width (x: -5 to +5)
const CEIL  = 3.0   // ceiling height (Section 20: 2.8–3.2m, cozy)
const HALF  = W / 2

// Flat gray for all architecture — no warmth, no material variation.
// 0.3 test: does geometry alone make this feel like a room?
// Using MeshLambertMaterial (flat-shaded) rather than Standard so the
// geometry reads without being dependent on PBR lighting values.
const WALL_COLOR = '#4a4a52'  // medium-dark gray, reads clearly against the dark void
const FLOOR_COLOR = '#3a3a40' // slightly darker than walls (ground reads separately)
const CEIL_COLOR  = '#2e2e34' // darker still — ceiling recedes appropriately

// Wall thickness — visible but not bulky
const T = 0.15

// ─────────────────────────────────────────────────────────────────────────────
// Zone partition walls — positioned at thresholds between zones per Sec. 20.
// Each has a centred doorway opening. The camera path has been verified to
// pass through each opening (camera x ≈ 0 at each threshold z).
//
// Opening sizing: Section 20 specifies "walking distances" between zones,
// implying human-scale thresholds (~0.9m door = ~1.5 units here, but widened
// to 2.4 for camera clearance and the "wide workshop door" feel).
// ─────────────────────────────────────────────────────────────────────────────
const PARTITIONS = [
  // Between Entrance and the Workbench/Creations level
  // Camera crosses at x ≈ -1.25 (midway Entrance→Workbench), so opening centred ±1.5 works
  { z: 0,    openW: 3.0, openH: 2.6, label: 'Entrance → Workbench/Creations' },
  // Between Creations and Mindset
  // Camera crosses at x ≈ 0.75 (midway Creations→Mindset)
  { z: -7.5, openW: 3.0, openH: 2.6, label: 'Creations → Mindset' },
  // Between Mindset/Nova and Window — wider opening (the "approach" reads more open)
  // Camera at x ≈ 0.5 here
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
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[pillarCX, CEIL / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[pillarW, CEIL, T]} />
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>
      {/* Top transom */}
      {transomH > 0.02 && (
        <mesh position={[0, transomCY, 0]} castShadow>
          <boxGeometry args={[openW, transomH, T]} />
          <meshLambertMaterial color={WALL_COLOR} />
        </mesh>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Window wall — the far end of the room (Section 20: "full window wall, city
// skyline"). At 0.3 we only need the wall-with-cutout; no skybox yet.
// A wide, tall opening with narrow frame pillars on each side.
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
          <mesh position={[-frameCX, CEIL / 2, 0]} receiveShadow>
            <boxGeometry args={[frameW, CEIL, T * 2]} />
            <meshLambertMaterial color={WALL_COLOR} />
          </mesh>
          <mesh position={[frameCX, CEIL / 2, 0]} receiveShadow>
            <boxGeometry args={[frameW, CEIL, T * 2]} />
            <meshLambertMaterial color={WALL_COLOR} />
          </mesh>
        </>
      )}
      {/* Transom — above the opening */}
      {transomH > 0.02 && (
        <mesh position={[0, openH + transomH / 2, 0]}>
          <boxGeometry args={[openW, transomH, T * 2]} />
          <meshLambertMaterial color={WALL_COLOR} />
        </mesh>
      )}
      {/* Sill — below the opening (thick, ground level) */}
      <mesh position={[0, sillH / 2, 0]}>
        <boxGeometry args={[openW, sillH, T * 3]} />
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>
      {/* Backdrop — a dark plane set back beyond the opening, so the
          cutout reads as a real void rather than a painted surface */}
      <mesh position={[0, CEIL / 2, -1.8]}>
        <planeGeometry args={[openW, CEIL]} />
        <meshLambertMaterial color="#050508" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomArchitecture — the complete architectural shell for Prototype 0.3.
//
// Material language: flat gray (meshLambertMaterial) throughout.
// Lighting: two directional fills at low angle so surfaces read as geometry
// without being a lighting design — just visibility.
//
// Zero props, furniture, textures, or decorative elements — this prototype
// is purely testing whether the spatial volume and thresholds work.
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
        <meshLambertMaterial color={FLOOR_COLOR} side={THREE.DoubleSide} />
      </mesh>

      {/* ── CEILING ────────────────────────────────────────────────────────── */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, CEIL, zMid]}
        receiveShadow
      >
        <planeGeometry args={[W, depth]} />
        <meshLambertMaterial color={CEIL_COLOR} side={THREE.DoubleSide} />
      </mesh>

      {/* ── LEFT WALL (x = -5) ─────────────────────────────────────────────── */}
      <mesh position={[-HALF, CEIL / 2, zMid]} receiveShadow castShadow>
        <boxGeometry args={[T, CEIL, depth]} />
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>

      {/* ── RIGHT WALL (x = +5) ────────────────────────────────────────────── */}
      <mesh position={[HALF, CEIL / 2, zMid]} receiveShadow castShadow>
        <boxGeometry args={[T, CEIL, depth]} />
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>

      {/* ── BACK WALL (behind entrance — closes the room) ─────────────────── */}
      <mesh position={[0, CEIL / 2, zBack]} receiveShadow>
        <boxGeometry args={[W, CEIL, T]} />
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>

      {/* ── PARTITION WALLS (zone thresholds with doorway openings) ─────────── */}
      {PARTITIONS.map((p) => (
        <PartitionWall key={p.z} z={p.z} openW={p.openW} openH={p.openH} />
      ))}

      {/* ── WINDOW WALL ────────────────────────────────────────────────────── */}
      <WindowWall />

      {/* ── ARCHITECTURE VISIBILITY LIGHTING ──────────────────────────────────
          Two broad, low-intensity directional fills — just enough to reveal
          the geometry as distinct surfaces. Not a lighting design pass.
          Angles chosen to graze walls and floor from different directions
          so all surfaces read, including inside the doorway thresholds. */}

      {/* Fill A — from above-right, slightly forward — lights floor and left wall */}
      <directionalLight
        position={[6, 8, 6]}
        intensity={0.9}
        color="#c8c8d4"
      />
      {/* Fill B — from above-left, slightly back — lights right wall and ceiling edge */}
      <directionalLight
        position={[-5, 6, -14]}
        intensity={0.5}
        color="#a0a0b0"
      />
      {/* Ambient — stops surfaces going pure black in shadow */}
      <ambientLight intensity={0.35} color="#888899" />

    </group>
  )
}
