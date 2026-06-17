---
"@vyui/kit": patch
---

IslandButton: bake the icon color so the theme's foreground actually applies.

- `IslandButton` rendered its glyph through Lynx's `<svg>`, which rasterizes the XML and can't inherit `currentColor` — so the `text-slate-*` utility on the `leadingIcon` slot (and the darker `text-slate-900` active shade) never reached the icon, leaving it stuck on its default fill (invisible on dark/active pills).
- It now resolves the foreground utility off the merged `leadingIcon` class — honoring the active state and any consumer `ui.leadingIcon` override — and passes it to `<VyIcon :color>`, matching the pattern already used by `Button`, `Input`, `Alert`, and `Combobox`. Non-palette colors (e.g. arbitrary `text-[#abc]`) fall back to the icon's `currentColor` default.
