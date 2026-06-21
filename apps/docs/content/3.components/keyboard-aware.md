---
title: KeyboardAware
description: Keep focused form controls visible above the native on-screen keyboard.
navigation:
  icon: i-lucide-keyboard
package: kit
---

## Overview

The keyboard-aware primitives coordinate focused inputs with a movable or scrollable container. `@vyui/kit` re-exports the three `@vyui/core` primitives as `VyKeyboardAwareRoot`, `VyKeyboardAwareResponder`, and `VyKeyboardAwareTrigger`.

Use them for drawers, forms, chat composers, and other layouts where the iOS or Android keyboard can cover the focused control.

::component-playground{name="keyboard-aware"}
::

## Usage

```vue
<script setup lang="ts">
import {
  VyInput,
  VyKeyboardAwareResponder,
  VyKeyboardAwareRoot,
  VyKeyboardAwareTrigger,
} from '@vyui/kit'
</script>

<template>
  <VyKeyboardAwareRoot>
    <VyKeyboardAwareResponder>
      <VyKeyboardAwareTrigger :offset="16">
        <VyInput placeholder="Message" />
      </VyKeyboardAwareTrigger>
    </VyKeyboardAwareResponder>
  </VyKeyboardAwareRoot>
</template>
```

For a long form, use the responder's scroll-view mode:

```vue
<VyKeyboardAwareRoot>
  <VyKeyboardAwareResponder mode="scroll-view" scrollview-id="profile-form">
    <VyKeyboardAwareTrigger v-for="field in fields" :key="field.name" :offset="12">
      <VyInput v-model="field.value" :placeholder="field.label" />
    </VyKeyboardAwareTrigger>
  </VyKeyboardAwareResponder>
</VyKeyboardAwareRoot>
```

## Composition

- `VyKeyboardAwareRoot` listens for native keyboard status changes and tracks the focused trigger.
- `VyKeyboardAwareResponder` owns the surface that moves or scrolls.
- `VyKeyboardAwareTrigger` wraps each focusable region and reports focus, blur, and layout changes.

The primitives render as normal wrappers when used outside a root, but no keyboard avoidance occurs.

## Props

### `VyKeyboardAwareRoot`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `forceAttach` | `boolean` | `false` | Keeps translating the responder toward the keyboard even when the trigger is already visible. |
| `androidStatusBarPlusBottomBarHeight` | `number` | `0` | Corrects Android measurements for system bars, in pixels. |
| `as` | `AsTag` | `'view'` | Underlying Lynx element. |
| `asChild` | `boolean` | `false` | Merges behavior into the single child element. |

### `VyKeyboardAwareResponder`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'view' \| 'scroll-view'` | `'view'` | Translates a static view or scrolls a native scroll view. |
| `scrollviewId` | `string` | `'scrollview'` | Native scroll-view identifier used by the root. |
| `as` | `AsTag` | `'view'` | Underlying element in view mode. |
| `asChild` | `boolean` | `false` | Merges behavior into the single child element in view mode. |

### `VyKeyboardAwareTrigger`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `offset` | `number` | `0` | Extra space between the focused region and keyboard, in pixels. |
| `as` | `AsTag` | `'view'` | Underlying Lynx element. |
| `asChild` | `boolean` | `false` | Merges behavior into the single child element. |

## Slots

All three primitives expose a single default slot. Place one responder inside the root, then wrap each input or focusable group in a trigger.

## Accessibility

- Keep visible labels associated with each input; keyboard avoidance does not provide labeling.
- Preserve a predictable focus order when a responder contains multiple triggers.
- Avoid large offsets that move surrounding context entirely off-screen.
- Test hardware-keyboard and screen-reader navigation separately because no on-screen keyboard may appear.

## Platform notes

- On iOS and Android, the root responds to Lynx `keyboardstatuschanged` events.
- Android layouts may need `androidStatusBarPlusBottomBarHeight` when native bounds omit system bars.
- On the web, there is no equivalent native keyboard event. The wrappers remain in place and the responder does not translate.

## Related components

- [Input](/components/input)
- [Textarea](/components/textarea)
- [Drawer](/components/drawer)
- [Form](/components/form)
