---
"@vyui/core": patch
"@vyui/kit": patch
---

Scope the alpha status notice in both package READMEs. The blanket "expect breaking changes on every release" was doing the libraries a disservice — the component surface has held steady across `@vyui/core` `0.2.x` and `@vyui/kit` `0.3.x`, and the breaking changes to date removed unused exports rather than reshaping APIs. The notice now says that, and points at the pre-alpha Vue-Lynx runtime underneath as the part that can still move.
