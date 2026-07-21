---
"@vyui/cli": patch
---

Add a `liquid-glass` registry style — iOS-flavoured translucent surfaces, Apple system accent colors, hairline separators and a 14px radius. Install it with `npx @vyui/cli init --style liquid-glass` (or pick it from the `init` prompt).

Token-only overlay (`styles/liquid-glass/style.css`), so every component `.vue` + `theme/*.ts` is reused verbatim from the base style. Lynx has no `backdrop-filter`, so this is the translucency half of the material — surfaces let what's behind them through — not a blurred backdrop.
