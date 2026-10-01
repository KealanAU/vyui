---
title: "@vyui/kit v0.4.1"
description: "Bake the Checkbox tick's fill white via the Icon color prop — text-white on the icon slot never reached the glyph (Lynx rasterizes the svg), so the check ren…"
date: "2026-10-01"
package: kit
version: "v0.4.1"
changelogOrder: 4001
---

### Patch Changes

- Bake the Checkbox tick's fill white via the Icon `color` prop — `text-white` on the icon slot never reached the glyph (Lynx rasterizes the svg), so the check rendered black on the colored fill. ([`2ebd112`](https://github.com/KealanAU/vyui/commit/2ebd11236fe78908eabc5bee582b1246eacbc6af))

- Drop Tailwind classes that emit no CSS under `@lynx-js/tailwind-preset` — `cursor-*`, `select-none`, `divide-*`, `overflow-y-auto`, `pointer-events-*`, `outline-none`, `shadow-<color>/<alpha>`, `after:content-['*']`, `backdrop-blur-*`, `uppercase`, `scroll-py-*`, `-space-{x,y}-px`, `object-cover`, `touch-none`, `tabular-nums`, `break-words`, `text-wrap`. None of these plugins are enabled, so every one was already inert. ([`2ebd112`](https://github.com/KealanAU/vyui/commit/2ebd11236fe78908eabc5bee582b1246eacbc6af))
  
  Also removes the `text-*` classes on `VyIcon` slots (Lynx rasterizes the svg, so they never reached a glyph), four theme slots no template renders (`select.arrow`, `combobox.arrow`, `toast.avatarSize`, `dropdownMenu.itemLeadingAvatarSize`), same-property duplicate classes in the Toggle/ToggleGroup/Stepper themes, and the unused `vyui-slide-*` keyframes from `@vyui/core`'s `presence.css`.
  
  Rendering is unchanged — the removed declarations produced no CSS. Consumers passing `ui: { arrow }` / `ui: { avatarSize }` overrides will see those keys disappear from the slot types; they were no-ops.
- Updated dependencies [[`2ebd112`](https://github.com/KealanAU/vyui/commit/2ebd11236fe78908eabc5bee582b1246eacbc6af), [`2ebd112`](https://github.com/KealanAU/vyui/commit/2ebd11236fe78908eabc5bee582b1246eacbc6af)]:
  - @vyui/core@1.0.1
