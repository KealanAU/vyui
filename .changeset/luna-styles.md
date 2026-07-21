---
"@vyui/cli": patch
"@vyui/kit": patch
---

Add the `lunaris` registry style, and fix four token-layer bugs the audit turned up.

- `lunaris` — the LUNA design system (from [lynx-ui](https://github.com/lynx-family/lynx-ui/tree/main/luna), Apache-2.0) ported to the token layer: pure-grey canvas/paper/content chrome, rose accent, and the five `.luna-gradient-*` classes. A token-only overlay, so every base `.vue` and `theme/*.ts` is reused unchanged. LUNA's neutral variant shares this chrome byte-for-byte and differs only in accent, so it is documented as a delta in the file header rather than shipped as a second style.
- Fix: `shadcn` and `rounded` held nested `var(--ui-color-*)` refs on the mode tier, which collapse on Lynx native (one level of `var()` only), so consumer-written `bg-primary` / `text-error` painted nothing on device.
- Fix: `shadcn`'s `primary` now follows `--base-color` like `neutral` does. It was pinned to `zinc` while surfaces tracked the chosen gray, producing combinations shadcn/ui can't express (zinc accent on stone surfaces).
- Fix: `resolveColorHex` now resolves shade-less colors (`black`, `white`). They are single strings in `tailwindcss/colors`, so indexing them by shade fell through to the slate-500 fallback — a monochrome accent painted black surfaces with slate-blue baked SVG icons on them.
- Fix: `init` warns when a chosen `--base-color` can't apply because the style ships its own palette, instead of silently ignoring it.
- Guards: registry tests now assert every shipped style declares the full 120-token surface, declares no nested `var()` value, and that `rounded` differs from the base in `--ui-radius` alone.

Install with `vyui init --style lunaris`.
