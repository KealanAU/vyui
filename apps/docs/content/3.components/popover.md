---
title: Popover
description: Reveal contextual content in a mobile sheet or anchored floating panel.
navigation:
  icon: i-lucide-message-square-more
package: kit
links:
  - label: Kit source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Popover.vue
    target: _blank
  - label: Core primitives
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/tree/main/packages/core/src/components/Popover
    target: _blank
---

## Overview

`VyPopover` reveals contextual content from a trigger. It defaults to a touch-friendly bottom sheet with a backdrop, drag-to-dismiss behavior, and snap sizing. Opt into `presentation="anchor"` for a compact panel measured and positioned next to its trigger on wider surfaces.

Popover does not currently have a bundled docs-playground fixture. The examples below use the public kit API and can be copied into a Lynx application.

## Usage

The default presentation is a bottom sheet. Use controlled state when content needs to close itself.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyPopover } from '@vyui/kit/popover'

const open = ref(false)
</script>

<template>
  <VyPopover v-model:open="open">
    <VyButton>Show details</VyButton>

    <template #content="{ close }">
      <view class="flex flex-col gap-3 p-4">
        <text class="text-lg font-semibold">Release details</text>
        <text class="text-neutral-600">
          Version 1.4 is ready to deploy.
        </text>
        <VyButton @tap="close">
          Done
        </VyButton>
      </view>
    </template>
  </VyPopover>
</template>
```

The default slot is already wrapped in the appropriate trigger. Do not also open the popover from a tap handler on the slotted child.

### Sheet presentation

Configure the sheet height with viewport fractions. The core sheet sorts snap points from smallest to largest and initially uses index `0`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyPopover } from '@vyui/kit/popover'

const open = ref(false)
</script>

<template>
  <VyPopover
    v-model="open"
    :snap-points="[0.35, 0.75]"
    :handle="true"
  >
    <VyButton>Choose filters</VyButton>

    <template #content="{ close }">
      <view class="flex flex-col gap-4 p-5">
        <text class="text-lg font-semibold">Filters</text>
        <text>Sheet content can scroll when it exceeds the panel.</text>
        <VyButton @tap="close">
          Apply
        </VyButton>
      </view>
    </template>
  </VyPopover>
</template>
```

Set `dismissible="false"` to disable backdrop dismissal and drag-to-close. The content must then provide a controlled close action.

### Anchored presentation

Use anchored mode for tablet or wide-screen interfaces. `side`, `align`, and `sideOffset` control docking around the measured trigger.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyPopover } from '@vyui/kit/popover'

const open = ref(false)
</script>

<template>
  <VyPopover
    v-model:open="open"
    presentation="anchor"
    :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
  >
    <VyButton>Account</VyButton>

    <template #content="{ close }">
      <view class="flex flex-col gap-3 w-72 p-4">
        <text class="font-semibold">Signed in as Kealan</text>
        <text class="text-sm text-neutral-500">kealan@example.com</text>
        <VyButton @tap="close">
          Close
        </VyButton>
      </view>
    </template>
  </VyPopover>
</template>
```

Anchored content is still rendered inside a full-screen overlay wrapper. A tap outside dismisses it by default and does not pass through to the underlying app.

### Prevent outside dismissal

When anchored content is not dismissible, outside taps emit `close:prevent` and leave it open.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyPopover } from '@vyui/kit/popover'

const open = ref(false)
const blocked = ref(false)
</script>

<template>
  <VyPopover
    v-model:open="open"
    presentation="anchor"
    :dismissible="false"
    @close:prevent="blocked = true"
  >
    <VyButton>Critical form</VyButton>

    <template #content="{ close }">
      <view class="flex flex-col gap-3 w-80 p-4">
        <text>Save or cancel before leaving this panel.</text>
        <text v-if="blocked" class="text-warning-600">
          Outside dismissal is disabled.
        </text>
        <VyButton @tap="close">
          Cancel
        </VyButton>
      </view>
    </template>
  </VyPopover>
</template>
```

### Custom measured anchor

The `anchor` slot replaces the built-in anchored trigger. It is measured for placement but is not wrapped in `PopoverTrigger`, so open it explicitly and keep state controlled.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyPopover } from '@vyui/kit/popover'

const open = ref(false)
</script>

<template>
  <VyPopover
    v-model:open="open"
    presentation="anchor"
    :content="{ side: 'top', align: 'center', sideOffset: 12 }"
  >
    <template #anchor>
      <VyButton @tap="open = !open">
        Custom anchor
      </VyButton>
    </template>

    <template #content="{ close }">
      <view class="p-4">
        <text>Positioned from the custom anchor.</text>
        <VyButton @tap="close">
          Close
        </VyButton>
      </view>
    </template>
  </VyPopover>
