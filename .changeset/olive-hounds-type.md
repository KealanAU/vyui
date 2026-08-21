---
"@vyui/kit": patch
"@vyui/core": patch
---

Type the `class` and `ui` props on every styled `@vyui/kit` component as
`ClassValue` (re-exported from `useStyledComponent`) instead of `any`, so a
wrong class value is caught at the call site. `ui` slot keys were already
checked; their values now are too.

Read the Lynx `SystemInfo` / `lynx` globals through `globalThis` with their
`@lynx-js/types` declarations instead of casting to `any`. No runtime change —
the `globalThis.` access still guards hosts where the global is absent.
