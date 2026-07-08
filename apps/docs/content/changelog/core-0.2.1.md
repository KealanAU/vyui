---
title: "@vyui/core v0.2.1"
description: "4ee6a7d: Make KeyboardAware work under vue-lynx: the root now receives keyboard height from the input's per-element @keyboard event (the global keyboardstatu…"
date: "2026-07-08"
package: core
version: "v0.2.1"
changelogOrder: 2001
---

### Patch Changes

- 4ee6a7d: Make KeyboardAware work under vue-lynx: the root now receives keyboard height from the input's per-element `@keyboard` event (the global `keyboardstatuschanged` event never reaches the vue-lynx background runtime), inputs self-register with a surrounding `KeyboardAwareRoot` without needing a `KeyboardAwareTrigger` wrap, and `VyTray`'s `keyboardAware` now also covers the body (new `'lift' | 'scroll'` modes plus `bodyScroll` ui slot) instead of silently doing nothing without a footer slot.
- d4f9b1a: Update public package and documentation copy to describe Vy UI as Lynx-native UI primitives for Vue.
- 1637c40: Sortable rows no longer drag list chrome along with the finger. The kit theme now renders each row as a transparent shell (the element core transforms) around a new `itemContent` pill slot, so only the pill visibly moves — the old `border-b` divider look is gone. `SortableItem` flips a `ui-dragging` class (+ `data-state="dragging"`) on the lifted row, and `VYUI_UI_STATES` gains `dragging` so themes can restyle the lifted pill (default: stronger pill border via `group-ui-dragging:`).
