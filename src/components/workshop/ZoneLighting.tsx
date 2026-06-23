'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ZoneLighting — Prototype 0.5
//
// Changes from 0.4:
//   • Early zones (Entrance, Workbench): secondary fill dimmed to reduce visual
//     density and strengthen the perceptual gradient toward the late zones.
//   • Hue separation amplified across all zones so each is identifiable by
//     light alone (Sec. 11 palette sharpening):
//       Entrance:   orange-red (#ff9d3a) — fire/dawn, not "warm yellow"
//       Workbench:  hard acid-amber (#e87000) — focused desk lamp, tight pool
//       Creations:  bright warm-white (#ffe8b0) — gallery-lit, distinctly lighter
//       Mindset:    cooler + dimmer blue (#7a9cc8) — jarring contrast vs Creations
//       Nova's Desk: cyan accent intensity 4→7, wider distance — source for glow-bleed
//       Window:     flooded cool blue, intensity 2.5→3.2, added moonlight wash
//
// ZONE Z-CENTRES (from RoomArchitecture coordinate reference):
//   Entrance:     z ≈ +5
//   Workbench:    z ≈ +2   (left side, x ≈ -2.5)
//   Creations:    z ≈ -4   (right side, x ≈ +2.5)
//   Mindset:      z ≈ -11  (center-left)
//   Nova's Desk:  z ≈ -12  (central)
//   Window:       z ≈ -20  (far end)
// ─────────────────────────────────────────────────────────────────────────────

// ── ENTRANCE (Wonder) ────────────────────────────────────────────────────────
// Push hue to orange-red (#ff9d3a) — fire/dawn, unmistakably different from
// Workbench's amber. Secondary fill dimmed 0.6→0.4 to cut early-zone density.
function EntranceLights() {
  return (
    <group>
      {/* Primary — golden-hour directional, pushed redder for clear hue identity */}
      <directionalLight
        position={[4, 6, 10]}
        intensity={2.2}
        color="#ff9d3a"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
      {/* Secondary fill — dimmed 0.6→0.4 to reduce busyness (Sec. 2 restraint) */}
      <directionalLight
        position={[-3, 3, 12]}
        intensity={0.4}
        color="#ffaa50"
      />
      {/* Point anchor — orange-red dawn pool on entrance floor */}
      <pointLight
        position={[0, 2.2, 5]}
        intensity={6}
        color="#ff8830"
        distance={5}
        decay={2}
      />
    </group>
  )
}

// ── WORKBENCH (Curiosity) ────────────────────────────────────────────────────
// Harder acid-amber (#e87000) — the desk lamp feel: focused, not ambient.
// Secondary fill dimmed 0.5→0.35, point anchor pool tightened 4→3 units for
// a harder, more directional character distinct from Entrance.
function WorkbenchLights() {
  return (
    <group>
      {/* Primary — hard acid-amber desk-lamp angle */}
      <directionalLight
        position={[-4, 5, 4]}
        intensity={2.0}
        color="#e87000"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
      {/* Secondary fill — dimmed 0.5→0.35 (density reduction) */}
      <directionalLight
        position={[5, 2, 2]}
        intensity={0.35}
        color="#ffb060"
      />
      {/* Point anchor — tight hot-spot, distance 4→3 = harder pool */}
      <pointLight
        position={[-2.5, 2.5, 2]}
        intensity={8}
        color="#e87000"
        distance={3}
        decay={2}
      />
    </group>
  )
}

// ── CREATIONS (Pride) ────────────────────────────────────────────────────────
// Brighter warm-white (#ffe8b0) — gallery-lit, cleanest light in the room.
// Intensity 2.2→2.6. Distinctly lighter/whiter than Workbench's hard amber.
// A tester moving from Workbench should feel the room get brighter and cooler.
function CreationsLights() {
  return (
    <group>
      {/* Primary — bright warm-white gallery light */}
      <directionalLight
        position={[4, 7, -2]}
        intensity={2.6}
        color="#ffe8b0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
      {/* Secondary fill — warm bounce off left wall */}
      <directionalLight
        position={[-3, 3, -4]}
        intensity={0.7}
        color="#ffdd99"
      />
      {/* Three shelf accent pools — trophy-display spotlights */}
      <pointLight position={[4.5, 2.5, -3]}  intensity={6}  color="#ffe0b0" distance={3} decay={2} />
      <pointLight position={[4.5, 1.5, -4]}  intensity={5}  color="#ffd090" distance={3} decay={2} />
      <pointLight position={[4.5, 0.8, -5]}  intensity={5}  color="#ffcc80" distance={3} decay={2} />
    </group>
  )
}

