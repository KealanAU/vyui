# Lynx Compat — Accessibility Plan

## The core problem

reka-ui was built for ARIA on the web. Lynx uses a native mobile accessibility model. The two don't map 1:1 and we need a deliberate strategy rather than ad-hoc fixes per component.

---

## Web ARIA vs Lynx accessibility props

| Web ARIA | Lynx prop | Notes |
|----------|-----------|-------|
| `aria-label` | `accessibility-label` | Direct mapping |
| `aria-checked` | `accessibility-value` | e.g. `"checked"` / `"unchecked"` |
| `aria-expanded` | `accessibility-value` | e.g. `"expanded"` / `"collapsed"` |
| `aria-selected` | `accessibility-value` | e.g. `"selected"` / `"unselected"` |
| `aria-valuemin/max/now` | `accessibility-value` | Compose as `"$now of $max"` |
| `aria-disabled` | `accessibility-state` (TBD) | No direct Lynx equivalent yet |
| `aria-hidden` | `accessibility-hidden` (TBD) | Check Lynx docs |
| `role="button"` | `accessibility-traits="button"` | See trait table below |
| `role="switch"` | `accessibility-traits="button"` + `accessibility-role-description="switch"` | Current pattern in SwitchRoot ✓ |
| `role="slider"` | `accessibility-traits="adjustable"` | Current pattern in SliderThumbImpl ✓ |
| `role="radio"` | `accessibility-traits="button"` | Needs `accessibility-value` for checked state |
| `role="checkbox"` | `accessibility-traits="button"` | Needs `accessibility-value` for checked state |
| `role="tab"` | `accessibility-traits="button"` | — |
| `role="separator"` | none | Decorative — skip |

### Lynx `accessibility-traits` values
`none` `button` `link` `image` `text` `adjustable` `search` `header` `summary` `selected` `disabled` `plays-sound` `starts-media-session` `allows-direct-interaction` `causes-page-turn`

---

## State communication problem

In web, `aria-checked="true"` tells the screen reader the state. In Lynx, `data-state="checked"` does nothing for screen readers — it's only used for CSS selectors.

**Plan:** each interactive component must set `accessibility-value` to communicate state.

```
aria-checked   → accessibility-value="checked" | "unchecked" | "mixed"
aria-expanded  → accessibility-value="expanded" | "collapsed"
aria-selected  → accessibility-value="selected" | "unselected"
aria-valuenow  → accessibility-value="${value}" (e.g. "50 of 100")
```

---

## Component prop API

**Problem today:** prop naming is inconsistent. `Radio.vue` declares `ariaLabel?: string`, `CheckboxRoot.vue` computes `ariaLabel` as a constant `undefined`, `SwitchRoot.vue` reads `$attrs['accessibility-label']` directly.

**Decision needed:**

### Option A — Expose `accessibilityLabel` prop (Lynx-native naming)
Consumer passes `accessibility-label="..."` as an attr. Each component reads `$attrs['accessibility-label']`.  
- Pro: no prop declaration overhead, attr pass-through already works  
- Con: camelCase/kebab-case inconsistency in Vue, not obvious API

### Option B — Expose `label` prop on each component
Consumer passes `:label="..."`. Component maps it to `accessibility-label`.  
- Pro: clean, framework-agnostic, easy to document  
- Con: adds a prop to every component

### Option C — Expose `ariaLabel` prop (current direction in Radio)
Consumer passes `:aria-label="..."`. Component maps to `accessibility-label`.  
- Pro: familiar for web developers migrating from reka-ui  
- Con: misleading — implies ARIA but Lynx doesn't use ARIA

**Recommendation:** Option A — let attrs pass through. Only declare props when the component needs to *compose* the label (e.g. Slider thumb computes `label` from index, but consumer can override via attr). Document that `accessibility-label` is the public API.

---

## Implementation plan

### Phase 1 — Fix crashes and broken state (now)
- [x] `ariaLabel` prop missing on `Radio.vue` → added
- [x] `ResizeObserver` guard in `useSize.ts`
- [x] `querySelectorAll` removed from `Collection.ts`
- [x] `handleAndDispatchCustomEvent` — direct call in Lynx env
- [x] `getActiveElement` — own implementation, returns null in Lynx

### Phase 2 — State announcements (next)
For each component, add `accessibility-value` that mirrors state:

| Component | Current | Needs |
|-----------|---------|-------|
| `Radio.vue` | nothing | `accessibility-value="checked" \| "unchecked"` |
| `CheckboxRoot.vue` | nothing | `accessibility-value="checked" \| "unchecked" \| "mixed"` |
| `SwitchRoot.vue` | nothing | `accessibility-value="on" \| "off"` |
| `SliderThumbImpl.vue` | `label` computed from index | `accessibility-value="${value} of ${max}"` |
| `Toggle.vue` | nothing | `accessibility-value="pressed" \| "not pressed"` |
| `CollapsibleTrigger.vue` | nothing | `accessibility-value="expanded" \| "collapsed"` |
| `TabsTrigger.vue` | nothing | `accessibility-value="selected" \| "unselected"` |

### Phase 3 — Clean up prop API (after Phase 2)
- Audit every component that has `ariaLabel` prop or reads `$attrs['accessibility-label']`
- Standardise: remove `ariaLabel` prop declarations, let attr pass-through handle it
- Add `label?: string` prop only where the component computes a default (Slider, Pagination)
- Document the public accessibility API in the contributing guide

### Phase 4 — Focus and navigation (future)
- `trapFocus` is a no-op in Lynx (no keyboard) — stub or remove
- `useTypeahead` relies on `getActiveElement` which returns null — disable in Lynx
- `RovingFocus` arrow-key logic silently does nothing — assess if Lynx swipe-to-navigate replaces it
- Assess `VisuallyHidden` — web pattern for off-screen accessible labels, not applicable in Lynx

---

## What NOT to do

- Don't set `aria-*` HTML attributes — Lynx ignores them and they add noise
- Don't rely on `data-state` for accessibility — it's CSS-only in Lynx
- Don't declare `ariaLabel` as a component prop — it implies web ARIA and conflicts with the attr pass-through pattern
- Don't stub `accessibility-label` with `computed(() => undefined)` — leave it out entirely if the component has no label logic
