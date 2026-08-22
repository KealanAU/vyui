---
title: Alert Dialog
description: Headless confirmation dialog primitive that interrupts the user with a required action or cancel.
navigation:
  icon: i-lucide-triangle-alert
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/AlertDialog
    target: _blank
category: Overlay
---

## Overview

`AlertDialog` is [`Dialog`](/components/dialog) with `role="alertdialog"` preset. The role announces alert-dialog semantics and makes the dialog undismissable by an outside tap, so the user must choose an explicit action or cancel. Use it for destructive or irreversible confirmations.

Every part except `AlertDialogRoot` is a name alias over the Dialog primitive of the same shape, so `<Dialog role="alertdialog">` is equivalent.

::callout{icon="i-lucide-box"}
This is a layer of `@vyui/core`, behavior only and no styles. Compose it when you need a custom-styled confirmation flow.
::

## Anatomy

```vue
<AlertDialogRoot>
  <AlertDialogTrigger />
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContent>
      <AlertDialogTitle />
      <AlertDialogDescription />
      <AlertDialogCancel />
      <AlertDialogAction />
    </AlertDialogContent>
  </AlertDialogPortal>
</AlertDialogRoot>
```

## Usage

```vue
<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@vyui/core'
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger>
      <text>Delete project</text>
    </AlertDialogTrigger>

    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogTitle>
          <text>Delete this project?</text>
        </AlertDialogTitle>
        <AlertDialogDescription>
          <text>This action cannot be undone.</text>
        </AlertDialogDescription>
        <AlertDialogCancel>
          <text>Cancel</text>
        </AlertDialogCancel>
        <AlertDialogAction>
          <text>Delete</text>
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
```

## Features and behavior

- Modal by default: the overlay blocks interaction with everything behind it and is **not** tap-to-dismiss.
- `open` / `v-model:open` controls visibility; `defaultOpen` seeds uncontrolled state.
- `AlertDialogAction` emits `click` then closes; `AlertDialogCancel` closes without acting. Both alias `DialogClose`.

## API

### `AlertDialogRoot`

::component-props{name="AlertDialogRoot"}
::

::component-emits{name="AlertDialogRoot"}
::

### `AlertDialogContent`

Aliases `DialogContent`.

::component-props{name="DialogContent"}
::

::component-emits{name="DialogContent"}
::

### `AlertDialogAction` / `AlertDialogCancel`

Both alias `DialogClose`.

::component-props{name="DialogClose"}
::

::component-emits{name="DialogClose"}
::

## Accessibility

- Announced with native alert-dialog semantics; include both `AlertDialogTitle` and `AlertDialogDescription`.
- The content confines assistive tech via `accessibility-exclusive-focus` while open.
- The dialog cannot be dismissed implicitly; only `AlertDialogAction` or `AlertDialogCancel` close it.

## Related components

- [`Dialog`](/components/dialog) is the general, dismissible dialog primitive.
- [`Modal`](/components/modal) is the styled `@vyui/kit` dialog.
