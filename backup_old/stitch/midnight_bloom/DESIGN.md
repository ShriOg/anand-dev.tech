# Design System Document: An Emotional North Star

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Midnight Sanctuary."** 

This is not a utility-first interface; it is an emotional vessel. We are moving away from the cold, rigid efficiency of standard SaaS products to create a space that feels deeply personal, intimate, and safe. The goal is to simulate the feeling of a late-night conversation—warm, hushed, and meaningful.

To break the "template" look, we employ **Intentional Asymmetry**. Avoid perfectly centered grids. Instead, allow elements to "float" with varying weights, using overlapping glass layers and soft light leaks to create depth. The interface should feel like it is breathing, not static.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in the transition from deep midnight to the softest dawn. It is designed to be easy on the eyes during late-night usage while maintaining a high-end, editorial feel.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning or containment. 
Boundaries must be defined through background color shifts. For example, a `surface-container-low` component should sit on a `surface` background to create a "felt" edge rather than a "seen" one. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of frosted glass.
- **Base Layer:** `surface` (#0f131e) or `surface-container-lowest` (#0a0e19).
- **Secondary Layer:** Use `surface-container-low` (#171b27) to define large content areas.
- **Topmost Layer (Interactive):** Use `surface-bright` (#353945) with semi-transparency for floating cards.

### The Glass & Gradient Rule
To achieve the signature "Midnight Sanctuary" look, use **Glassmorphism**:
- Use `surface-variant` at 40-60% opacity with a `backdrop-blur` of 20px-40px.
- **Signature Gradients:** Apply a subtle linear gradient (45deg) from `primary-container` (#ff8fa3) to `secondary` (#c9bfff) for primary CTAs or as a soft glow behind hero elements. This provides a visual "soul" that flat hex codes cannot replicate.

---

## 3. Typography: Editorial Intimacy
The typography is a dialogue between the timeless elegance of a serif and the modern clarity of a sans-serif.

*   **Display & Headlines (`notoSerif`):** These are our "emotional anchors." Use `display-lg` (3.5rem) with wide tracking (-0.02em) to create an authoritative yet romantic tone. Headings should feel like titles in a poetry book.
*   **Body & Labels (`manrope`):** This is our "functional whisper." Use `body-lg` (1rem) for readability. The sans-serif keeps the interface from feeling antiquated, providing a clean, modern contrast to the serif headers.
*   **Hierarchy as Identity:** Use large scale differences (e.g., a `display-sm` header next to a `label-md` date) to create a high-fashion, editorial layout that eschews the "standard" blog look.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines. We use light and shadow to imply existence.

*   **The Layering Principle:** Stack your tiers. A `surface-container-highest` (#313441) card placed on a `surface-container-low` (#171b27) section creates a soft, natural lift.
*   **Ambient Shadows:** For floating elements, use extra-diffused shadows. 
    *   *Shadow Specs:* `0px 20px 40px rgba(11, 15, 26, 0.4)`. The shadow color is a dark tint of the background, not pure black, to mimic natural light absorption.
*   **The Ghost Border:** If a boundary is strictly required for accessibility, use `outline-variant` (#544244) at **15% opacity**. It should be felt more than seen.
*   **Atmospheric Textures:** Apply a 2% noise/grain filter or a soft "light leak" using a blurred radial gradient of `tertiary` (#e6bcff) at the screen corners to break the digital flatness.

---

## 5. Components: Softness and Intention

### Buttons
*   **Primary:** A soft gradient of `primary` to `primary-container`. Use `Roundedness-xl` (3rem) for a pill shape. Add a soft pulse animation (scale 1.02) on hover.
*   **Secondary:** Glassmorphic (`surface-variant` at 30% opacity) with a `Ghost Border`.
*   **Tertiary:** Pure text using `primary` color with a gentle underline that fades in on hover.

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Implementation:** Use vertical whitespace (Spacing Scale `8` or `10`) to separate items. For lists, use a slightly different background hue (`surface-container-low`) for every second item to create a "zebra" effect without lines.
*   **Corners:** All cards must use `md` (1.5rem) or `lg` (2rem) roundedness to maintain the "Soft/Warm" vibe.

### Input Fields
*   **State:** The default state is a `surface-container-highest` background with no border. 
*   **Focus:** On focus, the background stays dark, but a "Gentle Glow" (outer glow) of `primary` (#ffbac3) at 20% opacity appears.

### Signature Component: The "Memory Chip"
A special variant of a chip used for tags or moods. 
*   **Style:** `tertiary-container` (#cd9eec) text on a blurred glass background. It should float slightly above the surface with a `Soft Floating Motion` animation.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. If a text block is on the left, let the right side breathe.
*   **Do** use slow, intentional transitions. A `fade-in` should feel like a breath (600ms), not a snap.
*   **Do** prioritize the "Late-night" vibe by keeping overall luminance low, using `primary` and `secondary` only for focal points.

### Don't:
*   **Don't** use 100% opaque, high-contrast borders. It kills the "Midnight" atmosphere.
*   **Don't** use sharp corners. Nothing in this system should feel "pointed" or "aggressive."
*   **Don't** use standard "drop shadows" with 0 blur. Shadows must be expansive and atmospheric.
*   **Don't** crowd the interface. If you are in doubt, add more whitespace from the Spacing Scale.

---

## 7. Motion & Soul
*   **Floating Motion:** Important glass cards should have a very subtle Y-axis float (±4px) over a 4-second loop.
*   **Interaction:** When a user clicks a button, use a "Soft Pulse Glow" that radiates outward from the point of contact using the `surface-tint` color.
*   **Entrance:** Stagger the entrance of elements using a `400-700ms` ease-out-expo curve to create a sense of graceful unfolding.