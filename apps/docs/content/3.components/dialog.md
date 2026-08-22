---
title: Dialog
description: Headless modal and non-modal dialog primitive covering trigger, portal, overlay, and content with full dismiss behavior.
navigation:
  icon: i-lucide-app-window
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Dialog
    target: _blank
category: Overlay
---

## Overview

`Dialog` is a headless `@vyui/core` primitive for an overlay window layered above the page. It ships behavior only: open/close state, portalling, overlay, and dismissal, and it leaves all markup and styling to you. The styled [`Modal`](/components/modal) component in `@vyui/kit` is built on top of it.

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

- `modal` defaults to `true`; interaction with content behind the overlay is blocked and assistive tech is confined to the dialog. Set `modal="false"` for a non-modal dialog that leaves the rest of the page interactive and reachable.
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

- `DialogContent` exposes native Lynx dialog semantics; always include a `DialogTitle` so the dialog is announced.
- `DialogDescription` is associated with the content as its accessible description.
- Lynx has no DOM focus model, so the primitive does not trap focus or restore it to the trigger on close.

## Related components

- [`Modal`](/components/modal) is the styled `@vyui/kit` dialog built on this primitive.
- [`AlertDialog`](/components/alert-dialog) is this primitive with `role="alertdialog"` preset — undismissable, with required action/cancel.
- [`Sheet`](/components/sheet) is a drag-snappable bottom sheet alternative.
