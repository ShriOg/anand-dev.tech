# Anand Dev OS — Personal Portfolio

> A developer portfolio built with intentional design, zero frameworks, and meticulous attention to craft.

[![Live Site](https://img.shields.io/badge/Live-anand--dev.tech-blue?style=flat-square)](https://anand-dev.tech)
[![GitHub](https://img.shields.io/badge/GitHub-ShriOg-181717?style=flat-square&logo=github)](https://github.com/ShriOg)

---

## Overview

This is my personal portfolio and development OS — a living document of projects, experiments, and engineering stories. The site prioritizes performance, accessibility, and a cohesive dark theme with subtle glass effects.

**Key Features:**
- 🎨 Dark theme with glass morphism effects
- ⚡ Zero dependencies — vanilla HTML, CSS, JavaScript
- 📱 Fully responsive with dedicated mobile experience
- 🎯 Card focus system with keyboard navigation
- ✨ Interactive particle system with mouse interaction
- 🔍 SEO optimized and accessible

---

## Project Structure

```
anand-dev.tech/
├── index.html                    # Homepage (only HTML at root)
│
├── pages/                        # All secondary HTML pages
│   ├── projects.html             # Projects gallery with case studies
│   ├── lab.html                  # Interactive experiments
│   ├── dev-os.html               # Learning log & toolbelt
│   ├── hire.html                 # Contact & hire page
│   ├── contact.html              # Contact form
│   ├── grades.html               # Academic records
│   ├── hidden.html               # Password-protected content
│   ├── case-study.html           # Hand gesture case study
│   ├── ai-assistant.html         # AI Assistant project page
│   └── nowhang.html              # NowHang project page
│
├── assets/
│   ├── css/
│   │   ├── variables.css         # Design tokens & CSS custom properties
│   │   ├── base.css              # Reset, typography, utilities
│   │   ├── layout.css            # Container, nav, hero, footer, grids
│   │   ├── components.css        # Buttons, cards, forms, overlays
│   │   ├── animations.css        # Keyframes, reveals, reduced motion
│   │   └── responsive.css        # Tablet & mobile breakpoints
│   │
│   ├── js/
│   │   ├── main.js               # Core functionality (particles, cards, nav)
│   │   └── mobile.js             # Mobile-specific interactions
│   │
│   └── projects/                 # Project assets (images, demos)
│
├── projects/
│   ├── particle-system-gestures/ # Gesture-controlled particles demo
│   │   └── index.html            # Interactive 3D particle system
│   │
│   └── ai-assistant/             # AI Desktop Assistant source code
│       ├── main.py
│       ├── requirements.txt
│       ├── README.md
│       ├── actions/
│       ├── adapters/
│       ├── brain/
│       ├── interfaces/
│       ├── listener/
│       ├── speaker/
│       ├── ui/
│       └── utils/
│
├── private/                      # Private assets (not version controlled)
├── CNAME                         # Custom domain configuration
├── .gitignore                    # Git exclusions
└── README.md                     # This file
```

---

## CSS Architecture

The CSS is organized into **6 modular files** following a logical cascade:

| File | Purpose |
|------|---------|
| `variables.css` | Design tokens — colors, typography, spacing, shadows, z-index |
| `base.css` | Reset, typography, scrollbar, print styles |
| `layout.css` | Page structure — containers, nav, hero, footer, grids |
| `components.css` | UI elements — buttons, cards, focus system, forms |
| `animations.css` | Motion — keyframes, reveal effects, reduced motion support |
| `responsive.css` | Breakpoints — tablet (1024px), mobile (768px, 640px) |

**Import Order in HTML:**
```html
<link rel="stylesheet" href="assets/css/variables.css">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/animations.css">
<link rel="stylesheet" href="assets/css/responsive.css">
```

---

## JavaScript Architecture

**main.js** — Core functionality:
- `ParticleSystem` — Canvas-based particles with mouse interaction
- `CardFocusSystem` — Click-to-expand overlays with keyboard nav
- `LabParticleSystem` — Lab page variant with parameter controls
- `WaveSimulation` — Wave interference visualization
- Navigation scroll detection & toggle
- Scroll reveal animations
- Dev OS tabs
- Password gate system

**mobile.js** — Mobile-specific interactions:
- Auto-hiding top bar
- Bottom sheet navigation
- Fullscreen project modals with swipe-to-close
- Tap ripple effects
- Touch-optimized particle interactions
- Lazy loading images

---

## Design System

### Colors
```css
--bg-primary: #0a0a0b
--bg-secondary: #111113
--bg-tertiary: #18181b
--text-primary: #fafafa
--text-secondary: #a1a1aa
--accent-primary: #3b82f6
--accent-secondary: #60a5fa
```

### Typography
- **Sans-serif:** Inter (400, 500, 600, 700)
- **Monospace:** JetBrains Mono (400, 500)

### Spacing Scale
```css
--space-1: 0.25rem   --space-8: 2rem
--space-2: 0.5rem    --space-12: 3rem
--space-3: 0.75rem   --space-16: 4rem
--space-4: 1rem      --space-20: 5rem
--space-6: 1.5rem    --space-24: 6rem
```

---

## Key Components

### Card Focus System
Cards expand into detailed overlays with:
- URL hash support for direct linking
- Keyboard navigation (arrows, escape)
- Mobile swipe-to-close gestures
- ARIA accessibility attributes

### Particle System
Interactive canvas with:
- Mouse proximity effects
- Dynamic particle count based on viewport
- Connection lines between nearby particles
- Mobile touch support with reduced particle count

---

## Development

### Local Development
Simply open any HTML file in a browser. No build process required.

For live reload during development:
```bash
npx serve .
# or
python -m http.server 8000
```

### Adding New CSS
1. Identify the appropriate module (variables, base, layout, components, animations, responsive)
2. Add styles following existing patterns
3. Use CSS custom properties from `variables.css`

### Adding New JavaScript
1. Add to `main.js` for core functionality
2. Add to `mobile.js` for mobile-only features
3. Follow existing IIFE pattern to avoid global scope pollution

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 14+)
- Chrome for Android (latest)

---

## Performance Considerations

- No external dependencies (no React, no framework CSS)
- Font preloading with `preconnect`
- Lazy loading images on mobile
- Reduced motion support via `prefers-reduced-motion`
- Optimized particle counts for mobile devices

---

## Deployment

The site is deployed on **GitHub Pages** with a custom domain.

1. Push to `main` branch
2. GitHub Pages automatically deploys
3. CNAME file maintains custom domain configuration

---

## Files to Delete (After Verification)

After verifying the site works correctly with the new structure, you can safely delete:

```
styles.css      # Replaced by assets/css/*.css
mobile.css      # Replaced by assets/css/responsive.css (mobile styles)
script.js       # Replaced by assets/js/main.js
mobile.js       # Replaced by assets/js/mobile.js
```

---

## License

© 2025 Anand Shukla. All rights reserved.

Code samples in the projects folder may have their own licenses.

---

## Contact

- **Website:** [anand-dev.tech](https://anand-dev.tech)
- **Email:** shrishukla04@gmail.com
- **GitHub:** [@ShriOg](https://github.com/ShriOg)