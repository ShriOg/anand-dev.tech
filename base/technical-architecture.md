# Technical Architecture — Step 5

> Concrete recommendations, not just open questions. Where a real decision is still needed, it's flagged explicitly.

---

## 5.1 Camera System

**The pipeline:**
```
Raw scroll/drag input
      ↓
Smoothed progress value (0–1), via lerp/spring damping — NOT bound directly to scroll position
      ↓
Sampled point + tangent on a CatmullRom spline through the six waypoints
      ↓
Camera position + look-at target + FOV, all driven off that sampled point
      ↓
Section/zone triggers fire when progress crosses defined thresholds (lighting cues, ambient sound swaps, Nova's idle reactions)
```

**Key decision, made now:** raw scroll delta should never set camera position directly — it should nudge a target progress value, and the actual camera state should *lerp toward* that target every frame (critically damped spring, not linear lerp, to avoid the "rubber band" feel). This single decision is most of what makes the difference between "Apple smoothness" and "scroll-jacked website." Nav clicks do the same thing — they just set a new target progress and let the same damped system glide there, so clicking nav and scrolling produce visually identical motion.

**Still open:** exact spline tension/curve type, and exact easing constants — these are tuning, not architecture, and are better discovered by building a rough version and adjusting by feel than by specifying numbers now.

---

## 5.1a Camera Choreography — how it should feel, not just how it moves

This is experience design, not implementation, and it should be decided before the spring/easing constants are tuned, since the numbers should serve the feeling rather than the other way around.

- **FOV:** widen gradually from Entrance toward Window — tightest/most intimate FOV at Nova's Desk (Connection), widest at the Window (Ambition, the world opening up). Mirrors the emotional palette in Sec. 11 directly: the lens itself should track the feeling, not just the lighting.
- **Speed per segment:** not uniform. Entrance → Workbench → Creations can move with relatively brisk, energetic pacing (Curiosity/Build/Pride are active, forward-moving feelings). Creations → Mindset should slow down noticeably — Reflection earns a deliberately calmer camera, not just calmer lighting.
- **Nova's Desk:** the camera should subtly *settle* here rather than just pass through — a small deceleration and perhaps a slight, slow drift/breathing motion while idle (not a hard stop), reinforcing "this is a place to linger," consistent with him being the emotional anchor of the room.
- **The Window reveal:** should be the slowest, longest movement of the entire experience, by a clear margin — this is the wow moment from Sec. 12, and pacing is most of what sells a reveal. If every transition takes roughly the same time, this one won't land. It should feel unmistakably different in duration and speed from everything before it.
- **General principle:** speed and FOV changes should track the emotional palette (Sec. 11) zone-by-zone, not be uniform "nice smooth motion" applied identically everywhere — uniform smoothness is correct for *mechanics* (no jerk, no scroll-jacking) but wrong for *pacing* (every act should not feel the same).

---

## 5.2 Scene Strategy

