---
"@vyui/kit": patch
---

Fix the overlay dim: `modal`, `drawer`, `tray` and `actionSheet` all painted no scrim at all.

Their `overlay` slot used an alpha modifier on a semantic color (`bg-neutral-900/50`, `bg-neutral-900/40`). The Tailwind preset maps semantic colors to raw `var()` strings with no `<alpha-value>` placeholder, so Tailwind 3 skips generating those utilities entirely — the class resolved to no CSS and the element painted nothing. All four now use `bg-black/50`, which parses to rgb so the modifier applies.

Most visible in dark mode, where a `bg-default` panel over an undimmed `bg-default` page had nothing separating it.

Guarded by `theme/alpha-modifier.test.ts`, which fails if any theme file reintroduces an alpha modifier on a semantic color.
