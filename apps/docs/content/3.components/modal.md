---
title: Modal
description: Present a short blocking alert or confirmation dialog.
navigation:
  icon: i-lucide-gallery-vertical-end
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Modal.vue
    target: _blank
---

## Overview

`VyModal` presents a centered dialog over a full-screen backdrop. It is intended for short blocking alerts and confirmations with a title, concise description, and one or two actions. Use `VyDrawer` for forms, pickers, long content, drag-to-dismiss interaction, or full-screen presentations.

::component-playground{name="modal"}
::

::callout{icon="i-lucide-box"}
Built on the headless [`Dialog`](/components/dialog) primitive from `@vyui/core`. Drop down to it when you need full control over the markup and styling.
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyModal } from '@vyui/kit'

const open = ref(false)
</script>

<template>
  <VyModal
    v-model:open="open"
    title="Discard changes?"
    description="Your unsaved changes will be lost."
  >
    <VyButton color="error" variant="soft">Discard draft</VyButton>

    <template #footer="{ close }">
      <VyButton color="neutral" variant="ghost" @tap="close">
        Keep editing
      </VyButton>
      <VyButton color="error" @tap="discardDraft">
        Discard
      </VyButton>
    </template>
  </VyModal>
</template>
```

The default slot is wrapped in the core `DialogTrigger`; tapping it toggles the modal. Do not also set the open state from a tap handler on the slotted child.

### Body content

Use the `body` slot for a short message or compact supporting content.

```vue
<VyModal
  v-model="open"
  title="Enable notifications?"
  description="You can change this later in Settings."
>
  <VyButton>Open modal</VyButton>

  <template #body>
    <view class="flex flex-row items-center gap-3">
      <VyIcon name="i-lucide-bell" color="#42b883" class="size-6" />
      <text class="text-sm text-neutral-600">
        Receive account activity and security alerts.
      </text>
    </view>
  </template>

  <template #footer="{ close }">
    <VyButton color="neutral" variant="ghost" @tap="close">Not now</VyButton>
    <VyButton @tap="enableNotifications">Enable</VyButton>
  </template>
</VyModal>
```

### Custom header

The `header` slot replaces the complete built-in title, description, and close-button region.

```vue
<VyModal v-model:open="open">
  <VyButton>Delete account</VyButton>

  <template #header="{ close }">
    <view class="flex flex-row items-start justify-between gap-3 p-4">
      <view class="flex-1">
        <text class="text-lg font-semibold text-error-600">Delete account</text>
        <text class="mt-1 text-sm text-neutral-500">
          This action cannot be undone.
        </text>
      </view>
      <VyButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        accessibility-label="Close"
        @tap="close"
      />
    </view>
  </template>
</VyModal>
```

When replacing the header, provide your own clearly labeled close control when dismissal should remain visible.

### Full content override

The `content` slot replaces the entire header, body, footer, and built-in close button.

```vue
<VyModal v-model:open="open">
  <VyButton>Confirm purchase</VyButton>

  <template #content="{ close }">
    <view class="flex flex-col gap-4 p-5">
      <text class="text-lg font-semibold text-neutral-900">Confirm purchase</text>
      <text class="text-sm text-neutral-500">One annual subscription for $99.</text>
      <view class="flex flex-row justify-end gap-2">
        <VyButton color="neutral" variant="ghost" @tap="close">Cancel</VyButton>
        <VyButton @tap="confirmPurchase">Confirm</VyButton>
      </view>
    </view>
  </template>
</VyModal>
```

### Custom close button

Pass button props through `close`, or replace the control with the `close` slot.

```vue
<VyModal
  v-model:open="open"
  title="Session expired"
  :close="{ color: 'error', variant: 'soft', size: 'sm' }"
  close-icon="i-lucide-log-out"
>
  <VyButton>Show session status</VyButton>