**Recommendation: Option B — one room, loaded/detailed in chunks.** Not a hard cut between separate scenes (that would reintroduce the "six dioramas" problem already solved at the concept-art stage), but graduated detail: the zone the camera is currently in (plus its immediate neighbors per the floorplan's sightlines) renders at full fidelity; everything farther away swaps to a simplified low-poly/low-res proxy.

**The useful overlap:** the soft, out-of-focus "tease" backgrounds validated in five of six renders can be achieved with real depth-of-field blur in the render pipeline. That's not just an art choice — a blurred distant zone can also legitimately be a lower-detail asset, because blur hides the lower fidelity. One technique solves both the storytelling goal (sense, don't resolve) and the performance goal (don't render full detail far away) at the same time. Worth designing the DOF/blur system and the LOD system together rather than as two separate problems.

**Mechanism:** frustum culling + distance-based LOD swapping (three detail tiers per object: hero/mid/far, matching the tiering already established in Sec. 2 and Sec. 16) + the camera's own depth-of-field doing the visual cover-up.

---

## 5.3 Asset Pipeline

- **Format:** glTF/GLB, Draco-compressed geometry, KTX2/Basis-compressed textures
- **Modeling tool:** Blender (or equivalent) for the stylized-diorama assets, matching the validated render style as closely as practical — concept art exists now as a direct visual reference for modelers/AI-3D tools
- **Lighting:** bake what can be baked (static lightmaps for fixed lamps, ambient occlusion) rather than relying purely on real-time lights — cozy warm lighting is mostly static per zone anyway, real-time should be reserved for Nova's glow, screen flicker, and the few things that actually need to react dynamically
- **Texture atlasing:** one atlas per zone, not per object — keeps draw calls down
- **Per-zone budget tiers:** mirrors the hero-quality/simplified split from Sec. 2/16 directly into LOD tiers — no new categorization needed, the art-direction tiering *is* the technical tiering

---

## 5.4 Mobile Strategy

**Recommendation: simplified 3D, not a 2D fallback mode.** A "Premium 2D Story Mode" would protect performance but would also throw away the single biggest differentiator of this whole project — the continuous walkable room. Better to keep the same assets and same world, but change *how* it's navigated and *how much* is rendered:

- **Navigation:** replace continuous scroll-drag camera control with **waypoint snapping** — swipe/tap moves the camera to the next zone along the same spline, rather than requiring fine-grained continuous control that's hard on touch
- **Detail:** drop to fewer LOD tiers visible at once (current zone full detail, neighbors low-poly only, nothing else loaded), reduce or disable particle effects (dust motes, floating notes' physics), reduce light count to the 1–2 dominant sources per zone
- **DOF:** consider baking the blur look into the low-LOD assets/textures themselves rather than running a real-time post-process blur, to save GPU cost on mobile

This keeps the "real space" feeling the brief insists on, just with a coarser, cheaper version of the same mechanism — rather than swapping to a fundamentally different experience.

---

## 5.5 Nova System Design

**Architecture:**
```
Nova
 ├─ World knowledge      → condensed version of the brief itself (who Anand is, the workshop's premise)
 ├─ Project knowledge    → the Creations descriptions + taglines already written
 ├─ Visitor context      → current zone, time of day (ties into the time-of-day lighting feature)
 ├─ Treasure-hunt state  → which of the 12 hidden notes have been found this session/visit
 └─ Return-visit memory  → visit count, last zone reached, notes found previously
```

**Key decision:** Nova should not be a hardcoded dialogue-tree-only bot, and should not be an ungrounded general chatbot either. Recommended middle path — a lightweight backend function that calls an LLM with a system prompt assembled from the pieces above (persona + world/project knowledge + live visitor-context variables), with the hardcoded lines already drafted (Sec. 3 of the copy doc) used as **style examples in the system prompt**, not as the only possible outputs. This keeps Nova consistently in-character while still letting him respond naturally to whatever a visitor actually asks, rather than only matching pre-written branches.

**Persistence mechanism:** visit count / notes-found / last-zone can start as simple localStorage (no backend needed) and upgrade to a real lightweight database later if cross-device memory ever matters — doesn't need to be over-engineered for a passion project's first version.

---

## 5.6 Performance Budget

| Metric | Target |
|---|---|
| Frame rate | 60fps desktop, 30fps+ mobile minimum |
| Visible triangle budget | ~150k–300k at once (full scene total can be higher; LOD/culling keeps visible count down) |
| Texture atlas size | 2048×2048 max per zone, compressed (KTX2/Basis) |
| Draw calls | Target under ~150 per frame |
| Particle count | Under ~50 active at once (sparkles, dust, floating note physics) |
| Asset loading | Lazy-load per zone — only the current zone + immediate neighbors' full-detail assets are loaded; farther zones load on approach |

These are starting targets, not guarantees — the real number only gets validated once a first rough build exists and gets profiled on actual target devices (especially mid-range mobile, which will be the tightest constraint).

---

## Sequencing note

Per the roadmap: 5.1 (camera) and 5.2 (scene strategy) are the two decisions that most affect everything downstream and are worth prototyping first, even roughly — a bare-bones camera gliding through placeholder boxes would validate the feel before any real asset production begins. 5.4 (mobile) and 5.6 (performance) are easier to tune once 5.1/5.2 exist than to fully spec in the abstract now.

---

*Generated from Sections 3, 15, 16, 18, and 20 of the creative brief, plus the copy/Nova work in `copywriting-and-nova-dialogue.md`.*
