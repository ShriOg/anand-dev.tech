# The Workshop — Portfolio Creative Brief

> "I'm not browsing a portfolio. I'm exploring Anand's workshop, where every object tells part of his story."

**Scope note:** this is a total redesign, not an incremental patch on the existing site. The current/pregenerated site should be treated as reference for what's being replaced, not as a base to merge with — the new structure (one continuous 3D room, camera-driven navigation, no separate pages) is fundamentally different from a traditional page-based layout.

---

## 1. Who This Is For

- **Profession:** Full-stack engineer, founder, maker, designer, technical problem-solver
- **Founder of:** MenuNova — restaurant operating platform (flagship project, treat as a real product, not a school project)
- **Positioning:** Founder / Product Builder / Systems Thinker / Developer / Designer / Entrepreneur — never "student," "freelancer," "job seeker," or "tutorial-follower"
- **Goal of site:** Personal showcase / passion project (no recruiter-skim pressure — full creative freedom)
- **Emotional goal for visitors:** *"This person doesn't just write code. He builds products, experiments relentlessly, and has the potential to create companies."*

### Personality to channel
Curious about everything · learns by building · obsessed with real products · mixes engineering with design · wants technology to feel human · prefers originality over trends · thinks like a founder, not just a developer · constantly starts side projects.

### Technical background
Full-stack web dev, AI applications/agents, product design, UI/UX, startup building, hardware prototyping, embedded systems, Linux, databases, APIs, real-time apps. Stack: JS/TS, React, Next.js, Node.js, MongoDB, Python, Arduino, ESP32, Linux, modern AI APIs.

---

## 2. Visual & Emotional Direction

**Final direction: cozy, illustrated, premium "founder's studio" — not cyberpunk, not corporate-minimal.**

Strong dislikes (avoid):
- Generic developer templates, SaaS dashboard aesthetics, cookie-cutter portfolios
- Excessive gradients, overused glassmorphism
- Plastic/toy look, flat colors, mobile-game/Roblox aesthetics
- Low-poly / Animal Crossing-style game look
- 2D cutouts floating in 3D space ("looks impressive for 10 seconds, then feels like a slideshow")

**Visual style: Stylized premium 3D diorama**
Think: Pixar environment quality, Monument Valley simplicity, Studio Ghibli warmth, Apple-grade lighting and polish. Not realistic, not cartoonish — **stylized reality**.

- Plants slightly fuller, lamps glow warmer, robot companion cuter, books with personality, sticky notes that gently float, screens that emit soft light
- Materials: warm wood, fabric textures, soft metals, frosted glass, paper, ambient lighting — like a premium animated movie set

**Detail budget (to keep scope sane):**
- *Hero-quality 3D modeling:* desk, Nova-bot, hero plants, monitor/screens, key project artifacts, lamps, books
- *Simplified background:* distant shelf items, wall clutter, secondary props
- Focus quality where the eye naturally looks — gives ~90% of the wow-factor without building an entire game world

---

## 3. Core Concept: One Continuous Room, Not Pages

The site is a single handcrafted 3D environment — a founder's studio — explored via real camera movement (Three.js / WebGL), not page navigation.

