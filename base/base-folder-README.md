# README — base/

This folder contains the complete creative + technical brief for a full portfolio redesign. Read in this order:

1. `portfolio-creative-brief.md` — world concept, narrative, floorplan, the six validated corners
2. `copywriting-and-nova-dialogue.md` — locked hero copy, all corner copy, Nova's dialogue tree, the 12-note discovery sequence
3. `technical-architecture.md` — camera system, scene strategy, mobile strategy, Nova system design, performance budget
4. `prototype-0.1-spec.md` — the first build target (boxes + spline camera + scroll + DOF, no art yet)
5. `*-concept-art-prompt.md` + matching render images — the six validated visual references for each zone

Later documents sometimes supersede earlier notes (e.g. the Window's closing line, the Creations naming, the Mindset prop language) — where that happens, the later document says so explicitly. If anything seems to conflict, trust the most recently dated file.

---

## Scope: this is a total redesign

This portfolio replaces the existing site entirely. Treat the current/pregenerated site as reference for what to remove, not as a base to incrementally patch — the new structure (one continuous 3D room, camera-driven navigation, no separate pages) is fundamentally different from the old layout and shouldn't be merged with it.

---

## Important — there are two things named "Nova." Do not confuse them.

**1. "Nova AI Companion" — an existing, separate product.**
This is one of the three real projects shown on the Creations shelf in this redesign (alongside MenuNova and Smart Waste Management). It has its own existing codebase/backend.
**Do not modify, refactor, or touch the Nova AI Companion product's existing code.** This redesign only needs to *display* it as a project on the Creations shelf (mockup screen, name, tagline, "Explore" link) — it does not need its actual backend logic touched in any way.

**2. "Nova" — the in-workshop character living at the desk in this new site.**
This is a *new* feature being built specifically for this portfolio: a small robot character who lives in the 3D scene, reachable via the signature live-chat feature described in the brief. Building this *is* part of the scope of this redesign — his dialogue system, his persona, his desk in the 3D room, all need to be implemented per `technical-architecture.md` Section 5.5 and the dialogue tree in `copywriting-and-nova-dialogue.md`.

**In short:** build the in-workshop Nova character fully. Leave the separate Nova AI Companion product's own codebase completely untouched — it only appears here as a displayed project, nothing more.
