---
"@vyui/core": patch
---

Remove `useLocale`, which had no callers. It read `ConfigProvider`'s `locale` context and no component ever consumed it, so nothing in the library resolved a locale through it. `ConfigProvider`'s `locale` prop and context entry stay — consumers can read them directly via `injectConfigProviderContext`.