// ── MINDSET (Reflection) ─────────────────────────────────────────────────────
// More saturated cool blue (#7a9cc8), intensity 1.6→1.4 — deliberately quieter.
// The transition from Creations (bright warm-white) to Mindset (dimmer cool blue)
// should feel jarring in a good way — the room's emotional temperature drops.
function MindsetLights() {
  return (
    <group>
      {/* Primary — more saturated cool blue, slightly dimmer than 0.4 */}
      <directionalLight
        position={[0, 8, -8]}
        intensity={1.4}
        color="#7a9cc8"
      />
      {/* Secondary — cool fill from below, preserves the flatness feeling */}
      <directionalLight
        position={[0, 1.5, -14]}
        intensity={0.4}
        color="#9ab8e0"
      />
      {/* Wide soft ambient pool — even, diffuse, the most "quiet" zone */}
      <pointLight
        position={[-1, 2.8, -11]}
        intensity={3}
        color="#8aaed4"
        distance={7}
        decay={1.5}
      />
    </group>
  )
}

// ── NOVA'S DESK (Connection) ─────────────────────────────────────────────────
// Cyan accent intensity 4→7, distance 3→5 — this is the source light for
// all the glow-bleed lights in NovaPresence.tsx. It needs more punch so the
// bleed reads as emanating from somewhere real.
// Warm dominant unchanged — the warm/cool duality is still the key signal.
function NovasDeskLights() {
  return (
    <group>
      {/* Primary — warm desk lamp, above and slightly left of desk */}
      <directionalLight
        position={[-1, 5, -12]}
        intensity={1.8}
        color="#ffaa60"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
      />
      {/* Warm pool anchored at desk surface */}
      <pointLight
        position={[0, 1.8, -14]}
        intensity={7}
        color="#ff9a50"
        distance={4}
        decay={2}
      />
      {/* Cyan accent — Nova face/panel glow — intensity 4→7, distance 3→5
          Stronger source means the bleed-through lights feel real, not arbitrary */}
      <pointLight
        position={[0.4, 1.4, -13.5]}
        intensity={7}
        color="#00d4e8"
        distance={5}
        decay={2}
      />
      {/* Secondary warm fill — bounces off back wall behind Nova */}
      <directionalLight
        position={[2, 2, -16]}
        intensity={0.5}
        color="#ffc880"
      />
    </group>
  )
}

// ── WINDOW (Ambition) ────────────────────────────────────────────────────────
// Intensity 2.5→3.2 — flooded with cool exterior light.
// Added moonlight-wash pointLight at ceiling level for the "open sky" sensation.
// At the Window, you should feel genuinely bathed in night-sky blue.
function WindowLights() {
  return (
    <group>
      {/* Primary — night-sky flood through the window, intensity 2.5→3.2 */}
      <directionalLight
        position={[0, 4, -26]}
        intensity={3.2}
        color="#5580c8"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
      {/* City glow — warm orange bloom rising from below the window sill */}
      <pointLight
        position={[0, 0.6, -22.5]}
        intensity={5}
        color="#ff8830"
        distance={5}
        decay={2}
      />
      {/* Wide cool overhead — open sky sensation */}
      <pointLight
        position={[0, 3.0, -20]}
        intensity={5}
        color="#5888d8"
        distance={9}
        decay={1.5}
      />
      {/* Moonlight wash — new in 0.5, ceiling-level cool, makes room feel sky-open */}
      <pointLight
        position={[0, 4.5, -20]}
        intensity={3}
        color="#4070c0"
        distance={10}
        decay={1.8}
      />
      {/* Warm interior backward glow — room behind glows during wow moment */}
      <directionalLight
        position={[0, 3, -14]}
        intensity={0.5}
        color="#ffaa55"
      />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ZoneLighting — drop this once into the Canvas alongside RoomArchitecture.
// ─────────────────────────────────────────────────────────────────────────────
export function ZoneLighting() {
  return (
    <group>
      <EntranceLights />
      <WorkbenchLights />
      <CreationsLights />
      <MindsetLights />
      <NovasDeskLights />
      <WindowLights />
    </group>
  )
}