- **Camera, not router:** Nav items (Home, Projects, About, Lab, Journal, Let's Connect) are camera waypoints. Clicking glides the camera to that corner of the room — no page loads, no harsh cuts.
- **Scroll = walking:** Scroll position maps to camera position along a path through the space.
- **No long boring scroll, no disconnected pages** — a connected world for stronger storytelling, a premium feel, and a more memorable experience.

### The corners (now mapped to the narrative arc — see Section 8 for the full story)

| Corner | Section (renamed) | Narrative Act | Content |
|---|---|---|---|
| 🏠 Doorway | Hero | I — Curiosity | Entry point, warm light, headline, unfinished ideas/sketches, Nova-bot greets visitor |
| 🔧 Workbench | Workshop | II — Experimentation | Arduino boards, wires, failed/working prototypes, skills shown through tools |
| 🪴 Shelves | Creations | III — Products | MenuNova (flagship), Nova AI Companion, Smart Waste Management — each a trophy earned through iteration |
| 🤖 Nova's Desk | Signature feature | — | Live embedded AI chat with Nova, approached physically in the scene (diegetic, not a bolted-on widget) |
| 📚 Bookshelf | Mindset | IV — Systems | Principles, mental models, diagrams, books — how he thinks, zoomed out from individual projects |
| 🌙 Window | Leave A Note | V — Future | City glowing outside, room alive behind you — closing beat, contact form as a note on the windowsill |

### Ambient life (the room feels alive)
- Sunlight shifts as the user moves through the space
- Lamps turn on, screens animate
- Plants sway gently, sticky notes float
- Robot companion reacts to proximity/interaction

---

## 4. Signature Interactive Feature

**Nova-bot on the desk = real embedded AI chat.** Visitors walk up to Nova in the 3D space and talk to him directly — this is the chosen "go big" feature.

**⚠️ Naming clarification (resolved during technical/handoff planning — supersedes the original phrasing above):** there are two separate things named "Nova," and they should not be conflated:

1. **"Nova AI Companion"** — an existing, separate real product, shown on the Creations shelf alongside MenuNova and Smart Waste Management. It has its own existing codebase. **This product's backend is not touched by this redesign** — it only needs to be *displayed* as a project (mockup, name, tagline, link).
2. **"Nova," the in-workshop character** — a new, purpose-built persona living at the desk in this site, implemented per the lightweight system-prompt architecture in `technical-architecture.md` Sec. 5.5. He is *inspired by* and *thematically tied to* the Nova AI Companion product (sharing the name, the friendly character design, the memory/personalization themes) but is a distinct, simpler implementation built specifically for this portfolio — not a literal embed of the real product's backend.

In short: the original framing ("doubles as a live demo of the actual product") overstated the connection. The in-site Nova is a new feature that *honors* the real product thematically, not a live demo of it.

---

## 5. Additional Features (all confirmed as priorities)

These were grouped by underlying system to avoid duplicate engineering effort:

**Atmosphere layer** (scene state, lowest complexity, big immersion payoff)
- Time-of-day lighting — room reflects real visit time (morning light vs. warm evening lamp-light)
- Toggleable ambient sound — soft keyboard clicks, kettle, birds, low warm hum; off by default, opt-in only

**Discovery layer** (one unified hidden-objects system)
- Easter eggs — small hidden personality details (funny sticky notes, napkin sketches, etc.)
- Treasure-hunt sticky-note story — notes scattered through the room form a readable narrative if found/clicked in order; rewards exploration

**Memory layer** (lightweight persistence)
- Persistent / return-state changes — small details shift on repeat visits (cup now empty, new note appeared, robot says something different)
- Natural pairing with the discovery layer: a subtle "found X of Y notes" nod (e.g. mentioned by Nova in chat), tasteful, not gamified/childish

**Product-proof layer** (needs to work flawlessly — credibility risk if broken)
- Live MenuNova embed on the monitor — a real interactive mockup or live iframe of the actual product, not a static screenshot

---

## 6. Technical Direction (high-level, not yet a build plan)

- **Engine:** True 3D scene via Three.js / React Three Fiber — chosen explicitly over flat 2D parallax layers
- **Camera:** Defined spline/path through the room; scroll and nav both drive position along it; needs careful easing for "Apple smoothness"
- **Performance considerations:** texture atlasing, LOD, lazy-loading distant corners, mobile fallback plan (simplified camera path / lower-poly assets where needed) — true free-camera 3D is the hardest case to get smooth on phones, so this needs dedicated attention
- **Asset approach:** Real 3D modeling/sculpting in the stylized-premium style described above (not low-poly, not photoreal)

---

## 8. Narrative Layer — The Room Tells a Story

The workshop is not a random collection of objects. It represents the process of turning curiosity into reality. Every corner corresponds to a stage of creation — this is what makes the camera path mean something, rather than just being a neat traversal mechanic.

| Act | Corner | Contents | Message |
|---|---|---|---|
| **I — Curiosity** | 🏠 Entrance | Unfinished ideas, sticky notes, sketches, books, questions, half-built prototypes | Everything starts with curiosity |
| **II — Experimentation** | 🔧 Workbench | Arduino boards, wires, broken attempts, code on monitors, failed concepts, small successes | The fastest way to learn is to build |
| **III — Products** | 🪴 Project Shelves | MenuNova, Nova AI, Smart Waste Management, future projects — each displayed like a trophy earned through iteration | Ideas deserve to exist in the real world |
| **IV — Systems** | 📚 About Area | Zoomed out: principles, notes, mental models, books, diagrams — not projects, but how he thinks | Products are temporary. Systems endure |
| **V — Future** | 🌙 Window | The city glows outside, stars distant, the room alive behind you | The best project is always the next one |

The visitor should leave Act V with the realization that the workshop isn't finished — it's still growing.

### Renamed sections (authored, not templated)

| Generic | Renamed |
|---|---|
| About | **Mindset** |
| Skills | **Workshop** |
| Projects | **Creations** |
| Contact | **Leave A Note** |

### Tagline

Replace a job-title tagline ("Full-Stack Developer & Founder") with a line that captures the whole arc without boxing into a title. Candidates:
- *Turning curiosity into products.*
- *Building things that shouldn't exist yet.*
- *Ideas become reality here.*

---

## 10. The Character — Nova

Nova is not a feature bolted onto the desk. **Nova is a resident of the workshop.** Not an assistant, not a chatbot — a character who has watched every project get built and knows the stories behind everything in the room.

Sample voice:
- On MenuNova: *"That one took way more iterations than Anand expected."*
- On failure: *"Want to see the drawer full of abandoned ideas?"*
- On a return visit: *"Hey, you're back. I found another note you might've missed."*

This reframes the "live AI chat" feature from Section 4 — it's not a demo widget, it's the workshop's narrator. It also gives the memory layer (Section 5) somewhere to live emotionally: Nova is the one who remembers and comments on what's changed.

---

## 11. The Emotional Palette

Each act/corner has its own emotional temperature, so the room doesn't feel uniform from start to finish:

| Area | Feeling |
|---|---|
| Entrance | Wonder |
| Workshop | Curiosity |
| Creations | Pride |
| Mindset | Reflection |
| Nova's Desk | Connection |
| Window | Ambition |

This should inform lighting, pacing, and even Nova's tone in each area — not just the objects placed there.

---

## 12. The "Wow" Moment

Every memorable portfolio has one moment people remember afterward — Apple has product reveals, games have boss fights, films have iconic scenes. The Workshop needs its own.

**Proposed moment — at the Window:**
The camera slowly turns. For the first time, the entire workshop becomes visible behind the visitor — Nova, the projects, the workbench, the notes, the screens, the lamps — all glowing softly. The room feels alive and complete.

Then the final line appears:

> *The workshop is still under construction.*
> *Honestly, I hope it always is.*

**(Updated post-copywriting pass — see `copywriting-and-nova-dialogue.md` Sec. 4.** The original line, "The next project hasn't been built yet," was accurate but read a little too composed. The replacement turns the ending into something a person would actually say rather than a statement signing off the experience.)

This is the emotional ending — it reframes the whole visit as a chapter in something ongoing, not a finished tour.

---

## 13. Naming Refinement

The original working name, "Things I've Brought To Life," was memorable but long for navigation. A second pass tried "What Escaped The Workshop" — more voice, but tested as slightly awkward; visitors need to parse nav labels instantly.

**Final name: "Creations"** — simple, memorable, fits the workshop theme, feels premium without sacrificing clarity.

---

## 13a. Personal Artifacts Layer

A category of objects distinct from the named props in Section 16 — small, unglamorous, scattered naturally throughout the room rather than concentrated in one place. These don't get their own section; they're discovered, not curated.

Examples: a notebook with half-finished ideas, headphones on the desk, a coffee mug, a tiny Linux penguin figurine, a napkin sketch of an abandoned startup idea, a random loose prototype board.

**Why this matters:** these objects tell visitors who he is without needing paragraphs of text — the best portfolio storytelling happens when people *discover* things rather than read them. Overlaps with but isn't identical to the Discovery layer in Section 5 (Easter eggs are intentional "find this" moments; Personal Artifacts are ambient texture, glimpsed rather than hunted for).

**Confirmed placements:**
- *"It's not supposed to work yet."* — sticky note near the Workbench. Communicates experimentation, iteration, comfort with failure, in one founder-voiced line.
- *"Progress isn't linear"* sketch — a hand-drawn doodle (not a polished chart) on a notebook page at the Workbench: a jagged rising line over time, captioned "keep building." Human, not corporate.
- *"Focus on Impact"* sticky note — on the Mindset shelf. Explains *why* MenuNova exists without ever stating it directly.

---

## 15. Camera Path & Room Layout Sketch

A rough top-down sketch of the workshop, showing how the five acts sit in physical space and how the camera travels between them. This is a spatial sketch, not a technical spec — actual coordinates/spline math come later.

```
                         🌙 WINDOW (Act V — Future)
                      "Leave A Note" · Ambition
                    ┌─────────────────────────────┐
                    │   city glow beyond glass     │
                    │   full-room reveal happens   │
                    │   HERE (the Wow Moment)       │
                    └──────────────┬────────────────┘
                                   │
                                   │ camera pulls back & turns
                                   │
        📚 BOOKSHELF ────────────┼──────────── 🤖 NOVA'S DESK
     (Act IV — Systems)          │              (Connection)
      "Mindset" · Reflection     │          Nova sits here always —
                                  │          visible from almost every
                                  │          other corner, watching
                                  │
                                   │
        🪴 SHELVES ───────────────┼──────────── 🔧 WORKBENCH
   (Act III — Products)          │            (Act II — Experimentation)
  "Creations"    │             "Workshop" · Curiosity
        Pride                    │
                                  │
                    ┌──────────────┴────────────────┐
                    │    warm window light, desk,    │
                    │    half-built prototypes        │
                    └─────────────────────────────┘
                         🏠 ENTRANCE (Act I — Curiosity)
                              Wonder · entry point
```

**Camera path (the "walk"):**

```
Entrance ──▶ Workbench ──▶ Shelves ──▶ Bookshelf ──▶ Nova's Desk ──▶ Window
 (Wonder)    (Curiosity)    (Pride)    (Reflection)   (Connection)   (Ambition)
```

Notes on the path:
- **Nova's desk is positioned centrally**, not as a stop at the end of the line — Nova should be visible (even if distant/small) from multiple other corners, reinforcing "he's watched everything get built." The chat moment can be triggered whenever the visitor approaches the desk directly, independent of overall scroll position.
- **The path is mostly linear (Acts I→V)** for first-time visitors, matching the narrative arc, but nav clicks should allow jumping directly to any corner (camera glides there via the shortest sensible route, not necessarily retracing the full path).
- **The Window reveal works because of the path's geometry** — the camera has been moving *forward* through the room the whole time; the wow moment works precisely because turning around is the first time the visitor sees backward, recontextualizing everything they've passed.

---

## 16. Object Placement Per Act

A first-pass inventory of what physically lives in each corner, split by the detail-budget tiers from Section 2 (hero-quality vs. simplified background).

### Act I — Entrance (Wonder)
- **Hero-quality:** entry desk corner, a stack of sketchbooks, one glowing sticky note (first discovery-layer note), a small reading lamp
- **Simplified:** scattered loose papers, a half-drawn diagram pinned to the wall, window with morning/evening light (time-of-day system)
- **Narrative props:** an unfinished sketch of "something" — visitors won't know what it becomes until Act III

### Act II — Workbench (Curiosity)
- **Hero-quality:** Arduino board mid-assembly, a soldering iron, the Smart Waste System rover prototype (in-progress state, rougher than its "finished" version on the Shelves)
- **Simplified:** tangle of wires, scattered small components, a "drawer of abandoned ideas" (ties directly to Nova's line in Section 10)
- **Narrative props:** at least one visibly *failed* prototype — broken, intentionally — to make "the fastest way to learn is to build" feel earned, not stated

### Act III — Shelves / "Creations" (Pride)
- **Hero-quality:** MenuNova diorama (phone mockup, live embed per Section 5), Nova AI Companion diorama (glowing screen + chat bubble motif), Smart Waste Management diorama (finished rover version)
- **Simplified:** an empty fourth shelf slot — visibly reserved, hints at "the next project hasn't been built yet" without yet stating it
- **Narrative props:** each project displayed slightly elevated/lit like a trophy, per the brief's original "earned through iteration" framing

### Act IV — "Mindset" (Reflection)
**Revised prop language (post-Creations review):** Creations is "things I've built" — museum energy, trophies, finished artifacts, spotlights. Mindset needs to feel categorically different — "how I think" — or the transition from Pride to Systems reads as repetitive. So Mindset should lean on pinned diagrams, system sketches, mental models, handwritten principles, and connected notes rather than a wall of books. A few books can remain as minor texture, but they are not the primary visual language here the way they were at Creations.
- **Hero-quality:** a small pinboard or wall area with pinned papers, sketches, and handwritten principle cards — e.g. a simple connected sequence like *Focus on Impact → Build for Humans → Ship Early → Learn Fast → Iterate*, linked with string/thread or simple connecting lines across the pins; one or two framed diagrams representing mental models
- **Simplified:** a few books as minor texture (not the focal object), photos, smaller knick-knacks, background texture
- **Narrative props:** this is the zoomed-out corner — fewer objects than other acts, more breathing room, deliberately calmer pacing to match "Reflection." The pinned-notes wall should feel like looking into someone's actual thinking, not browsing a bookshelf.

### Nova's Desk (Connection — not tied to one act)
- **Hero-quality:** Nova-bot itself (highest-fidelity model in the scene — he's the emotional anchor), his small desk/perch, soft ambient glow
- **Simplified:** nothing extra needed — this corner should feel uncluttered so Nova has presence

### Act V — Window / "Leave A Note" (Ambition)
- **Hero-quality:** the window itself (key light source, city visible beyond), a single sticky note on the sill (the contact form)
- **Simplified:** distant city glow, stars
- **Narrative props:** this is where the full-room reveal happens (Section 12) and where the closing line appears

---

## 16a. Spatial Cohesion — Making It One Room, Not Six Sections

The current visual mockups (per the latest reference images) are strong per-corner but read as six separate cards/sections rather than one continuous, geographically coherent space. This is the single biggest gap between "cool portfolio" and "truly memorable experience" — closing it is the next priority.

**The requirement:** a visitor standing at any corner should be able to glimpse other corners in the distance — Nova's desk visible from the Bookshelf, warm entrance light visible from across the room, project shelves visible from the Workbench. Partial visibility (not full clarity) is what sells the illusion of one space rather than a slideshow of rooms.

**What this means concretely:**
- The room needs an actual floorplan — relative positions, sightlines, and approximate distances between corners — before further per-corner art is produced
- Lighting and depth-of-field should be used deliberately: distant corners can be dimmer/softer-focused while still legible as "that's the desk, that's the window," reinforcing scale and continuity
- Nova, being centrally placed (per Section 15), is a natural anchor visible from multiple angles — this should be treated as a deliberate spatial device, not a coincidence

**Next concrete deliverable (visual, outside this brief):** a true top-down floorplan of the entire workshop, showing how all six corners connect into one believable physical space — proportions, walking distances, and what's visible from where. This is the artifact that determines whether the camera-glide concept (Section 3) actually holds together once built.

---

## 18. Sightlines & Spatial Storytelling

**Governing rule, above all others in this section:** *the visitor should never feel teleported.* Every camera movement must feel like physically moving through a real space — that's the line between a cool website and a world people remember.

### Room geometry — the vertical climb

The room was reorganized from a flat horizontal layout into a vertical ascent, because climbing reads as a stronger metaphor for the narrative arc than walking around a square:

```
              5 — Leave a Note (Act V · future)
                        |
                4 — Mindset (Act IV · systems)
                        |
3 — Creations  ——  Nova's desk  ——  2 — Workbench
 (Act III · pride)  (always near)   (Act II · build)
                        |
              1 — Entrance (Act I · curiosity)
```

Curiosity → Experimentation/Products (side by side) → Systems → Connection (felt throughout, not visited) → Future. The visitor climbs upward through the narrative rather than circling a floor.

### Nova is symbolic, not spatial

Nova does not live in "a room over there" — he is felt as a constant presence. Don't model this as a literal, realistic line-of-sight; treat it as a deliberate storytelling device. From every zone (Entrance, Workbench, Creations, Mindset), the visitor should occasionally catch his glowing eyes, his desk lamp, a tiny silhouette, or hear him react to something nearby. The feeling to aim for: *"Nova is always around,"* not *"Nova is in that room over there."*

### The forward-tease rule

**Every zone must visually reference at least one previous area and one future area.** This is what prevents the six corners from feeling like six isolated dioramas and makes the room read as one living ecosystem:

- 🏠 **Entrance** — glimpse sparks/tools from the Workbench ahead
- 🔧 **Workbench** — see completed projects glowing on the Creations shelves
- 🪴 **Creations** — spot books and diagrams in Mindset, visible beyond
- 📚 **Mindset** — see Nova waiting, sensed nearby
- 🤖 **Nova's desk** — see the glow of the future-facing Window above
- 🌙 **Window** — looking back, the whole climbed room is visible below (this is also the Section 12 wow moment)

This subtly pulls visitors forward through the space without them consciously noticing they're being led.

**Visual note for the next diagram/asset pass:** Nova should slightly *overlap* the path visually, not just sit beside it — symbolically, not physically. The point to land subconsciously: every stage of the journey is connected through him.

**✅ Independently confirmed during Prototype 0.2:** even with a plain placeholder sphere and zero character detail, Nova's marker drew the eye before any of the zone landmarks did — testers' instinct was "where's Nova?" before "where's Mindset?" This wasn't asserted in the design, it was observed in the prototype, which is a stronger form of validation than the original design reasoning alone. It confirms the centrality decision in the floorplan (this section, Sec. 20) is doing real work even at the crudest possible fidelity.

---

## 20. Architectural Floorplan Specification

The first detailed, buildable pass at the room — dimensions, walking distances, and concrete sightlines, building directly off the validated Nova's Desk render for scale and material cues.

### Key decision: single floor, no literal elevation change
The "vertical climb" stays metaphorical. There are no stairs or floor-height changes between zones — the room is one continuous floor. The sense of ascent is created entirely through **camera height/tilt** (rising gradually from Entrance to Window) and **lighting temperature** (warmer/lower at Entrance, cooler/wider at Window, matching the night-city-skyline cue already validated in the Nova's Desk render). This keeps the camera glide smooth and protects the "never feel teleported" rule above — real elevation changes would risk awkward camera behavior at the transitions.

### Room dimensions

| Zone | Footprint | Notes |
|---|---|---|
| 1 — Entrance | 3.0m × 2.5m | Two windows, dawn/golden-hour light source |
| 2 — Workbench | 3.0m × 2.5m | Pegboard wall for tools (moved here from the over-cluttered Nova's Desk v1 draft) |
| 3 — Creations | 3.0m × 2.5m | Lit shelf wall holding the three project dioramas |
| Nova's Desk | 2.0m × 1.5m | Central; desk surface itself 1.2m × 0.6m, standard 0.75m desk height; Nova ≈ 0.35m sitting height |
| 4 — Mindset | 3.5m × 2.0m | Tall bookshelf wall, more vertical than deep — supports the "Reflection" pacing (Sec. 16) |
| 5 — Leave a Note | 4.0m × 1.5m | Full window wall, city skyline — same view glimpsed earlier from Nova's Desk |

**Overall bounding space:** ≈10m wide × ≈12.5m deep. **Ceiling height:** 2.8–3.2m throughout — cozy loft-studio proportions, not cavernous. (Optional future detail: a gentle ceiling slope near the Window, attic-style, if it reads well once modeled — not required.)

### Walking distances (camera path length)

| Segment | Approx. distance |
|---|---|
| Entrance → Workbench | ~4m |
| Workbench → Creations | ~6m (routes around Nova's Desk, per the detour in the floorplan diagram) |
| Creations → Mindset | ~4m |
| Mindset → Window | ~3m |
| **Total path length** | **~17m** |

For reference, that's a comfortable indoor walking distance — short enough to keep momentum, long enough that each transition reads as real movement rather than a snap-cut.

### Concrete sightlines (answers the open item from Sec. 16a / 18)

| From | Sees | How |
|---|---|---|
| Entrance | Warm lamp glow from Workbench | ~4m away, soft-focus, through the gap between rooms |
| Workbench | Soft light spilling off the Creations shelf wall | Across the gap, dim/secondary |
| Creations | Mindset's bookshelf lamp glow above | Partial, mostly light bleed rather than resolved detail |
| Mindset | Nova's desk glow nearby | ~3m away, his face-panel cyan glow visible as a small warm/cool accent |
| Nova's Desk | City skyline through the Window | ~3m ahead — **already validated** in the concept render; this is the one sightline confirmed to work in practice |
| Window | The entire room behind, softly lit | Full reveal — this is the Section 12 wow moment, the one place full resolution (not a tease) is intentional |

Every sightline except the Window's final reveal should stay a *tease* — soft-focus, partial, glow rather than detail — per the forward-tease rule. Only the Window gets the full payoff.

---

## 19. Status — Planned vs. Next

### ✅ Planned & Locked

**Identity & positioning**
- [x] Who it's for, founder/builder positioning, emotional goal for visitors (Sec. 1)
- [x] Visual direction: stylized premium 3D diorama (Pixar/Ghibli/Monument Valley/Apple-polish), dislikes ruled out (Sec. 2)
- [x] Detail budget tiering (hero-quality vs. simplified objects) (Sec. 2)

**World concept**
- [x] One continuous room, camera-driven navigation instead of pages (Sec. 3)
- [x] Six corners defined and mapped to renamed nav (Sec. 3, 13)
- [x] Ambient life list: lighting shifts, lamps, swaying plants, floating notes (Sec. 3)

**Narrative**
- [x] Five-act structure: Curiosity → Experimentation → Products → Systems → Future (Sec. 8)
- [x] Section renaming: Mindset / Workshop / Creations / Leave a Note (Sec. 8, 13)
- [x] Tagline options (Sec. 8)

**Character & emotion**
- [x] Nova defined as resident/narrator, not a chatbot widget (Sec. 4, 10)
- [x] Nova's sample voice/dialogue lines (Sec. 10)
- [x] Emotional palette per area (Sec. 11)
- [x] The Window "wow moment" + closing line (Sec. 12)

**Feature set**
- [x] Signature feature: live AI chat with Nova, diegetic placement (Sec. 4)
- [x] Confirmed extras: time-of-day lighting, ambient sound, easter eggs, sticky-note treasure hunt, persistent return-state, live MenuNova embed (Sec. 5)
- [x] Personal Artifacts layer + three confirmed objects (Sec. 13a)

**Spatial design**
- [x] Object placement per act, split by detail tier (Sec. 16)
- [x] Spatial cohesion requirement identified (Sec. 16a)
- [x] Final vertical-climb floorplan with camera path + Nova's symbolic presence (Sec. 18, diagram)
- [x] Forward-tease rule: every zone references one past + one future area (Sec. 18)
- [x] Governing principle locked: visitor should never feel teleported (Sec. 18)

---

### 🔲 Next Up — Sequenced Roadmap

The guiding principle: **stay in the cheap stage as long as possible.** A sentence in a brief costs nothing to change; a camera system after months of coding does not. Content and concept art should shape design — not the other way around, and technical planning should come last, once it's "we need this exact camera behavior for this exact room," not "let's use React Three Fiber" in the abstract.

**1. Nova's Desk — concept art (single corner, first)** ✅ **VALIDATED**
Chosen deliberately as the first and only corner to validate before going further, because it tests nearly everything at once: the stylized-premium-diorama style, Nova's character design, material language, lighting, palette, atmosphere, and emotional tone. Second pass (v2 prompt) successfully resolved the v1 drift toward "Workbench clutter" and fixed the background continuity cue — the city skyline glimpsed through the window now correctly teases the Window/Act V zone ahead, per the Section 18 forward-tease rule. Bonus validation: the tablet's chat UI in the render gave a first real glimpse of Nova's dialogue voice.
- [x] Produce Nova's Desk concept art — locked as the official style reference

**2. Full workshop floorplan — architectural, not artistic** ✅ **DONE — see Section 20**
- [x] Room dimensions & ceiling height
- [x] Window placement
- [x] Nova's desk footprint/dimensions
- [x] Walking distances between corners
- [x] Sightline specifics (what's visible from where, concretely)

---

**3. Remaining corner concept art**
Entrance, Workbench, Creations, Mindset, Window — only once Nova's Desk has proven the visual direction works.
- [x] Entrance — **VALIDATED** (v2, after fixing background bleed-through per the tease rule). Bonus: a notebook page literally labeled "Workshop floorplan" is a strong discovery-layer artifact candidate.
- [x] Workbench — **VALIDATED** on first pass. Both confirmed sticky-note artifacts present; failed prototype labeled "v0.3 RIP" is a great specific execution of the "abandoned idea" requirement; background tease acceptable as-is.
- [x] Creations — **VALIDATED** on first pass. Empty fourth slot exceeded the brief — labeled "Next Project" with a wireframe outline and a sticky note ("The next idea is already calling"), effectively pre-seeding the Window's closing line. Decision made: books stay here as supporting "lived-in" props; Mindset gets a deliberately different prop language (see Sec. 16 update).
- [x] Mindset — **VALIDATED** on first pass. Nails the "how I think, not what I built" distinction from Creations — pinned connected-sequence wall (Focus on Impact → Build for Humans → Ship Early → Learn Fast → Iterate) plus supporting mental-model diagrams, books reduced to minor texture as intended. Copy candidate surfaced: *"How I think. How I build. Why I keep going."*
- [x] Window / Leave a Note — **VALIDATED** on first pass. Successfully broke the tease rule on purpose — Nova and the Mindset pinboard are both legibly visible in the background, delivering the Sec. 12 wow moment in a single still. Note text matches exactly as scripted. Bonus: a physical box literally labeled "Leave a Note" with cards inside — a strong candidate as the actual contact-form object rather than a separate invented UI element. City skyline confirmed consistent with the one validated at Nova's Desk.

**All six corners validated. Step 3 of the roadmap is complete.**

**4. Copywriting + Nova's personality** — **IN PROGRESS, see `copywriting-and-nova-dialogue.md`**
The most underestimated stage — content shapes design, not the reverse.
- [x] Hero headline & subtext — **LOCKED:** *"Ideas become reality here. / How I think. How I build. Why I keep going."* No job title in the hero.
- [x] Mindset copy — compiled from the validated render (full pinned-sequence text + supporting notes)
- [x] Creations descriptions — compiled from the validated render (MenuNova, Nova AI, Smart Waste taglines)
- [x] Nova's full personality & dialogue tree — first full draft written (greeting, per-project reactions, failure/Workbench, the empty fourth slot, returning visitors, closing/Window)
- [x] Sticky-note treasure-hunt sequence — **v2 complete**, see `copywriting-and-nova-dialogue.md` Sec. 4. Twelve hidden notes across all six corners, each landing on a sincere-then-funny beat; also produced an improved closing line for the Window wow moment.
- **Tone correction to carry forward:** the workshop's core quality is *curiosity*, not ambition — keep this in mind for all remaining copy, Nova's voice, and any future art prompts, per the reasoning that ruled out the more "rebellious founder energy" tagline option

**5. Technical architecture** — **DONE, see `technical-architecture.md`**
- [x] Camera spline/easing behavior for this specific room
- [x] Asset pipeline & hosting approach
- [x] Live chat (Nova) backend integration approach
- [x] Mobile fallback plan
- [x] Performance budget (texture atlasing, LOD, lazy-loading)

**6. Development — IN PROGRESS**
- [x] `base/` handoff folder assembled with full reading-order README for Antigravity
- [x] **Prototype 0.1** — built and reviewed. **Verdict: 8/10.** Camera/spring/nav architecture validated (motion feels smooth, navigation maps correctly to the floorplan). **Failed:** spatial believability (read as floating boxes/a diagram, not a place) and pacing (felt uniform despite differentiated progress-range allocation).
- [x] **Prototype 0.2** — built and reviewed. Added colored landmark boxes per zone. **Succeeded:** geography/memorability — visitors can now recall where things are; Nova's placeholder sphere independently drew the eye before zone landmarks did, confirming the centrality decision (see Sec. 18 note). **Still failed:** containment — everything still reads as objects in a void rather than corners/sightlines/thresholds.
- [ ] **Prototype 0.3** — spec written (`prototype-0.3-spec.md`), not yet built. Adds greybox architecture ONLY (walls, floor, ceiling, openings between zones, window cutout) on top of the existing validated landmarks — uniform gray materials, no lighting/texture polish. Tests containment specifically, and validates the floorplan's actual room scale once it's bounded space rather than an open void.
- [ ] Prototype 0.4 — lighting volumes
- [ ] Prototype 0.5 — real props
- [ ] Prototype 0.6 — final art
- [ ] Real asset integration (six validated corners)
- [ ] Copy integration
- [ ] Nova chat implementation
- [ ] Mobile adaptation
- [ ] Performance pass

---

*This brief reflects a brainstorming/creative-direction conversation. No code or visual design has been produced yet — this is the reference document for the next phase of work.*