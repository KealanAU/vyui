---
'@vyui/kit': patch
---

Add `VyApp`, the app-root shell: owns the `dark` class + `:key` remount from `useColorMode`, mounts `OverlayRoot` (opt-out via `:overlays="false"`), sets `--ui-radius` via the `radius` prop, and emits `viewport-change` with the root layout size.

Also export `resolveColorHex` (from the barrel and the `./provide` entry) so consumers can bake semantic colors into `VyIcon`'s `color` prop — Lynx rasterizes `<svg>`, so `text-*` classes never color an icon.
