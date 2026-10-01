---
title: "@vyui/core v1.0.1"
description: "Drop Tailwind classes that emit no CSS under @lynx-js/tailwind-preset — cursor-, select-none, divide-, overflow-y-auto, pointer-events-, outline-none, shadow…"
date: "2026-10-01"
package: core
version: "v1.0.1"
changelogOrder: 1000001
---

### Patch Changes

- Drop Tailwind classes that emit no CSS under `@lynx-js/tailwind-preset` — `cursor-*`, `select-none`, `divide-*`, `overflow-y-auto`, `pointer-events-*`, `outline-none`, `shadow-<color>/<alpha>`, `after:content-['*']`, `backdrop-blur-*`, `uppercase`, `scroll-py-*`, `-space-{x,y}-px`, `object-cover`, `touch-none`, `tabular-nums`, `break-words`, `text-wrap`. None of these plugins are enabled, so every one was already inert. ([`2ebd112`](https://github.com/KealanAU/vyui/commit/2ebd11236fe78908eabc5bee582b1246eacbc6af))
  
  Also removes the `text-*` classes on `VyIcon` slots (Lynx rasterizes the svg, so they never reached a glyph), four theme slots no template renders (`select.arrow`, `combobox.arrow`, `toast.avatarSize`, `dropdownMenu.itemLeadingAvatarSize`), same-property duplicate classes in the Toggle/ToggleGroup/Stepper themes, and the unused `vyui-slide-*` keyframes from `@vyui/core`'s `presence.css`.
  
  Rendering is unchanged — the removed declarations produced no CSS. Consumers passing `ui: { arrow }` / `ui: { avatarSize }` overrides will see those keys disappear from the slot types; they were no-ops.
- Unmount `CheckboxIndicator` immediately when unchecked — it never bound Presence's animation handlers, so the check glyph hung around until Presence's 24-frame watchdog fired (in practice, until the next interaction). ([`2ebd112`](https://github.com/KealanAU/vyui/commit/2ebd11236fe78908eabc5bee582b1246eacbc6af))
