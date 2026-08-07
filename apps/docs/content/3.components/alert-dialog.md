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
---

## Overview

`AlertDialog` is a headless `@vyui/core` primitive for a modal that interrupts the user and expects a response. Unlike [`Dialog`](/components/dialog), it is always modal and cannot be dismissed by clicking the overlay, since the user must choose an explicit action or cancel. Use it for destructive or irreversible confirmations.

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

- Always modal: the overlay blocks interaction with everything behind it and is **not** click-to-dismiss.
- `open` / `v-model:open` controls visibility; `defaultOpen` seeds uncontrolled state.
- Focus is moved to `AlertDialogCancel` by default and trapped within the content while open.
- `AlertDialogAction` confirms and closes; `AlertDialogCancel` dismisses without acting.

## API

### `AlertDialogRoot`

::component-props{name="AlertDialogRoot"}
::

::component-emits{name="AlertDialogRoot"}
::

### `AlertDialogContent`

::component-props{name="AlertDialogContent"}
::

::component-emits{name="AlertDialogContent"}
::

### `AlertDialogAction`

::component-props{name="AlertDialogAction"}
::

::component-emits{name="AlertDialogAction"}
::

### `AlertDialogCancel`

::component-props{name="AlertDialogCancel"}
::

## Accessibility

- Announced with native alert-dialog semantics; include both `AlertDialogTitle` and `AlertDialogDescription`.
- Default focus lands on the cancel control so an accidental confirmation is harder.
- The dialog cannot be dismissed implicitly; only `AlertDialogAction` or `AlertDialogCancel` close it.

## Related components

- [`Dialog`](/components/dialog) is the general, dismissible dialog primitive.
- [`Modal`](/components/modal) is the styled `@vyui/kit` dialog.
