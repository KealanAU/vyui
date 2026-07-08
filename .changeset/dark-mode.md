---
"@vyui/kit": patch
---

Dark mode.

- `.dark` ramp in `style.css` inverts the neutral scale (`-50` ⇄ `-950`) and shifts the mode tier `-500` → `-400`, so ramp-based surfaces, text and borders flip together.
- New semantic **surface tier** — `bg-default` / `bg-muted` / `bg-elevated` (mapped to `--ui-bg*` tokens) — replaces literal `bg-white` across field, card and overlay themes (input, textarea, select, combobox, card, modal, drawer, tray, popover, dropdown, toast, checkbox, radio, number-field, pin-input, toggle-group, alert, sortable, swipe-action). These invert in dark with designed elevation values (page `slate-950` → surfaces `slate-900` → overlays `slate-800`) rather than a mechanical flip. Knob/thumb whites and solid-fill `text-white` stay literal.
- **Inverted surface tier** — `bg-inverted` / `text-inverted` (high-contrast: dark-on-light in light, light-on-dark in dark) for neutral `solid` fills (button, card `solid`) that a plain ramp invert would render as white-on-light.
- `useColorMode()` composable (`'light' | 'dark' | 'system'`, plus `isDark` / `setMode` / `toggle`) folds `'system'` to the OS appearance and follows it live on web. App-root contract: bind `:class="{ dark: colorMode.isDark }"` + `:key="colorMode.mode"` — the `:key` remount is what re-skins an already-mounted tree on Lynx native.
- Mode-tier tokens now hold `theme()` literals instead of `var(--ui-color-*)` refs, fixing a latent two-level `var()` collapse on device. `VyLabel` text moved off hardcoded `text-gray-900` onto the neutral ramp so it flips.
- `rounded` / `shadcn` style overlays gain the light surface tokens (they redeclare `:root`, so without them the migrated surfaces would render transparent).
