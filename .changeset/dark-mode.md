---
"@vyui/kit": patch
---

Dark mode via semantic design tokens.

- New role-based token layer (the nuxt/ui + shadcn convention, Lynx-adapted): text (`text-highlighted` / `text-default` / `text-toned` / `text-muted` / `text-dimmed` / `text-inverted`), background (`bg-default` / `bg-muted` / `bg-elevated` / `bg-accented` / `bg-inverted`) and border (`border-default` / `border-muted` / `border-accented` / `border-inverted`). Each is a single-hop `var(--ui-*)` → concrete `theme()` literal, so it resolves on Lynx and flips between modes on its own.
- Every theme migrated off raw `text-neutral-*` / `bg-neutral-*` / `border-neutral-*` onto these tokens, so a component flips in dark with zero `dark:` variants. Consumers get the same for their own chrome — write `text-muted`, not `text-neutral-500 dark:text-neutral-400`.
- A single `.dark` class on an app-root ancestor (`useColorMode()`) redefines the tokens to their dark values; the neutral RAMP stays fixed (raw `neutral-*` is a literal shade in both modes — least surprise), and only the accent mode tier shifts `-500` → `-400`.
- `useColorMode()` composable (`'light' | 'dark' | 'system'`, plus `isDark` / `setMode` / `toggle`) folds `'system'` to the OS appearance and follows it live on web. App-root contract: bind `:class="{ dark: colorMode.isDark }"` + `:key="colorMode.mode"` — the `:key` remount re-skins an already-mounted tree on Lynx native.
- Mode-tier tokens hold `theme()` literals (not `var(--ui-color-*)` refs), fixing a latent two-level `var()` collapse on device. `rounded` / `shadcn` style overlays (which redeclare `:root`) gain the full token set for light AND dark.
