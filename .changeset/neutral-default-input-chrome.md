---
"@vyui/kit": patch
---

Default input chrome to neutral: form controls no longer paint a primary border or icon by default.

- Resting border on `Input`, `Textarea`, `Select`, `Combobox`, `NumberField` and `PinInput` is now neutral (`border-neutral-200`) regardless of `color` — matching the no-focus-state reality on Lynx. The colored border stays available as opt-in via the `highlight` prop.
- Leading/trailing icons (and `NumberField` steppers) now default to neutral (dimmed) instead of the `color` palette; override per-icon with your own `:color` via the `leading` / `trailing` slots.
- `RadioGroup`: space the control from its label with `gap-2` on the item instead of `ms-2` on the wrapper — Lynx ignores logical inline margins, which collapsed the dot and text together.
