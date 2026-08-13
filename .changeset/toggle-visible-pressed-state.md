---
"@vyui/kit": patch
---

Fix `VyToggle` having no visible on-state. The `ghost` default variant only carried `active:` classes, so its pressed surface vanished the moment the tap ended, and the pressed/unpressed `text-*` classes on the icon slot never reached the rasterized SVG. Every variant now paints a resting pressed surface, and the icon fill is baked per state (`iconFg`), matching `VyToggleGroup`. The default slot gains `iconColor` for custom SVG icons.
