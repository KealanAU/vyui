---
"@vyui/core": minor
"@vyui/kit": minor
---

Per-component subpath entries for tree-shakeable consumption. `@vyui/kit` now exposes every component as its own entry point (`@vyui/kit/button`, `@vyui/kit/tray`, …) with the same canonical `Vy*` bindings as the barrel, so migrating is a specifier swap. Because the vue-lynx main-thread worklet pipeline prunes by `sideEffects` globs over whatever is *reached* (bare side-effect imports erase export usage), deep entries are the only way to ship less: importing `@vyui/kit/button` now reaches ~37 modules / 26 worklet registrations instead of the barrel's ~294 / 118.

To make this work end-to-end, kit's build rewrites its own `@vyui/core` barrel imports to per-file deep specifiers (`@vyui/core/dist/components/….vue.js`), and `@vyui/core` exposes a `./dist/*.js` wildcard export to resolve them. Barrel imports (`import { VyButton } from '@vyui/kit'`) keep working unchanged — they just keep the everything-ships behavior.

Also fixes `@vyui/kit`'s `sideEffects: false`, which let bundlers drop the package entirely from the vue-lynx main-thread worklet slice (entered via a bare side-effect import that uses no exports), so every transitively-imported `@vyui/core` worklet went unregistered and consumers crashed with `bind of undefined`. Kit now declares the same `sideEffects` globs as core.
