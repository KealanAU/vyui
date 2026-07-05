---
title: "@vyui/kit v0.2.0"
description: "5109043: Add defineVyuiConfig (new @vyui/kit/config entry) so a project's theme is authored once and fed to both the Tailwind preset (build) and provideVyUI/…"
date: "2026-07-05"
package: kit
version: "v0.2.0"
changelogOrder: 2000
---

### Minor Changes

- 5109043: Add `defineVyuiConfig` (new `@vyui/kit/config` entry) so a project's theme is authored once and fed to both the Tailwind preset (build) and `provideVyUI`/`app.use(VyUI)` (runtime), removing the hand-synced `colors` duplication between the two planes.

  - `createVyuiPreset` now accepts a `defineVyuiConfig` result (`{ ui: { colors } }`) alongside the flat `{ colors, neutral, shades }` form
  - `createVyuiPreset` dev-warns when a semantic color can't be backed by a `--ui-color-*` var (no more silent "class resolves to nothing")
  - `@vyui/kit/config` is a light, jiti-safe entry — importing it in `tailwind.config.ts` never pulls component code into the build path
