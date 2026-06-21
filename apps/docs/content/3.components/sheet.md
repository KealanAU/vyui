---
title: Sheet
description: Headless drag-snappable bottom sheet primitive with snap points, fling, and drag-to-dismiss.
navigation:
  icon: i-lucide-panel-bottom
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Sheet
    target: _blank
---

## Overview

`Sheet` is a headless `@vyui/core` primitive for a panel that slides up from the bottom edge and settles at one of several snap points. Dragging is driven on the main thread for native-smooth tracking, with fling-to-advance and optional drag-to-dismiss. The styled [`Drawer`](/components/drawer) and [`ActionSheet`](/components/action-sheet) components build on it.

::callout{icon="i-lucide-box"}
This is a vyui-original `@vyui/core` primitive (the snap/drag pattern is adapted from `lynx-ui`). Compose it directly when you need custom snap behavior; otherwise use the styled kit components.
::

## Anatomy

```vue
<SheetRoot>
  <SheetTrigger />
  <SheetBackdrop />
  <SheetContent>
    <SheetHandle />
    <!-- sheet body -->
  </SheetContent>
</SheetRoot>
```

## Usage

```vue
<script setup lang="ts">
import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetTrigger,
} from '@vyui/core'

const open = ref(false)
</script>

<template>
  <SheetRoot
    v-model:open="open"
    :snap-points="[0.25, 0.5, 0.9]"
    :default-snap-index="1"
  >
    <SheetTrigger>
      <text>Open sheet</text>
    </SheetTrigger>
    <SheetBackdrop />
    <SheetContent>
      <SheetHandle />
      <view class="p-4">
        <text>Drag the handle to snap between sizes.</text>
      </view>
    </SheetContent>
  </SheetRoot>
</template>
```

## Features and behavior

- `snapPoints` are fractions of viewport height, low → high (e.g. `[0.25, 0.5, 0.9]`); default is `[1]` (full height).
- `snapIndex` / `v-model:snapIndex` controls the current snap (0 = most closed); `defaultSnapIndex` seeds it.
- A fling projects a short coast and advances by a snap; downward flings past `dismissVelocity` dismiss when `enableDragToClose` (default `true`).
- `dragHandleOnly` restricts dragging to `<SheetHandle>`, leaving the body non-interactive to touch.
- `viewportHeight` overrides the runtime height read; `duration` tunes the settle animation.

## API

### `SheetRoot`

::component-props{name="SheetRoot"}
::

::component-emits{name="SheetRoot"}
::

### `SheetContent`

::component-props{name="SheetContent"}
::

### `SheetTrigger`

::component-props{name="SheetTrigger"}
::

### `SheetBackdrop`

::component-props{name="SheetBackdrop"}
::

### `SheetHandle`

::component-props{name="SheetHandle"}
::

## Accessibility

- Provide a visible label or handle affordance so the sheet is discoverable and draggable.
- The backdrop dims and (by default) closes the sheet; ensure the open state is reflected to assistive tech via the content semantics.

## Platform notes

- Drag tracking and bounce run through main-thread (MTS) touch worklets, so motion stays smooth off the background thread.
- `id` is required by the bounce system to select the container on the main thread; it is auto-generated when omitted.

## Related components

- [`Drawer`](/components/drawer) — the styled `@vyui/kit` sheet.
- [`ActionSheet`](/components/action-sheet) — a styled list-of-actions sheet.
- [`Dialog`](/components/dialog) — a centered modal alternative.
