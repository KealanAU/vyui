---
title: "@vyui/kit v0.3.3"
description: "Overlay cleanup ahead of the shared-core refactor."
date: "2026-07-19"
package: kit
version: "v0.3.3"
changelogOrder: 3003
---

### Patch Changes

- Overlay cleanup ahead of the shared-core refactor. ([#143](https://github.com/KealanAU/vyui/pull/143))

  **Breaking** (pre-1.0 patch by repo policy): removes the dead `velocityThreshold` prop from `SheetRoot` (documented as unused/reserved — release logic uses the coast projection) and the consumerless `useSheetBehavior()` reactive wrapper, `progressFor`, `pickSnap`/`PickSnapOpts` (never adopted by Sheet; `pickRelease` is the one release spec), and their types from `@vyui/core`. The pure spec helpers (`pickRelease`, `directionAxis`, `viewportSnapsToPositions`, …) remain.

  - kit `VyModal`: wire the declared-but-dead `dismissible` prop — backdrop taps are now blocked when `false` and emit `close:prevent` (mirrors `VyPopover`)
  - sheet enter/exit keyframes now take their duration from the `duration` prop (inline `animation-duration` longhand) instead of a hardcoded 280ms, fixing the enter/settle desync for consumers like `VyTray` that pass `duration: 300`

- Require `vue-lynx@^0.4.2` and drop the local worklet-loader patch: upstream #190 now follows aliased and package worklet imports, with `includeWorkletPackages` for `node_modules` consumers. NPM consumers must set `pluginVueLynx({ includeWorkletPackages: ['@vyui/core', '@vyui/kit'] })` — documented in the installation guide. ([#142](https://github.com/KealanAU/vyui/pull/142))

- Updated dependencies [[`53c027b`](https://github.com/KealanAU/vyui/commit/53c027bdb9c2577449bbb24a746154304a220a38), [`2e98112`](https://github.com/KealanAU/vyui/commit/2e9811241087f3c47f4e8bb88168b38e2dd91fbd), [`df383f5`](https://github.com/KealanAU/vyui/commit/df383f59ac47245abf88c7ca6388c5bbbc6156c9), [`758a231`](https://github.com/KealanAU/vyui/commit/758a2315e70248c750d4feb3132add6d1ff87bcc), [`251b586`](https://github.com/KealanAU/vyui/commit/251b586777b081a12db2e0d795b3237584f70d8d), [`21ec23a`](https://github.com/KealanAU/vyui/commit/21ec23ad5bcb0e61a921ab536abbfdbb4254325b)]:
  - @vyui/core@0.2.3
