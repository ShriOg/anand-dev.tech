'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ZoneLighting — Prototype 0.4
//
// PURPOSE: prove that light *alone*, on the existing flat-gray greybox
// architecture, can produce emotionally distinct zones matching Sec. 11's
// palette (Wonder / Curiosity / Pride / Reflection / Connection / Ambition).
//
// RULES (from spec):
//   ✅  Directional light per zone — position, intensity, color only
//   ✅  Per-zone color temperature per Sec. 11 + Sec. 5/20's time-of-day concept
//   ✅  Point light pools for warmth — no fixture geometry
//   ✅  Basic shadow casting on existing geometry
//   ❌  No props, furniture, textures
//   ❌  No light fixture geometry (lamps, fittings)
//   ❌  Nova detail / animations
//
// ZONE Z-CENTRES (from RoomArchitecture coordinate reference):
//   Entrance:     z ≈ +5   (camera start z=8, room back z=11)
//   Workbench:    z ≈ +2   (left side, x ≈ -2.5)
//   Creations:    z ≈ -4   (right side, x ≈ +2.5)
//   Nova's Desk:  z ≈ -12  (central)
//   Mindset:      z ≈ -11  (center-left)
//   Window:       z ≈ -20  (far end)
// ─────────────────────────────────────────────────────────────────────────────

// ── ENTRANCE (Wonder) ────────────────────────────────────────────────────────
// Brief: two windows, dawn / golden-hour light. Camera enters from z=8.
// Warm golden-hour — the first thing the visitor feels is warmth.
// Primary: directional from upper-right (morning sun angle), warm gold.
// Secondary fill: soft warm wash, low intensity, from front (simulating
//   ambient sky glow through the entrance windows).
// Point anchor: golden pool centred on the entrance floor, eye-height glow.
function EntranceLights() {
  return (
    <group>
      {/* Primary — golden-hour directional, upper-right of entrance */}
      <directionalLight
        position={[4, 6, 10]}
        intensity={1.8}
        color="#ffc870"
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
      {/* Secondary fill — warm sky-glow, opposite angle */}
      <directionalLight
        position={[-3, 3, 12]}
        intensity={0.6}
        color="#ffaa50"
      />
      {/* Point anchor — golden pool on the entrance floor */}
      <pointLight
        position={[0, 2.2, 5]}
        intensity={6}
        color="#ffb347"
        distance={5}
        decay={2}
      />
    </group>
  )
}

// ── WORKBENCH (Curiosity) ────────────────────────────────────────────────────
// Brief: desk lamp feel, side-angled warm amber. The kind of light you work
// under — focused, not ambient. Camera passes left side (x≈-2.5, z≈+2).
// Primary: angled from above-left (simulating a lamp above the bench surface).
// Secondary: softer warm from right (wall bounce, reduces harsh shadow).
// Point anchor: tight warm pool at bench level, left-of-centre.
function WorkbenchLights() {
  return (
    <group>
      {/* Primary — lamp angle from above, amber-warm */}
      <directionalLight
        position={[-4, 5, 4]}
        intensity={2.0}
        color="#ff8c30"
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
      {/* Secondary fill — warm bounce off right wall, low intensity */}
      <directionalLight
        position={[5, 2, 2]}
        intensity={0.5}
        color="#ffb060"
      />
      {/* Point anchor — focused hot-spot at bench surface level */}
      <pointLight
        position={[-2.5, 2.5, 2]}
        intensity={8}
        color="#ff8c30"
        distance={4}
        decay={2}
      />
    </group>
  )
}