</VyModal>
```

Set `close="false"` to hide the built-in close button.

## Features and behavior

- Bind `v-model:open` to `open`, or use the `v-model` alias backed by `modelValue`.
- `open` takes precedence when both controlled props are supplied.
- Both `update:open` and `update:modelValue` are emitted on every open-state change.
- `defaultOpen` initializes uncontrolled dialog state.
- The trigger toggles the dialog and ignores repeated taps while enter or leave animation is active.
- Tapping the backdrop closes the dialog; tapping inside the panel stops propagation.
- The built-in close control uses the core `DialogClose` primitive.
- The `content` slot replaces all default layout regions, including the built-in close button.
- The `header`, `body`, `footer`, and `content` slots receive a `close()` helper.

### Current API limitations

- `dismissible` is declared and defaults to `true`, but the kit component does not currently forward it to the core dialog. Backdrop taps therefore still dismiss when `dismissible` is `false`.
- `overlay="false"` removes the dimming class, but the full-screen transparent backdrop still renders, blocks interaction behind the modal, and dismisses on tap.
- `portal` is retained for API parity, but changing it has no effect. Dialog content is always registered with the Lynx `OverlayRoot`.
- In uncontrolled mode, the `close()` slot helper only emits updates and does not directly change the core dialog's internal state. Prefer controlled state when using the helper. The built-in close control and backdrop still close uncontrolled dialogs.
- The `open` value exposed to the default trigger slot is derived from controlled props; it does not reflect `defaultOpen` changes in uncontrolled mode.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled state used by `v-model:open`; takes precedence over `modelValue`. |
| `modelValue` | `boolean` | `undefined` | Convenience controlled state used by `v-model`. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `title` | `string` | `undefined` | Built-in title text, replaced by the `title` or `header` slot. |
| `description` | `string` | `undefined` | Built-in supporting text, replaced by the `description` or `header` slot. |
| `overlay` | `boolean` | `true` | Applies the dimmed backdrop styling. A transparent dismissal layer remains when false. |
| `transition` | `boolean` | `true` | Applies the kit fade and zoom animation marker classes. |
| `portal` | `boolean` | `true` | API-parity prop; currently does not change Lynx overlay registration. |
| `close` | `boolean \| Partial<ButtonProps>` | `true` | Shows the built-in close button and optionally forwards button props. |
| `closeIcon` | `string` | App icon / `i-lucide-x` | Iconify name for the built-in close button. |
| `dismissible` | `boolean` | `true` | Declared API prop; currently not wired, so backdrop dismissal remains enabled. |
| `class` | `any` | `undefined` | Classes merged onto the trigger wrapper, not the modal panel. |
| `ui` | `Partial<Record<ModalSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | Open-state update for `v-model:open`. |
| `update:modelValue` | `boolean` | Open-state update for `v-model`. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ open: boolean }` | Trigger content wrapped by `DialogTrigger`. The value reflects controlled props. |
| `content` | `{ close: () => void }` | Replaces the complete default panel layout. |
| `header` | `{ close: () => void }` | Replaces title, description, and built-in close button. |
| `body` | `{ close: () => void }` | Main scrollable content region. |
| `footer` | `{ close: () => void }` | Bottom action region. |
| `title` | — | Replaces the built-in title text. |
| `description` | — | Replaces the built-in description text. |
| `close` | `{ ui }` | Replaces the built-in close button inside `DialogClose`. |

The `ui` close-slot prop is the resolved Tailwind Variants slot object.

## Styling and theming

Override globally through `appConfig.ui.modal` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `overlay` | Full-screen backdrop color and transition marker. |
| `content` | Centered panel width, maximum height, border, radius, surface, and transition marker. |
| `header` | Header row and spacing. |
| `wrapper` | Title and description wrapper. |
| `body` | Scrollable main content region. |
| `footer` | Wrapping action row. |
| `title` | Built-in title typography. |
| `description` | Built-in supporting text and spacing. |
| `close` | Built-in close-button positioning. |

The only theme variant is `transition`. When enabled, the backdrop fades and the panel zooms during the core Presence lifecycle. The panel is capped at `calc(100dvh - 1rem)`, and the body scrolls when its content exceeds the available height.

The root theme uses `divide-y`, so the default header, body, and footer regions produce separators even when a region has no slot content. Use the `content` slot when you need complete control over structure and dividers.

## Accessibility

The trigger exposes native button semantics and announces collapsed or expanded state. The panel exposes dialog semantics through a native role description and requests exclusive accessibility focus while open. The built-in title exposes heading semantics, and the built-in close control exposes button semantics with the label “Close.”

Keep `title` concise and ensure the purpose and consequences are clear in visible text. When using `header` or `content`, preserve a heading and provide every icon-only action with an `accessibility-label`.

The native panel is treated as an accessibility container rather than one combined accessibility element, allowing its child controls to remain navigable. However, Lynx has no DOM focus trap, and hardware Escape handling is not currently wired. Test focus order, background isolation, and dismissal with VoiceOver and TalkBack on each target platform.

## Platform notes

- Modal content is painted through the app-root `OverlayRoot`; `DialogPortal` itself is a transparent pass-through on Lynx.
- Outside interaction is a native tap on the full-screen backdrop rather than a DOM pointer event.
- The default transition uses Presence lifecycle classes and Lynx animation bindings, with a 250ms enter and 200ms leave.
- Core dialog focus callbacks and DOM-style focus trapping are API-parity no-ops on Lynx.
- The default theme is light-mode oriented and uses a white panel with a neutral border.
- Use `<VyDrawer :snap-points="[1]">` instead of a full-screen modal.

## Related components

- [`ActionSheet`](/components/action-sheet) for a mobile list of actions.
- `Drawer` for forms, long content, drag gestures, and full-screen presentation.
- `AlertDialog` primitives from `@vyui/core` when alert-dialog semantics are required.
- `Popover` for non-blocking contextual content.
