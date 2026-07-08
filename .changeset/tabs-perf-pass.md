---
"@vyui/core": patch
"@vyui/kit": patch
---

Performance pass around tab switching and theme resolution.

- `@vyui/core`: `Tabs` `unmountOnHide: false` now works — a panel mounts on first visit and stays mounted (hidden via `display: none` + `accessibility-elements-hidden`) after; previously the flag was threaded into context but never read, so panels always unmounted
- `@vyui/core`: new `Tabs` `deferContent` prop — commits the content swap one macrotask after the trigger/indicator update so the tab bar responds instantly while a heavy panel mounts
- `@vyui/kit`: theme `tv` factories are memoized per app config (`defineThemeBuilder`, also inside `useStyledComponent`) instead of rebuilt per component instance — visible on Lynx's interpreter whenever a screenful of components mounts
- `@vyui/kit`: `Tabs` forwards `deferContent`, resolves slot classes once per variant change instead of per trigger per render, and its triggers regain press feedback (`active:opacity-60` on the trigger itself — element opacity needs no CSS inheritance)
- `@vyui/kit`: the Tailwind preset safelist now emits the EXACT classes the packaged themes generate for the configured color set (collected by walking the tv configs) instead of every `utility × color × shade × variant` combination — ~90% less generated CSS (857 KB → 84 KB in kit-demo), and the dead `data-[…]`/`ring-*` entries are gone
