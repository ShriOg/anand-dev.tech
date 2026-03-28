---
name: abhilasha-maintenance
description: "Use when: scanning, reviewing, or fixing src/app/abhilasha, src/components/abhilasha, and src/data/abhilasha issues (runtime errors, data mismatches, UI flow regressions)."
---

# Abhilasha Maintenance Skill

## Scope
- src/app/abhilasha
- src/components/abhilasha
- src/data/abhilasha

## Workflow
1. Inventory files in the three scope folders.
2. Read route entry files first:
   - src/app/abhilasha/layout.jsx
   - src/app/abhilasha/page.jsx
   - src/app/abhilasha/style.css
3. Read content model:
   - src/data/abhilasha/content.json
4. Scan all component screens for:
   - missing React hook imports
   - hardcoded content that should be data-driven
   - unused props and dead API surface
   - debug logs and temporary diagnostics
   - data key mismatches between JSON and UI
5. Prioritize issues:
   - High: runtime crashes and broken navigation paths
   - Medium: incorrect displayed content and user flow defects
   - Low: cleanup and maintainability risks
6. Implement the smallest safe patch set.
7. Validate with diagnostics on the scoped folders.

## Output Format
- Findings list ordered by severity.
- Each finding must include file path and exact line link.
- If changes are applied, include a short changed-files summary and residual risks.

## Guardrails
- Preserve visual language and existing style patterns.
- Do not introduce frameworks or build tools.
- Keep changes scoped; avoid unrelated refactors.
- Prefer data-driven rendering over hardcoded UI strings.
