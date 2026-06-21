---
title: Swipe Action
description: Reveal trailing row actions or commit an action with a full swipe.
navigation:
  icon: i-lucide-swipe
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/SwipeAction.vue
    target: _blank
---

## Overview

`VySwipeAction` places an action panel behind a foreground row. A leftward drag reveals the panel, a short rightward flick closes it, and a sufficiently long or fast leftward swipe emits `commit`.

::component-code
---
name: swipe-action-example
height: 160px
---
::

::callout{icon="i-lucide-pointer" color="warning"}
Swipe gestures aren't wired up in the web preview yet, so the row won't slide here — view this on a device or in Lynx Explorer for the real interaction. The code below runs as-is on iOS and Android.
::

## Usage

Both `rowWidth` and `actionWidth` are required because the core gesture primitive performs its threshold and translation calculations in pixels.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwipeAction } from '@vyui/kit'

const open = ref(false)
const archived = ref(false)

function archive() {
  archived.value = true
}
</script>

<template>
  <VySwipeAction
    v-if="!archived"
    v-model:open="open"
    :row-width="360"
    :action-width="96"
    @commit="archive"
  >
    <view class="h-16 px-4 justify-center bg-white">
      <text class="font-medium">Quarterly report</text>
      <text class="text-sm text-neutral-500">Swipe left to archive</text>
    </view>

    <template #actions="{ close }">
      <view
        class="w-24 items-center justify-center bg-primary-600"
        accessibility-element="true"
        accessibility-traits="button"
        accessibility-label="Archive quarterly report"
        @tap="archive(); close()"
      >
        <text class="text-white font-medium">Archive</text>
      </view>
    </template>
  </VySwipeAction>
</template>
```

Handle `commit` by completing or confirming the action. A committed row animates through the full `rowWidth`; removing the completed row from its list is the usual pattern.

### Delete action

Use the slot's `close` function after a panel action. This animates the row closed and updates `v-model:open`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwipeAction } from '@vyui/kit'

const open = ref(false)
const deleted = ref(false)

function remove() {
  deleted.value = true
}
</script>

<template>
  <VySwipeAction
    v-if="!deleted"
    v-model:open="open"
    :row-width="320"
    :action-width="88"
    @commit="remove"
  >
    <template #default="{ open: isOpen }">
      <view class="h-16 px-4 flex-row items-center justify-between bg-white">
        <text>Draft message</text>
        <text class="text-sm text-neutral-500">{{ isOpen ? 'Actions open' : 'Swipe left' }}</text>
      </view>
    </template>

    <template #actions="{ close }">
      <view
        class="w-[88px] items-center justify-center bg-error-600"
        accessibility-element="true"
        accessibility-traits="button"
        accessibility-label="Delete draft message"
        @tap="remove(); close()"
      >
        <text class="text-white font-medium">Delete</text>
      </view>
    </template>
  </VySwipeAction>
</template>
```

### Multiple actions

The action panel can contain more than one control as long as their combined width matches `actionWidth`.

```vue
<VySwipeAction
  v-model:open="open"
  :row-width="360"
  :action-width="176"
>
  <view class="h-16 px-4 justify-center bg-white">
    <text>Conversation</text>
  </view>

  <template #actions="{ close }">
    <view
      class="w-[88px] items-center justify-center bg-neutral-200"
      accessibility-element="true"
      accessibility-traits="button"
      accessibility-label="Mark conversation unread"
      @tap="markUnread(); close()"
    >
      <text>Unread</text>
    </view>
    <view
      class="w-[88px] items-center justify-center bg-error-600"
      accessibility-element="true"
      accessibility-traits="button"
      accessibility-label="Delete conversation"
      @tap="remove(); close()"
    >
      <text class="text-white">Delete</text>
    </view>
  </template>
</VySwipeAction>
```

### Default open and disabled

Use `defaultOpen` for uncontrolled initial state. `disabled` prevents drag interaction.

```vue
<VySwipeAction
  :row-width="320"
  :action-width="88"
  default-open
  disabled
>
  <view class="h-16 px-4 justify-center bg-white">
    <text>Locked row</text>
  </view>
  <template #actions>
    <view class="w-[88px] items-center justify-center bg-neutral-200">
      <text>Locked</text>
    </view>
  </template>
</VySwipeAction>
```

### Custom styles

Use `class` for the root or `ui` for the foreground and action panel wrappers.

```vue
<VySwipeAction
  v-model:open="open"
  :row-width="360"
  :action-width="96"
  class="rounded-xl"
  :ui="{
    content: 'bg-neutral-50',
    actions: 'bg-error-50',
  }"
>
  <view class="h-16 px-4 justify-center">
    <text>Styled row</text>
  </view>
  <template #actions="{ close }">
    <view class="w-24 items-center justify-center" @tap="close">
      <text class="text-error-700">Close</text>
    </view>
  </template>
</VySwipeAction>
```

