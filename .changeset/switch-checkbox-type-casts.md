---
"@vyui/core": patch
---

Type the `trueValue`/`falseValue` defaults on `SwitchRoot` and `CheckboxRoot` as `T` instead of casting them to `undefined`, and drop the `as any` casts into `useStandardVModel`. No runtime change.
