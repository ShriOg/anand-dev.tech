# Prototype 0.1 — Spec / Generation Prompt

> Purpose: validate the *feel* of moving through the workshop before any art or Nova work goes into production. No textures, no models, no UI polish — boxes only. If this feels magical, everything else is execution. If it feels boring, that's discovered now, not after weeks of asset production.

---

## What to build

A minimal React Three Fiber scene containing:

- **Five placeholder boxes**, positioned according to the vertical-climb floorplan (Sec. 20 of the brief): Entrance, Workbench, Creations, Mindset, Window. Use simple labeled cubes/rectangular prisms at the correct relative positions and rough scale — no materials beyond flat color per box (one distinct color per zone is fine, purely for orientation while testing).
- **One additional small marker** for Nova's Desk, positioned centrally per the floorplan, visually distinct (e.g. a small sphere) so its "always near" centrality can be felt even with placeholder geometry.
- **A camera spline** running through the six points in the documented path order: Entrance → Workbench → Creations → Mindset → Nova's Desk-adjacent → Window (per Sec. 15/18's path, routing around Nova's Desk rather than stopping there as a discrete waypoint).

## Camera system (per Sec. 5.1 of `technical-architecture.md`)

```
scroll/drag input
      ↓
target progress value (0–1) — input only ever nudges this
      ↓
critically-damped spring, lerps current progress toward target every frame
      ↓
sample position + tangent on the CatmullRom spline at current progress
      ↓
set camera position + look-at target from the sampled point
```

**Critical constraint:** scroll delta must never set camera position directly. It only ever adjusts the target progress value; the spring is what actually moves the camera, every frame, regardless of whether scroll input is currently happening. This is the single most important thing to get right in this prototype — it's the entire point of building it.

## Camera choreography to test (per Sec. 5.1a)

- FOV should widen gradually from Entrance toward Window — tightest near Nova's Desk, widest at Window
- Speed should NOT be uniform across segments: brisker through Entrance→Workbench→Creations, a noticeable slowdown into Mindset, a settling/lingering near Nova's Desk, and the slowest movement of the entire path on the final approach to Window
- Even with placeholder boxes, these pacing differences should be testable and tunable by feel

## Depth of field

- Apply a depth-of-field post-process effect tied to camera distance from the current focal point
- The box(es) nearest the current camera position should be in sharp focus; boxes further along the path should blur progressively
- This is being tested for two things at once: (1) does it produce the "sense, don't resolve" feeling the art direction wants, and (2) does it perform acceptably — this is also the mechanism intended to mask lower-detail distant geometry later, so it's worth evaluating both jobs now even with simple boxes

## Navigation

- A simple nav (text links or buttons for the six zone names) should set a new target progress value and let the same spring system glide there — clicking nav and scrolling should produce visually identical camera motion, not two different systems

## What NOT to include in this prototype

- No textures, materials beyond flat color, lighting design, or models
- No Nova chat, no UI polish, no sound
- No mobile-specific adaptation yet — desktop behavior only, validate the core feel first

## What this prototype needs to prove

- [ ] Does the spring-damped camera feel smooth and premium, or does it still feel laggy/rubber-bandy? (tune spring constants by feel)
- [ ] Does varying speed per segment (per the choreography spec) actually feel noticeably different, or does it need more contrast?
- [ ] Does the Window's slow final approach feel like a deliberate reveal, even with just a box?
- [ ] Does the depth-of-field blur read as atmospheric/intentional, or distracting?
- [ ] Does nav-click motion feel identical to scroll-driven motion?

If most of these hold up with plain boxes, the camera/scene architecture is validated and the next risk shifts entirely to art and content — which is already largely done.

---

*Generated from Sections 3, 15, 18, 20 of the creative brief, and Sections 5.1/5.1a/5.2 of `technical-architecture.md`. Hand this directly to Antigravity as the build prompt for Prototype 0.1.*
