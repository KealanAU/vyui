---
title: Drawer
description: A drawer that smoothly slides in & out of the screen.
navigation:
  icon: i-lucide-panel-bottom
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Drawer.vue
    target: _blank
---

## Overview

`VyDrawer` presents a panel that slides in from any viewport edge and settles at a snap point. It supports drag-to-dismiss, a drag handle, an optional backdrop, multiple snap points, keyboard-aware footers, and controlled or uncontrolled open state. Its API mirrors Nuxt UI's `Drawer` (vaul-style): the default slot carries the trigger, then `#content` / `#header` / `#body` / `#footer` slots shape the panel.

::component-code
---
name: drawer-example
height: 480px
---
::

::callout{icon="i-lucide-box"}
Built on the headless [`Sheet`](/components/sheet) primitive from `@vyui/core`. Drop down to it when you need full control over the snap physics and markup.
::

## Usage

Use a `VyButton` — or any component — in the default slot of the `VyDrawer`. Then use the `#content` slot to add the content displayed when the drawer opens.

::component-code
---
name: drawer-example
height: 480px
---
::

The default slot is wrapped in the core `SheetTrigger`; tapping it opens the drawer. Do not also set the open state from a tap handler on the slotted child.

Use the `#header`, `#body` and `#footer` slots to customize the drawer's content. `title` and `description` populate the built-in header.

```vue
<VyDrawer
  v-model:open="open"
  title="Edit profile"
  description="Make changes to your profile here."
>
  <VyButton label="Open drawer" />

  <template #body>
    <view class="flex flex-col gap-3 p-4">
      <!-- drawer body -->
    </view>
  </template>

  <template #footer="{ close }">
    <VyButton color="neutral" variant="ghost" label="Cancel" @tap="close" />
    <VyButton label="Save" @tap="close" />
  </template>
</VyDrawer>
```

### Directions

Use `direction` (or its `side` alias) to control which edge the drawer slides in from. It defaults to `bottom`.

::component-code
---
name: drawer-directions
height: 480px
---
::

### Controlling open state

Bind `v-model:open` to `open`, or use the plain `v-model` alias backed by `modelValue`. When uncontrolled, `defaultOpen` seeds the initial state.

```vue
<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <VyDrawer v-model:open="open" title="Notifications">
    <VyButton label="Open" />

    <template #body>
      <Placeholder class="h-48 m-4" />
    </template>
  </VyDrawer>
</template>
```

## Features and behavior

- Bind `v-model:open` to `open`, or use the `v-model` alias backed by `modelValue`.
- Both `update:open` and `update:modelValue` are emitted on every open-state change.
- `defaultOpen` initializes uncontrolled open state (now honored by the underlying `SheetRoot`).
- `direction` / `side` pick the edge: `top`, `right`, `bottom`, or `left`; default `bottom`.
- `overlay` toggles the dimmed backdrop; `dismissible` controls both backdrop dismissal and drag-to-close.
- `handle` shows the drag-handle pill; `handleOnly` restricts dragging to the handle.
- `snapPoints` are 0 → 1 fractions of the viewport on the slide axis. Defaults to `[0.75]` (a three-quarter-height bottom sheet). Pass `[1]` for full-screen or e.g. `[0.4, 0.9]` for a resizable sheet.
- `keyboardAware` lifts the footer above the on-screen keyboard when a field inside it is focused.
- The `#content`, `#header`, `#body`, and `#footer` slots receive a `close()` helper for programmatic dismissal (Nuxt UI parity).

## Typed API

