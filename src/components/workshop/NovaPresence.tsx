'use client'

// ─────────────────────────────────────────────────────────────────────────────
// NovaPresence — Prototype 0.5
//
// Implements the "always near, not in that room over there" requirement from
// Sec. 18 of the brief. Nova should be sensed from multiple zones — glow
// bleeding through threshold openings, visible on sightlines from Mindset
// and Creations — not only present when the camera arrives at his waypoint.
//
// This is SYMBOLIC rather than physically-accurate:
//   • Glow-bleed lights are placed just inside threshold openings, not at
//     Nova's actual position — they simulate what would happen if his light
//     leaked through architectural gaps.
//   • Peek lights sit along the camera path at z≈-9 (between Creations and
//     Mindset) where a sightline would graze Nova's desk through the gap.
//   • The aura halo is geometry (not animation) — a semi-transparent oversphere
//     that catches the cyan light and adds volumetric presence. No motion.
//
// Constraints:
//   ❌  No Nova animation
//   ❌  No character detail beyond sphere + glow
//   ✅  Lighting and emissive geometry only
// ─────────────────────────────────────────────────────────────────────────────

// Nova's desk position — single source of truth shared with glow-bleed placement
const NOVA_POS: [number, number, number] = [1.5, 0.4, -11]
const NOVA_COLOR   = '#00d4e8'
const NOVA_EMISSIVE = '#00aacc'

export function NovaPresence() {
  return (
    <group>
      {/* ── Nova Core Sphere ───────────────────────────────────────────────
          Relocated from ZoneBoxes. Enlarged slightly (0.25→0.32) and emissive
          intensity increased (2.5→3.0) so it reads from further away.
          The orbital ring and floor glow carry over from 0.4. */}
      <group position={NOVA_POS}>
        {/* Core sphere */}
        <mesh>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial
            color={NOVA_COLOR}
            emissive={NOVA_EMISSIVE}
            emissiveIntensity={3.0}
            roughness={0.05}
            metalness={0.1}
          />
        </mesh>

        {/* Aura halo — soft semi-transparent oversphere, catches ambient cyan light */}
        <mesh>
          <sphereGeometry args={[0.72, 20, 20]} />
          <meshStandardMaterial
            color={NOVA_COLOR}
            transparent
            opacity={0.06}
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* Orbital ring — makes Nova's marker distinctly recognisable */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.022, 8, 40]} />
          <meshStandardMaterial
            color={NOVA_COLOR}
            emissive={NOVA_EMISSIVE}
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Floor glow disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshStandardMaterial
            color={NOVA_COLOR}
            emissive={NOVA_EMISSIVE}
            emissiveIntensity={1.0}
            transparent
            opacity={0.22}
            roughness={1}
          />
        </mesh>
      </group>

      {/* ── Glow-Bleed Threshold Lights ────────────────────────────────────
          Two point lights placed just inside the zone-boundary thresholds.
          These simulate cyan light leaking through the doorway openings
          from Nova's desk into Mindset and Creations.

          Positioned deliberately in the OPENING GAP rather than at Nova's
          position — this makes the bleed feel architectural (light coming
          through a gap) rather than just "a light in that direction."

          Low intensity, large distance — soft wash, not a spotlight. */}

      {/* Mindset threshold bleed — inside the Creations/Mindset opening, z≈-8.5
          Camera passes through here at progress≈0.40, so this is visible
          well before arriving at Nova's desk at progress≈0.68 */}
      <pointLight
        position={[0.8, 1.8, -8.5]}
        intensity={1.8}
        color={NOVA_COLOR}
        distance={9}
        decay={2}
      />

      {/* Creations-side bleed — just past the Workbench/Creations boundary z≈-6.5
          Visible when the camera is still in the Creations zone (progress≈0.30-0.50).
          This is the "I can sense something in that direction" moment. */}
      <pointLight
        position={[1.2, 1.6, -6.5]}
        intensity={0.9}
        color="#4fc3d4"
        distance={7}
        decay={2}
      />

      {/* ── Peek Lights ────────────────────────────────────────────────────
          Placed along the camera path at z≈-9 where a sightline through
          the threshold gap would land near Nova's desk. These create the
          specific "glimpse" moment the spec describes.

          These are not meant to fully illuminate Nova — they're the reflection
          of his glow on the wall/floor near the opening, the visual equivalent
          of "seeing light around a corner." */}

      {/* Primary peek — ceiling-wash near sightline at z≈-9 */}
      <pointLight
        position={[1.0, 2.6, -9.0]}
        intensity={1.2}
        color={NOVA_COLOR}
        distance={5}
        decay={2.5}
      />

      {/* Secondary peek — floor-level near the threshold, z≈-10.5
          This is the glow you'd see on the floor through the gap
          when looking diagonally from Mindset. */}
      <pointLight
        position={[0.6, 0.4, -10.5]}
        intensity={0.8}
        color="#3ab8cc"
        distance={4}
        decay={2.5}
      />
    </group>
  )
}
