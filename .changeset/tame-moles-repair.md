---
"@vyui/kit": patch
---

Drop the non-functional `children` / `childrenIcon` surface from `VyDropdownMenu`. Nested items were never rendered — an item with `children` drew a trailing chevron that did nothing — so the prop, its icon, and the now-unreachable `itemTrailingIcon` theme slot are gone. Submenus need `DropdownMenuSub` from `@vyui/core` wired through the items renderer; that work is unstarted.

Type `useStyledComponent`'s `ui` as `ReturnType<ThemeTV<TTheme>>` instead of `any`, so slot keys are checked at the call site.

Add `w-full` to the drawer `footer` slot. A `flex-row` row inside the `flex-col` scaffold doesn't stretch on Lynx, so footers with a `flex-1` child collapsed to content width.
