---
title: "@vyui/kit v0.3.4"
description: "KeyboardAware lift fixes: measure the margin against the LynxView viewport via selectRoot() instead of the screen (Explorer chrome no longer shortens the lif…"
date: "2026-07-20"
package: kit
version: "v0.3.4"
changelogOrder: 3004
---

### Patch Changes

- KeyboardAware lift fixes: measure the margin against the LynxView viewport via `selectRoot()` instead of the screen (Explorer chrome no longer shortens the lift), flip `offset` to its documented extra-clearance meaning (it was pushing fields INTO the keyboard), let a wrapping Trigger's registration win over the input's self-registration, and register kit VyInput/VyTextarea's styled field (via an internal as-child Trigger) so the field's bottom chrome clears too. Also adds a library-level `useSafeArea` / `provideSafeAreaInsets` (elk-style normalization of Sparkling/Explorer global props with OS gating); Sheet panels now pad their docked edges by the container's safe-area insets, and `VyApp` provides these insets app-wide with a `safeArea` prop to tune them (`false` opts the whole app out with zeros; a partial `{ top, bottom }` overrides specific edges). Input/Textarea (core and kit) gain `avoidKeyboard` / `avoidKeyboardSpacing` passthroughs to Lynx's native `avoid-keyboard` root-view shift — a zero-JS alternative for simple forms. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Select/Combobox selection tick now bakes its fill via the Icon `color` prop (accent ramp) instead of a class the rasterized svg can't receive — it rendered black and vanished in dark mode. Combobox's "No results" text also carries `text-muted` on the `<text>` itself so it flips with the theme. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Separator label now uses `text-highlighted` on the `<text>` itself, so its color flips with the theme (Lynx doesn't inherit the container's color into the text — the label rendered black in dark mode). ([#148](https://github.com/KealanAU/vyui/pull/148))

- Bump vue-lynx to 0.5.1 (widens peer range to `^0.4.2 || ^0.5.1`), with a local patch making the worklet-loader-mt registration scan comment-aware until upstream #287 ships ([#148](https://github.com/KealanAU/vyui/pull/148))

- Updated dependencies [[`73ed402`](https://github.com/KealanAU/vyui/commit/73ed40268cb4c0c17c89181fb0cd5f7470d87018), [`73ed402`](https://github.com/KealanAU/vyui/commit/73ed40268cb4c0c17c89181fb0cd5f7470d87018), [`73ed402`](https://github.com/KealanAU/vyui/commit/73ed40268cb4c0c17c89181fb0cd5f7470d87018), [`73ed402`](https://github.com/KealanAU/vyui/commit/73ed40268cb4c0c17c89181fb0cd5f7470d87018), [`73ed402`](https://github.com/KealanAU/vyui/commit/73ed40268cb4c0c17c89181fb0cd5f7470d87018)]:
  - @vyui/core@0.2.4
