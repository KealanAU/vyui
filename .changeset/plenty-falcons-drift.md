---
"@vyui/core": patch
---

Remove the `isBrowser` constant and the empty `@vyui/core/internal` subpath. `isBrowser` was a `typeof document` probe left over from a DOM-era port, unreferenced in a library that targets Lynx native. The `internal` entry exported nothing (`export {}`) and was held open for a Menu component that never landed, citing a plan file that no longer exists. Removes a published subpath.
