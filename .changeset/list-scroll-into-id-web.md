---
'@vyui/core': patch
---

Fix `List.scrollIntoId` throwing on Lynx web, and restore its bottom/middle
alignment everywhere.

The worklet reached for `lynx.querySelector('#id')` three times. That global
selector API exists only on the native main thread — web-core's MT `lynx`
object has no `querySelector` — so the first call raised a `TypeError` and took
the whole worklet with it, and the list scrolled nowhere.

Two of those lookups were for the `<list>` itself, which the component owns, so
they now go through a `main-thread-ref` instead. That works on both platforms:
web-elements' `<x-list>` implements `scrollToPosition` as a real DOM method,
which is what `__InvokeUIMethod` dispatches to. The third targets an arbitrary
consumer-owned child, where the global selector is the only route, so it is
feature-checked. When it is absent the scroll keeps its step-1 landing and
still honours `offset` — identical to what `alignTo: 'none'` already produces —
rather than aborting. Web's `boundingClientRect` ignores `relativeTo` anyway,
so there is nothing meaningful to measure against there.

Separately, the list's `layoutchange` worklet was bound as
`:main-thread:bindlayoutchange`. vue-lynx only recognises the `main-thread-`
prefix, so the colon form parsed as an ordinary prop and the handler never
attached — `listHeightMT` / `listWidthMT` sat at 0 on every platform, which
silently broke `alignTo: 'bottom'` and `alignTo: 'middle'`. Now bound with the
hyphen form, with a test that fails on any `main-thread:` binding in core.
