---
title: Sortable
description: Reorder a vertical list with a native long-press drag gesture.
navigation:
  icon: i-lucide-list-restart
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Sortable.vue
    target: _blank
---

## Overview

`VySortable` renders a styled, vertically reorderable list on top of the `@vyui/core` Sortable primitives. A long press lifts a row, movement shifts neighboring rows on the main thread, and release writes the new array order through `v-model`.

::component-code
---
name: sortable-example
height: 280px
---
::

::callout{icon="i-lucide-pointer" color="warning"}
Drag-to-reorder isn't wired up in the web preview yet, so the items won't move here — view this on a device or in Lynx Explorer for the real interaction. The code below runs as-is on iOS and Android.
::

::callout{icon="i-lucide-box"}
Styled on top of the `@vyui/core` Sortable primitives, whose underlying gesture is the headless [`Draggable`](/components/draggable) primitive. Reach for those when you need a non-list drag interaction.
::

## Usage

`VySortable` is a controlled component in normal use. Bind an array with `v-model` and render each row through the `item` slot.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyIcon, VySortable } from '@vyui/kit'

const tasks = ref([
  { id: 'design', label: 'Design the screen' },
  { id: 'build', label: 'Build the interaction' },
  { id: 'test', label: 'Test on device' },
  { id: 'ship', label: 'Ship the release' },
])
</script>

<template>
  <VySortable v-model="tasks">
    <template #item="{ item, index }">
      <view class="flex min-w-0 flex-1 flex-row items-center gap-3">
        <VyIcon name="i-lucide-grip-vertical" class="shrink-0 text-neutral-400" />
        <text class="min-w-0 flex-1">{{ index + 1 }}. {{ item.label }}</text>
      </view>
    </template>
  </VySortable>
</template>
```

Press and hold a row for 250 ms, then drag vertically. A quick tap or an early scroll movement does not start a reorder.

### Immediate drag

Set `longPressMs="0"` when the list is not inside a vertical scroller and should engage as soon as touch begins.

```vue
<VySortable v-model="items" :long-press-ms="0">
  <template #item="{ item }">
    <text class="flex-1">{{ item.label }}</text>
  </template>
</VySortable>
```

Immediate activation can compete with scrolling, so retain the default delay for lists embedded in scrollable screens.

### Sizes

The size controls both the themed row padding and the fixed height used by the reorder calculations.

```vue
<VySortable v-model="items" size="lg">
  <template #item="{ item }">
    <text class="flex-1">{{ item.label }}</text>
  </template>
</VySortable>
```

| Size | Fixed row height |
| --- | --- |
| `sm` | `40px` |
| `md` | `52px` |
| `lg` | `68px` |

Keep slot content within the selected row height. Variable-height rows are not supported by the kit wrapper.

### Disabled list

Set `disabled` to prevent every row from arming or dragging.

```vue
<VySortable v-model="items" disabled>
  <template #item="{ item }">
    <text class="flex-1">{{ item.label }}</text>
  </template>
</VySortable>
```

## Features and behavior

- Reordering is vertical and uses the row's index in the bound array.
- A press must remain within six pixels of its starting point until the long-press delay elapses. Earlier movement disarms the pending drag so normal scrolling can continue.
- During a drag, the lifted row follows the finger and affected siblings translate by one fixed row height.
- The provisional target is the starting index plus the rounded drag distance divided by the fixed item height, clamped to the mounted list bounds.
- A release velocity of at least `300px/s` can carry the item one additional row in the same direction.
- Releasing or cancelling the touch clears every temporary transform. The reordered array is emitted only when the final index differs from the starting index.
- Only one row can own the drag gesture at a time.
- `disabled` blocks all rows. The kit wrapper does not expose the core primitive's per-row `disabled` prop.
- The wrapper keys rendered rows by their current index. Treat the `item` slot data as the source of truth after each reorder.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `T[]` | `undefined` | Controlled ordered items, used by `v-model`. |
| `disabled` | `boolean` | `false` | Prevents drag activation for every row. |
| `longPressMs` | `number` | `250` | Hold duration in milliseconds before a row lifts. Use `0` for immediate activation. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Themed row scale and fixed reorder height. |
| `class` | `any` | `undefined` | Classes merged onto the root slot. |
| `ui` | `Partial<Record<SortableSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

The kit wrapper does not expose the core `defaultValue`, `itemHeight`, `autoScrollEdge`, or `autoScrollSpeed` props. Use `SortableRoot` and `SortableItem` from `@vyui/core` when those controls are required.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `T[]` | Emitted with a new array after a row changes position. |

The underlying core root also defines `reorder`, `dragStart`, and `dragEnd`, but `VySortable` does not declare or explicitly re-emit them as part of its typed kit API.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `item` | `{ item: T, index: number }` | Content rendered inside each fixed-height sortable row. |

The core `SortableItem` slot also receives `dragging`, but the kit wrapper does not forward that value to its `item` slot.

## Styling and theming

Override globally through `appConfig.ui.sortable` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Full-width vertical list container and overflow behavior. |
| `item` | Row layout, background, divider, spacing, and disabled opacity. |
| `handle` | Reserved drag-handle styling; currently not applied by `VySortable`. |

Theme variants are:

| Variant | Values | Effect |
| --- | --- | --- |
| `size` | `sm`, `md`, `lg` | Changes row padding and text size; the wrapper also selects the matching fixed pixel height. |
| `disabled` | `true` | Dims every row and adds the disabled cursor style. |

The default root uses `overflow-hidden`, and rows use a white background with neutral dividers. Add your own handle element in the `item` slot; the declared `handle` theme slot is not wired to a rendered element in the current wrapper.

## Accessibility

`VySortable` currently uses touch-enabled Lynx `view` elements without an explicit accessibility role, label, state announcement, or keyboard/assistive reordering controls. The visual grip in an item slot is also decorative unless you provide additional semantics.

Do not make drag reordering the only way to perform an essential ordering task. Provide accessible move-up and move-down controls or another equivalent flow, announce successful order changes where appropriate, and test the complete interaction with VoiceOver and TalkBack.

## Native gesture and platform notes

- Touch tracking, row transforms, sibling shifts, velocity sampling, and edge scrolling run in main-thread worklets to avoid a background-thread round trip on every move.
- Long-press timing uses a main-thread `requestAnimationFrame` poller because the Lynx worklet runtime does not expose `setTimeout`.
- The gesture listens to native touch start, move, end, and cancel events. It does not provide keyboard or mouse-specific drag behavior.
- Reorder state is committed back on the background thread only at drag start/end boundaries, rather than during every movement frame.
- The core primitive can nudge a scroll container near its top or bottom edge. The kit wrapper does not expose the edge and speed settings, and its default themed root hides overflow, so use the core primitives for custom long-list autoscroll composition.
- All mounted rows must share the same height. The transform and target-index math cannot account for variable-height content.

## Related components

- `FeedList` for long scrolling collections that do not need reordering.
- `Card` for static grouped content.
- `SwipeAction` for horizontal per-row actions.
- `SortableRoot` and `SortableItem` from `@vyui/core` for custom row heights, per-item disabling, drag lifecycle events, and autoscroll tuning.