The component ships fully typed interfaces exported from `packages/kit/src/components/Drawer.vue` — `DrawerProps`, `DrawerEmits`, and `DrawerSlots` — so agents and editors get exact prop, event, and slot signatures from the source and the generated `.d.ts`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled state used by `v-model:open`; takes precedence over `modelValue`. |
| `modelValue` | `boolean` | `undefined` | Convenience controlled state used by `v-model`. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `direction` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Edge the drawer slides from. Alias: `side`. |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Alias for `direction` (Nuxt UI parity). |
| `transition` | `boolean` | `true` | Applies the kit slide animation markers. |
| `overlay` | `boolean` | `true` | Renders the dimmed backdrop. |
| `portal` | `boolean` | `true` | API-parity prop; sheet content is always portalled through `OverlayRoot`. |
| `dismissible` | `boolean` | `true` | When `false`, backdrop taps and drag do not close the drawer. |
| `title` | `string` | `undefined` | Header title text, replaced by the `title` or `header` slot. |
| `description` | `string` | `undefined` | Header supporting text, replaced by the `description` or `header` slot. |
| `handle` | `boolean` | `true` | Renders the drag-handle pill. |
| `handleOnly` | `boolean` | `false` | When `true`, only the handle is draggable. |
| `dragDisabled` | `boolean` | `false` | Disables dragging on the underlying `SheetContent`. |
| `snapPoints` | `number[]` | `[0.75]` | 0 → 1 snap fractions forwarded to `SheetRoot`. |
| `defaultSnapIndex` | `number` | `0` | Initial snap index when uncontrolled. |
| `keyboardAware` | `boolean` | `false` | Lifts the footer above the on-screen keyboard. |
| `keyboardAwareForceAttach` | `boolean` | `true` | Forces the footer to stick to the keyboard's top edge. |
| `class` | `any` | `undefined` | Classes merged onto the sheet content. |
| `ui` | `Partial<Record<DrawerSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | Open-state update for `v-model:open`. |
| `update:modelValue` | `boolean` | Open-state update for `v-model`. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ open: boolean }` | Trigger content wrapped by `SheetTrigger`. |
| `content` | `{ close: () => void }` | Replaces the complete default header/body/footer layout. |
| `header` | `{ close: () => void }` | Replaces the title and description block. |
| `title` | — | Overrides the built-in title text. |
| `description` | — | Overrides the built-in description text. |
| `body` | `{ close: () => void }` | Main scrollable content region. |
| `footer` | `{ close: () => void }` | Bottom action region. |

## Styling and theming

Override globally through `appConfig.ui.drawer` or locally through `ui`.

| UI slot | Purpose |
| --- | --- |
| `overlay` | Full-screen backdrop. |
| `content` | Sliding panel and edge dimensions. |
| `handle` | Drag-handle pill. |
| `scaffold` | Column wrapper for header/body/footer. |
| `header` | Header row and spacing. |
| `wrapper` | Title and description wrapper. |
| `body` | Scrollable main region. |
| `footer` | Bottom action row. |
| `title` | Built-in title typography. |
| `description` | Built-in supporting text. |
| `close` | (Reserved) built-in close-button positioning. |

Variants are `side` (edge placement and dimensions) and `transition`. Open/close motion is driven by core's Presence keyframes, so the slide stays native-smooth.

## Accessibility

The trigger exposes native button semantics and announces collapsed or expanded state. Provide an `accessibility-label` on icon-only triggers.

Lynx has no DOM focus trap and hardware Escape handling is not currently wired. Test focus order, background isolation, and dismissal with VoiceOver and TalkBack on each target platform.

## Platform notes

- Drawer content is painted through the app-root `OverlayRoot`; `portal` is a transparent pass-through on Lynx.
- Drag tracking and snap motion run on the main thread (MTS) for native-smooth tracking.
- The `defaultOpen` flag — previously dead because the panel was always treated as controlled — is now honored (see `useStandardVModel` in `@vyui/core`).
- Use `<VyDrawer :snap-points="[1]">` for a full-screen sheet, or `VyModal` for a centered blocking dialog.

## Related components

- [`Modal`](/components/modal) for a centered blocking dialog.
- [`Tray`](/components/tray) for a `fitContent` sheet that hugs its content.
- [`Sheet`](/components/sheet) is the headless `@vyui/core` primitive underneath.
