---
title: NumberField, Island DX & polish
description: A new NumberField primitive, a cleaner Island API with sensible floating defaults, and a round of native-Lynx fixes.
date: 2026-06-01
package: kit
version: v0.0.2
---

`@vyui/kit@0.0.2` adds a component, sharpens an existing one, and fixes a handful of native-Lynx rough edges.

**NumberField** — a new headless `@vyui/core` primitive (`NumberFieldRoot` / `NumberFieldInput` / `NumberFieldIncrement` / `NumberFieldDecrement`) with min/max/step, clamp/snap and decimal-precision handling, plus a styled `VyNumberField` in `@vyui/kit`.

**Island** gets a clearer API and better defaults. A new `layer` prop (`overlay` / `base` / `inline`) splits stacking from placement: `position` now only picks the viewport edge (`top` / `bottom`), while `layer` decides whether the island floats over content, sits on a low layer beneath modals and drawers, or drops into normal flow for a parent to place. Floating is applied via an inline `style`, so a lone `<VyIsland>` hovers with no wrapper on Lynx. Out of the box `Island` defaults to `overlay` and `IslandGroup` to `bottom`, so both float sensibly with zero config.

**Fixes & docs**

- `Input` now reflects programmatic value changes on native Lynx — controlled updates that don't come from typing are pushed through the imperative `setValue` path, so NumberField's increment/decrement work on iOS and Android, not just web.
- `Avatar` falls back to initials/icon when its image fails to load, wiring the Lynx `<image>` `binderror` event.
- `VyCombobox` is documented as the autocomplete pattern — `searchable` filtering covers the use case, so there's no separate Autocomplete component.
- The `@vyui/core` peer-dependency range widens from `^` to `~`, so kit tracks `0.0.x` core patches without forcing a major bump.
