---
title: KeyboardAware
description: Keep focused form controls visible above the native on-screen keyboard.
navigation:
  icon: i-lucide-keyboard
package: kit
---

## Overview

The keyboard-aware primitives coordinate focused inputs with a movable or scrollable container. `@vyui/kit` re-exports the three `@vyui/core` primitives as `VyKeyboardAwareRoot`, `VyKeyboardAwareResponder`, and `VyKeyboardAwareTrigger`.

Use them for drawers, forms, chat composers, and other layouts where the iOS or Android keyboard can cover the focused control. [`Tray`](/components/tray) and [`Drawer`](/components/drawer) wire them up for you through their `keyboard-aware` prop.

Inputs register themselves: any `VyInput` or `VyTextarea` rendered under a root reports focus, blur, and keyboard height automatically. A `VyKeyboardAwareTrigger` wrap is only needed to group several inputs into one measured region or to add an `offset`.

::component-code
---
name: keyboard-aware-example
height: 160px
---
::

## Usage

```vue
<script setup lang="ts">
import {
  VyInput,
  VyKeyboardAwareResponder,
  VyKeyboardAwareRoot,
} from '@vyui/kit'
</script>

<template>
  <VyKeyboardAwareRoot>
    <VyKeyboardAwareResponder>
      <VyInput placeholder="Message" />
    </VyKeyboardAwareResponder>
  </VyKeyboardAwareRoot>
</template>
```

For a long form, use the responder's scroll-view mode. The scroll region only scrolls once its height is bounded — pass the cap through `scroll-view-class`:

```vue
<VyKeyboardAwareRoot>
  <VyKeyboardAwareResponder
    mode="scroll-view"
    scrollview-id="profile-form"
    scroll-view-class="max-h-96"
  >
    <VyInput
      v-for="field in fields"
      :key="field.name"
      v-model="field.value"
      :placeholder="field.label"
    />
  </VyKeyboardAwareResponder>
</VyKeyboardAwareRoot>
```

Wrap a region in `VyKeyboardAwareTrigger` when several inputs should be measured as one block (a composer bar with attachments, say) or when the region needs extra clearance:

```vue
<VyKeyboardAwareTrigger :offset="16">
  <VyInput placeholder="Message" />
  <VyButton label="Send" />
</VyKeyboardAwareTrigger>
```

## Composition

- `VyKeyboardAwareRoot` tracks the focused input (or trigger) and the keyboard height, and drives the responder.
- `VyKeyboardAwareResponder` owns the surface that moves (`view` mode) or scrolls (`scroll-view` mode).
- `VyKeyboardAwareTrigger` optionally groups a focusable region and reports focus, blur, and layout changes for the block as a whole; bare inputs report for themselves.

The primitives render as normal wrappers when used outside a root, but no keyboard avoidance occurs.

## Props

### `VyKeyboardAwareRoot`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `forceAttach` | `boolean` | `false` | Keeps translating the responder toward the keyboard even when the trigger is already visible. |
| `offset` | `number` | `0` | Extra clearance in px between a self-registered input and the keyboard top. Regions wrapped in a trigger use the trigger's own `offset` instead. |
| `androidStatusBarPlusBottomBarHeight` | `number` | `0` | Corrects Android measurements for system bars, in pixels. |
| `as` | `AsTag` | `'view'` | Underlying Lynx element. |
| `asChild` | `boolean` | `false` | Merges behavior into the single child element. |

### `VyKeyboardAwareResponder`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'view' \| 'scroll-view'` | `'view'` | Translates a static view or scrolls a native scroll view. |
| `scrollviewId` | `string` | `'scrollview'` | Native scroll-view identifier used by the root. Make it unique when several scroll-mode responders can be on screen. |
| `scrollViewClass` | `any` | — | Class applied to the inner `<scroll-view>` in scroll-view mode. Put the height cap here — the region only scrolls once bounded. |
| `as` | `AsTag` | `'view'` | Underlying element in view mode. |
| `asChild` | `boolean` | `false` | Merges behavior into the single child element in view mode. |

### `VyKeyboardAwareTrigger`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `offset` | `number` | `0` | Extra space between the focused region and keyboard, in pixels. |
| `as` | `AsTag` | `'view'` | Underlying Lynx element. |
| `asChild` | `boolean` | `false` | Merges behavior into the single child element. |

## Emits

### `VyKeyboardAwareRoot`

| Event | Payload | Description |
| --- | --- | --- |
| `keyboardHeightChange` | `number` | Fires whenever the tracked keyboard height changes, in px (`0` = hidden). Lets wrappers react without their own listener — `VyTray` uses it to drive its panel rise. |

## Slots

All three primitives expose a single default slot. Place one responder inside the root; inputs anywhere under the root register themselves, and triggers are only needed for grouped regions or offsets.

## Accessibility

- Keep visible labels associated with each input; keyboard avoidance does not provide labeling.
- Preserve a predictable focus order when a responder contains multiple triggers.
- Avoid large offsets that move surrounding context entirely off-screen.
- Test hardware-keyboard and screen-reader navigation separately because no on-screen keyboard may appear.

## Platform notes

- The keyboard signal is the focused input's per-element `keyboard` event, normalized by `VyInput` / `VyTextarea` and piped up to the root automatically. The global Lynx `keyboardstatuschanged` event is kept as a fallback but is not delivered to the vue-lynx background runtime, so an input (or a component built on one) must be focused inside the root for avoidance to engage.
- Android layouts may need `androidStatusBarPlusBottomBarHeight` when native bounds omit system bars.
- On the web, there is no equivalent native keyboard event. The wrappers remain in place and the responder does not translate.

## Related components

- [Input](/components/input)
- [Textarea](/components/textarea)
- [Tray](/components/tray)
- [Drawer](/components/drawer)
- [Form](/components/form)
