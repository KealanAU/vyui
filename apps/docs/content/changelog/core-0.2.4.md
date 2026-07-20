---
title: "@vyui/core v0.2.4"
description: "KeyboardAware lift fixes: measure the margin against the LynxView viewport via selectRoot() instead of the screen (Explorer chrome no longer shortens the lif…"
date: "2026-07-20"
package: core
version: "v0.2.4"
changelogOrder: 2004
---

### Patch Changes

- KeyboardAware lift fixes: measure the margin against the LynxView viewport via `selectRoot()` instead of the screen (Explorer chrome no longer shortens the lift), flip `offset` to its documented extra-clearance meaning (it was pushing fields INTO the keyboard), let a wrapping Trigger's registration win over the input's self-registration, and register kit VyInput/VyTextarea's styled field (via an internal as-child Trigger) so the field's bottom chrome clears too. Also adds a library-level `useSafeArea` / `provideSafeAreaInsets` (elk-style normalization of Sparkling/Explorer global props with OS gating); Sheet panels now pad their docked edges by the container's safe-area insets, and `VyApp` provides these insets app-wide with a `safeArea` prop to tune them (`false` opts the whole app out with zeros; a partial `{ top, bottom }` overrides specific edges). Input/Textarea (core and kit) gain `avoidKeyboard` / `avoidKeyboardSpacing` passthroughs to Lynx's native `avoid-keyboard` root-view shift — a zero-JS alternative for simple forms. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Sheet handle now uses the mode-aware `bg-accented` token instead of a hardcoded translucent black, so the drag pill stays visible in dark mode. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Tabs indicator no longer animates growing in from zero width on mount / CSS reload — the transition now arms one tick after the first measurement, so only genuine tab switches slide. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Toast viewport now pads its docked edge by the container safe-area insets (via `useSafeArea`), so bottom toasts clear the iPhone home indicator and top toasts clear the notch — the same insets the Sheet panels already honor. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Bump vue-lynx to 0.5.1 (widens peer range to `^0.4.2 || ^0.5.1`), with a local patch making the worklet-loader-mt registration scan comment-aware until upstream #287 ships ([#148](https://github.com/KealanAU/vyui/pull/148))