## Features and behavior

- Bind `v-model:open` for controlled open state, or use `defaultOpen` for an uncontrolled initial state.
- The foreground row translates from `0` when closed to `-actionWidth` when open.
- During a drag, translation is clamped between `0` and `-rowWidth`, allowing a full-swipe commit beyond the visible action panel.
- The `default` and `actions` slots both receive the resolved `open` state and a `close()` function.
- External changes to `open` animate the row to its open or closed position.
- `disabled` ignores touch start, so the current state remains unchanged.
- Vertical intent is yielded to a surrounding list after the gesture direction is resolved.

### Gesture behavior

| Release condition | Default | Result |
| --- | --- | --- |
| Drag past `threshold × actionWidth` | `0.5 × actionWidth` | Snaps the row open. |
| Leftward velocity at least `400px/s` | Core default | Snaps open even before the position threshold. |
| Rightward velocity at least `400px/s` | Core default | Closes even when the row is past the open threshold. |
| Drag past `0.5 × rowWidth` | Core default | Animates through the row and emits `commit`. |
| Leftward velocity at least `1200px/s` | Core default | Emits `commit` regardless of position. |
| Release animation | `240ms` | Animates to closed, open, or committed position. |

The gesture stays undecided for the first `8px`. It then claims drags within the horizontal `45°` cone and yields predominantly vertical drags for the rest of that touch.

Only the open `threshold` is exposed by `VySwipeAction`. The core primitive also has `commitThreshold`, `commitVelocity`, `velocityThreshold`, and `duration` props, but the current kit wrapper does not forward them.

::warning
The action panel is physically anchored to the trailing right edge and opens with a leftward swipe. `side="left"` currently changes action alignment styling only; it does not move the panel or reverse the gesture.
::

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `actionWidth` | `number` | Required | Revealed action-panel width in pixels and the basis for the open threshold. |
| `rowWidth` | `number` | Required | Full row width in pixels and the basis for the commit threshold. |
| `open` | `boolean` | `undefined` | Controlled open state used by `v-model:open`. |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |
| `disabled` | `boolean` | `false` | Disables drag interaction. |
| `threshold` | `number` | `0.5` in core | Fraction of `actionWidth` required to snap open without a velocity override. |
| `side` | `'left' \| 'right'` | `'right'` | Action alignment theme variant; the physical panel remains on the right. |
| `class` | `any` | `undefined` | Classes merged onto the root slot. |
| `ui` | `Partial<Record<SwipeActionSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

Keep `threshold` between `0` and `1`. Widths must match the rendered layout; stale or approximate values produce incorrect snap and commit points.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | The row snapped open, closed, or was closed through the slot helper. |
| `commit` | none | A release crossed the core full-swipe position or velocity threshold. |

`commit` describes the gesture; it does not delete, archive, or otherwise mutate application data for you.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ open: boolean, close: () => void }` | Foreground row content that moves with the gesture. |
| `actions` | `{ open: boolean, close: () => void }` | Trailing action-panel content revealed beneath the row. |

## Styling and theming

Override globally through `appConfig.ui.swipeAction` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Relative clipping container around the primitive. |
| `actions` | Flex wrapper inside the trailing action panel. |
| `content` | Flex wrapper around the foreground row content. |

The `side` variant sets `justify-start` or `justify-end` on `actions`. The default theme is light-mode-oriented: the foreground is white and the action wrapper uses `neutral-100`.

## Accessibility

`VySwipeAction` does not currently add native button, adjustable, group, expanded-state, or gesture instructions to the row. Swipe gestures also have no direct keyboard or switch-control equivalent. Every action in the `actions` slot should therefore be an independently labeled native control, and any destructive full-swipe behavior should have a visible, non-gesture alternative.

The examples add Lynx `accessibility-element`, `accessibility-traits`, and `accessibility-label` attributes to tappable action views. Also expose the same operation elsewhere when a row can be committed by swiping, and consider confirmation or undo for destructive actions.

## Platform notes

- Touch tracking, axis locking, velocity calculation, clamping, and release animation run on the Lynx main thread.
- The component is designed for rows inside vertical native lists; predominantly vertical gestures are released without moving or snapping the row.
- There is no automatic measurement. Recalculate and pass `rowWidth` and `actionWidth` when layout width changes.
- Only a trailing right-edge panel and leftward reveal gesture are implemented today. RTL and leading-edge reveal are not exposed.
- A full-swipe commit should update or remove the affected row promptly so the completed translation does not leave stale content on screen.

## Related components

- [`Swiper`](/components/swiper) for paging between full content panels.
- [`ActionSheet`](/components/action-sheet) for presenting a temporary list of actions.
- `DropdownMenu` for actions opened by an explicit trigger.