</template>
```

## Features and behavior

- Bind `v-model:open` to `open`, or use the `v-model` alias backed by `modelValue`.
- When both are supplied, `open` takes precedence over `modelValue`.
- Every open-state change emits both `update:open` and `update:modelValue`.
- `defaultOpen` initializes the underlying primitive when state is uncontrolled.
- Sheet mode uses the core Sheet primitives, is always modal, and supports backdrop dismissal, drag-to-close, and snap fractions.
- Anchor mode measures the trigger with `useElementRect` when it opens and on trigger layout changes.
- Anchor mode supports `top`, `right`, `bottom`, or `left` sides; alignment can be `start`, `center`, or `end`.
- Calling the content slot's `close()` only emits open-state updates. Use controlled state so the parent feeds `false` back to the component.
- The `open` slot prop is derived from the controlled props. In uncontrolled usage it does not reflect the primitive's internal state.
- `content.alignOffset` is currently accepted but not applied.

## Content settings

The `content` prop is used only by `presentation="anchor"`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Side of the measured trigger used to dock content. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Cross-axis alignment relative to the trigger. |
| `sideOffset` | `number` | `8` | Distance in pixels between trigger and content. |
| `alignOffset` | `number` | `undefined` | Reserved compatibility setting; currently unused. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled state used by `v-model:open`; takes precedence over `modelValue`. |
| `modelValue` | `boolean` | `undefined` | Convenience controlled state used by `v-model`. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `presentation` | `'sheet' \| 'anchor'` | `'sheet'` | Mobile bottom sheet or trigger-relative floating panel. |
| `snapPoints` | `number[]` | `[0.6]` | Sheet height fractions forwarded to `SheetRoot`. |
| `handle` | `boolean` | `true` | Shows the drag handle in sheet mode. |
| `content` | `PopoverContentSettings` | `{ side: 'bottom', sideOffset: 8 }` | Anchor positioning settings. |
| `modal` | `boolean` | `false` | Selects the modal core variant in anchor mode; sheet mode is always modal. |
| `dismissible` | `boolean` | `true` | Enables outside dismissal and, in sheet mode, drag-to-close. |
| `class` | `any` | `undefined` | Classes applied to the built-in trigger in anchor mode. |
| `ui` | `Partial<Record<PopoverSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`class` is not currently applied to the sheet trigger or popover content. Use `ui.content` for the panel and style the default-slot child directly in sheet mode.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | Open-state update for `v-model:open`. |
| `update:modelValue` | `boolean` | Open-state update for `v-model`. |
| `close:prevent` | none | An outside tap was blocked because `dismissible` is `false` in anchor mode. |

Core `interactOutside` and `pointerDownOutside` events are not exposed by the kit wrapper.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ open: boolean }` | Trigger content. Wrapped in `SheetTrigger` or, without a custom anchor, `PopoverTrigger`. |
| `anchor` | `{ open: boolean }` | Custom measured anchor for anchor mode. It does not automatically toggle state. |
| `content` | `{ close: () => void }` | Panel content with an emit-based close helper. |

## Styling and theming

Override globally through `appConfig.ui.popover` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `content` | Shared panel surface, size constraints, scrolling, border, radius, and elevation. |
| `handle` | Sheet drag-handle pill. |

The default content surface is a white, vertically scrollable panel constrained to the viewport, with a neutral border, medium radius, and shared floating-surface shadow. Sheet mode additionally receives the core sheet's fixed bottom positioning and rounded top corners. Anchor mode receives alignment and padding as concrete inline styles calculated from the trigger rectangle.

## Accessibility

The built-in trigger is exposed as a native button and announces `collapsed` or `expanded`. The content is exposed as a dialog container in both presentation modes. Sheet presentation always requests exclusive accessibility focus; anchored presentation requests it only when `modal` is `true`, so by default the rest of the screen stays reachable. Both overlays keep their own children individually reachable.

Give icon-only trigger content an `accessibility-label`. Add a visible heading near the start of the content, and provide an explicit close action whenever outside or drag dismissal is disabled. A custom `anchor` slot is not automatically given button semantics; its interactive child must provide them.

Lynx currently has no DOM-style focus scope or programmatic focus restoration. The core uses native exclusive-focus semantics instead, driven by `modal`. The DOM scroll locking and background-sibling hiding that reka-ui applies have no Lynx equivalent.

## Platform notes

- Sheet mode uses native Lynx touch handling, snap physics, dynamic viewport units, and main-thread drag painting.
- Anchor mode measures the trigger at runtime and applies concrete edge padding to a full-screen overlay wrapper; it does not use Floating UI.
- If the trigger cannot be measured, anchored content remains hidden until a non-zero layout rectangle is available.
- Taps inside content stop propagation so they do not dismiss the overlay. Outside interaction is represented by a backdrop tap.
- Hardware Escape-key dismissal is not currently wired because Lynx does not expose the required key event path.
- `PopoverPortal` is a slot pass-through; actual native portalling is handled by the shared `OverlayRoot` registry.
- `PopoverAnchor` from `@vyui/core` is a compatibility pass-through and does not position content. The kit `anchor` slot instead measures its wrapper.

## Related components

- `DropdownMenu` for a structured anchored action menu.
- `Drawer` for larger persistent or multi-step content.
- The `@vyui/core` Popover primitives for preventable outside-interaction events and custom composition.
