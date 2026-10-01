---
"@vyui/kit": patch
---

Type `AppConfig.ui` by component name: each key (`button`, `card`, `switch`, …) is now a `Partial` of that component's theme instead of `unknown`, so overrides autocomplete and a mis-shaped one is a type error. Custom semantic color keys (`ui.tertiary`) stay accepted.
