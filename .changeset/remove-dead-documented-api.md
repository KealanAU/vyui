---
"@vyui/core": patch
"@vyui/kit": patch
---

Remove documented-but-dead API surface.

**Breaking:** `openAutoFocus` and `closeAutoFocus` are removed from `DialogContent` / `AlertDialogContent` (no focus model on Lynx, so they never fired). `escapeKeyDown` is removed from `DismissableLayerEmits` and `useDismissableLayer` (`onEscapeKeyDown` gone — drop the destructured handler if you use it). The `ScrollView` `debugLog` prop is removed (never read). Consumers relying on these get a compile error on upgrade, not a silent no-op.

`VyToggle`'s default slot now forwards `{ modelValue, state, pressed, disabled }` exactly like the core primitive so those documented slot props actually arrive.