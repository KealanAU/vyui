---
title: Draggable
description: Headless 2D pan-gesture primitive with axis locking, bounds, momentum, and reset.
navigation:
  icon: i-lucide-move
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Draggable
    target: _blank
---

## Overview

`Draggable` is a headless `@vyui/core` primitive that turns its child into a draggable element via a main-thread pan gesture. It is the building block behind [`Sortable`](/components/sortable) and other drag-driven interactions, and tracks the finger natively for smooth motion.

::component-code
---
name: draggable-example
height: 320px
---
::

::callout{icon="i-lucide-box"}
This is a vyui-original `@vyui/core` primitive — a 2D pan gesture over Lynx main-thread touch events. Behavior only, no styles.
::

## Usage

```vue
<script setup lang="ts">
import { Draggable } from '@vyui/core'

function onEnd(payload) {
  console.log('settled at', payload.x, payload.y)
}
</script>

<template>
  <Draggable
    axis="both"
    :bounds="{ left: -120, right: 120, top: -80, bottom: 80 }"
    reset-on-end
    @drag-end="onEnd"
  >
    <view class="size-16 rounded-xl bg-primary" />
  </Draggable>
</template>
```

## Features and behavior

- `axis` locks dragging to `'x'`, `'y'`, or `'both'` (free 2D pan).
- `bounds` constrains the drag in px relative to the origin; an omitted side is unbounded.
- `resetOnEnd` animates back to `(0, 0)` on release (`duration` tunes the animation).
- `momentum` carries release velocity into a decelerating coast (clamped to `bounds`); ignored when `resetOnEnd` is set. `momentumDecel` controls how quickly the fling stops.
- `emitMove` opts into a `drag-move` event on every touchmove; `drag-start` and `drag-end` always fire.

## API

### Props

::component-props{name="Draggable"}
::

### Emits

::component-emits{name="Draggable"}
::

The `drag-move` payload adds `dx` / `dy` (delta from touchstart); `drag-end` additionally carries `vx` / `vy` release velocity in px/s.

## Accessibility

- Pointer dragging has no keyboard equivalent — provide an alternative control path for keyboard and assistive-tech users where the interaction is essential.

## Platform notes

- The gesture is implemented with main-thread (MTS) worklets, so tracking stays smooth independent of the background thread.
- Touch and mouse are both wired: on-device drags use touch events, while desktop browsers (Lynx web) drive the same worklets from mouse events — the live preview above works with a mouse.

## Related components

- [`Sortable`](/components/sortable) — reorderable lists built on this primitive.
- [`Swiper`](/components/swiper) — paged horizontal swiping.
- [`Sheet`](/components/sheet) — snap/drag bottom sheet.
