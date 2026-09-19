---
"@vyui/kit": patch
"@vyui/core": patch
---

Drop Tailwind classes that emit no CSS under `@lynx-js/tailwind-preset` — `cursor-*`, `select-none`, `divide-*`, `overflow-y-auto`, `pointer-events-*`, `outline-none`, `shadow-<color>/<alpha>`, `after:content-['*']`, `backdrop-blur-*`, `uppercase`, `scroll-py-*`, `-space-{x,y}-px`, `object-cover`, `touch-none`, `tabular-nums`, `break-words`, `text-wrap`. None of these plugins are enabled, so every one was already inert.

Also removes the `text-*` classes on `VyIcon` slots (Lynx rasterizes the svg, so they never reached a glyph), four theme slots no template renders (`select.arrow`, `combobox.arrow`, `toast.avatarSize`, `dropdownMenu.itemLeadingAvatarSize`), same-property duplicate classes in the Toggle/ToggleGroup/Stepper themes, and the unused `vyui-slide-*` keyframes from `@vyui/core`'s `presence.css`.

Rendering is unchanged — the removed declarations produced no CSS. Consumers passing `ui: { arrow }` / `ui: { avatarSize }` overrides will see those keys disappear from the slot types; they were no-ops.
