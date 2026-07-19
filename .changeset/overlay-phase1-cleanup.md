---
"@vyui/core": patch
"@vyui/kit": patch
---

Overlay cleanup ahead of the shared-core refactor.

**Breaking** (pre-1.0 patch by repo policy): removes the dead `velocityThreshold` prop from `SheetRoot` (documented as unused/reserved — release logic uses the coast projection) and the consumerless `useSheetBehavior()` reactive wrapper, `progressFor`, and their types from `@vyui/core`. The pure spec helpers (`pickRelease`, `directionAxis`, `viewportSnapsToPositions`, …) remain.

- kit `VyModal`: wire the declared-but-dead `dismissible` prop — backdrop taps are now blocked when `false` and emit `close:prevent` (mirrors `VyPopover`)
- sheet enter/exit keyframes now take their duration from the `duration` prop (inline `animation-duration` longhand) instead of a hardcoded 280ms, fixing the enter/settle desync for consumers like `VyTray` that pass `duration: 300`
