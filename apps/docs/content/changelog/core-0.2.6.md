---
title: "@vyui/core v0.2.6"
description: "Animate Collapsible/Accordion height on open/close by tweening a measured px height (Tray recipe); kept-mounted content morphs both directions."
date: "2026-07-24"
package: core
version: "v0.2.6"
changelogOrder: 2006
---

### Patch Changes

- Animate Collapsible/Accordion height on open/close by tweening a measured px height (Tray recipe); kept-mounted content morphs both directions. ([#156](https://github.com/KealanAU/vyui/pull/156))

- Scale the Sheet settle/dismiss duration by release velocity so a hard flick settles quicker while a slow release keeps the current feel. ([#156](https://github.com/KealanAU/vyui/pull/156))

- Cache the TabsIndicator list rect and re-measure it only on layout/orientation/dir changes, so a tab switch costs one `boundingClientRect` round-trip instead of two. ([#156](https://github.com/KealanAU/vyui/pull/156))
