---
title: Dialog
description: Headless modal/non-modal dialog primitive — trigger, portal, overlay, and content with full focus and dismiss behavior.
navigation:
  icon: i-lucide-app-window
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Dialog
    target: _blank
---

## Overview

`Dialog` is a headless `@vyui/core` primitive for an overlay window layered above the page. It ships behavior only — open/close state, portalling, overlay, focus management, and dismissal — and leaves all markup and styling to you. The styled [`Modal`](/components/modal) component in `@vyui/kit` is built on top of it.

::callout{icon="i-lucide-box"}
This is a layer of `@vyui/core`. If you want a drop-in styled dialog, reach for `VyModal` in `@vyui/kit` instead and only compose these primitives when you need full control.
::

## Anatomy

```vue
<DialogRoot>
  <DialogTrigger />
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogTitle />
      <DialogDescription />
      <DialogClose />
    </DialogContent>
  </DialogPortal>
</DialogRoot>
```

## Usage

```vue
<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@vyui/core'

const open = ref(false)
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger>
      <text>Open dialog</text>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle>
          <text>Confirm changes</text>
        </DialogTitle>
        <DialogDescription>
          <text>This updates your workspace settings.</text>
        </DialogDescription>
        <DialogClose>
          <text>Close</text>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

## Features and behavior

- `modal` defaults to `true`; interaction with content behind the overlay is blocked. Set `modal="false"` for a non-modal dialog that leaves the rest of the page interactive.
- `open` / `v-model:open` controls visibility; `defaultOpen` seeds uncontrolled state.
- `DialogContent` traps focus while open and restores it to the trigger on close.
- `DialogClose` and pressing dismiss/back close the dialog and emit `update:open`.
- `DialogPortal` renders the overlay and content at the root of the tree so they layer above sibling content.

## API

### `DialogRoot`

::component-props{name="DialogRoot"}
::

::component-emits{name="DialogRoot"}
::

### `DialogTrigger`

::component-props{name="DialogTrigger"}
::

### `DialogContent`

::component-props{name="DialogContent"}
::

::component-emits{name="DialogContent"}
::

### `DialogOverlay`

::component-props{name="DialogOverlay"}
::

### `DialogClose`

::component-props{name="DialogClose"}
::

## Accessibility

- `DialogContent` exposes native Lynx dialog semantics and manages a focus trap; always include a `DialogTitle` so the dialog is announced.
- `DialogDescription` is associated with the content as its accessible description.
- Closing returns focus to the element that opened the dialog.

## Related components

- [`Modal`](/components/modal) — the styled `@vyui/kit` dialog built on this primitive.
- [`AlertDialog`](/components/alert-dialog) — a focus-trapping confirmation variant with required action/cancel.
- [`Sheet`](/components/sheet) — a drag-snappable bottom sheet alternative.
