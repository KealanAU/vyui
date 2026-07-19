---
"@vyui/core": patch
"@vyui/kit": patch
---

KeyboardAware lift fixes: measure the margin against the LynxView viewport via `selectRoot()` instead of the screen (Explorer chrome no longer shortens the lift), flip `offset` to its documented extra-clearance meaning (it was pushing fields INTO the keyboard), let a wrapping Trigger's registration win over the input's self-registration, and register kit VyInput/VyTextarea's styled field (via an internal as-child Trigger) so the field's bottom chrome clears too. Also adds a library-level `useSafeArea` / `provideSafeAreaInsets` (elk-style normalization of Sparkling/Explorer global props with OS gating); Sheet panels now pad their docked edges by the container's safe-area insets.