// ── CREATIONS (Pride) ────────────────────────────────────────────────────────
// Brief: lit shelf wall like trophies under spotlights. Warm white — the
// cleanest, proudest light in the room. Camera passes right side (x≈+2.5, z≈-4).
// Primary: spotlight-style from above-right (shelf display angle).
// Secondary: softer warm fill from the left (wall-bounce).
// Point anchors: three shelf spot-pools (top, mid, low) on the right wall.
function CreationsLights() {
  return (
    <group>
      {/* Primary — shelf-display directional, warm white */}
      <directionalLight
        position={[4, 7, -2]}
        intensity={2.2}
        color="#ffd070"
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
      {/* Secondary fill — softer warm, from left, bounce */}
      <directionalLight
        position={[-3, 3, -4]}
        intensity={0.7}
        color="#ffbb55"
      />
      {/* Three shelf accent pools — trophy-display spotlights */}
      <pointLight position={[4.5, 2.5, -3]}  intensity={5} color="#ffe0a0" distance={3} decay={2} />
      <pointLight position={[4.5, 1.5, -4]}  intensity={4} color="#ffd080" distance={3} decay={2} />
      <pointLight position={[4.5, 0.8, -5]}  intensity={4} color="#ffcc70" distance={3} decay={2} />
    </group>
  )
}

// ── MINDSET (Reflection) ─────────────────────────────────────────────────────
// Brief: diffuse, even, cool-leaning. Deliberately calm — the transition point
// from warm/energetic zones toward the cooler Window ahead. No hard source;
// the light feels like it's coming from nowhere specific. Camera at (x≈-1, z≈-10).
// Primary: wide, high-angle, desaturated cool — "overcast studio" feel.
// No secondary accent — evenness is the design.
// Point anchor: very soft, wide diffuse pool, low intensity.
function MindsetLights() {
  return (
    <group>
      {/* Primary — wide, high, soft cool directional */}
      <directionalLight
        position={[0, 8, -8]}
        intensity={1.6}
        color="#9fb3d8"
      />
      {/* Secondary — opposite low angle, fills shadow under shelves */}
      <directionalLight
        position={[0, 1.5, -14]}
        intensity={0.4}
        color="#b0c8e8"
      />
      {/* Wide soft ambient pool — makes this corner feel the most "even" */}
      <pointLight
        position={[-1, 2.8, -11]}
        intensity={3}
        color="#a8bcdc"
        distance={7}
        decay={1.5}
      />
    </group>
  )
}

// ── NOVA'S DESK (Connection) ─────────────────────────────────────────────────
// Brief: warm dominant + one cool cyan accent. The warm/cool mix signals
// "duality" — a character who bridges warm human energy and cool machine
// intelligence. Camera near (x≈+1, z≈-14).
// Primary: warm desk-lamp from above, slightly off-centre.
// Accent: single cyan point — Nova's face-panel glow (small, tight, cool).
//   This validates the "cyan accent visible from Mindset" sightline (Sec. 20).
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
      {/* Cyan accent — Nova's face/panel glow — tight, small, unmistakable */}
      <pointLight
        position={[0.4, 1.4, -13.5]}
        intensity={4}
        color="#4fc3d4"
        distance={3}
        decay={2.5}
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
// Brief: night-sky blue, widest, coolest. The room "opens up" tonally and
// spatially here — matching the FOV-widening choreography from Sec. 5.1a.
// The city glow beyond suggests a warm world outside, but the room at the
// window itself is cooler and more expansive than anywhere else.
// Primary: night-sky directional, wide, from through the window (z≈-24).
// Secondary: warm interior bounce from behind camera (the room still glows
//   warmly when you look back — the wow-moment setup).
// Point anchor: blue-white city glow at the window opening centre.
function WindowLights() {
  return (
    <group>
      {/* Primary — night-sky light through the window, cool blue */}
      <directionalLight
        position={[0, 4, -26]}
        intensity={2.5}
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
      {/* Wide cool overhead — makes this feel like an open sky, not a box */}
      <pointLight
        position={[0, 3.0, -20]}
        intensity={4}
        color="#6090d8"
        distance={8}
        decay={1.5}
      />
      {/* Warm interior backward glow — the room behind you glowing during wow moment */}
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
// Each sub-component is responsible for one zone only.
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
