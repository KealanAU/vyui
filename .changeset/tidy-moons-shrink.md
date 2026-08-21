---
"@vyui/kit": patch
"@vyui/core": patch
---

Drop the props that existed only for reka-ui / Nuxt UI parity and were
documented as never read: `ComboboxPortal`'s `to` / `forceMount` / `disabled`,
`DialogPortal`'s and `SelectPortal`'s `to`, `trapFocus` on the Dialog and
AlertDialog content impls, `VyPopover`'s `mode` / `openDelay` / `closeDelay` /
`arrow` / `portal` (plus the unrendered `arrow` theme slot), `presentation` on
`VySelect` and `VyCombobox`, `type` and `autofocus` on `VyButton`, `portal` on
`VyModal` and `VyDrawer`, and `VyDrawer`'s `direction` alias for `side`.

Passing any of them was already a no-op, so behavior is unchanged; they now
land in `$attrs` instead of being declared props. Use `side` in place of
`VyDrawer`'s `direction`.

Deduplicate three copies of shared logic: `normalizeRect` / `toNumber` now live
once in `useResizeObserver` (`useElementRect` imports them), the kit's default
`AppConfig` literal lives once in `useAppConfig` (`provideVyUI` imports it), and
the alert theme's `iconFg` routes through `iconFgFromToken` like the button,
tabs, toggle, and toggle-group themes.
