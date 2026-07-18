---
title: Toast
description: Show transient feedback with optional actions, progress, stacking, and swipe dismissal.
navigation:
  icon: i-lucide-message-square-more
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Toast.vue
    target: _blank
---

## Overview

`VyToast` displays short-lived feedback in a styled card. It supports semantic colors, icons or avatars, actions, a close control, a countdown bar, swipe dismissal, and Sonner-style stacked layouts.

Every toast must be rendered inside the core `ToastProvider`. Use `ToastViewport` when the toast should float at a screen edge through the app's `OverlayRoot`.

::component-code
---
name: toast-example
height: 220px
---
::

## Usage

```vue
<script setup lang="ts">
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyToast } from '@vyui/kit/toast'
import { ref } from 'vue'

const visible = ref(true)
</script>

<template>
  <ToastProvider :duration="5000">
    <ToastViewport position="top" :style="{ top: '16px', zIndex: 60 }">
      <VyToast
        v-if="visible"
        title="Changes saved"
        description="Your profile is up to date."
        icon="i-lucide-circle-check"
        color="success"
        progress
        @update:open="visible = $event"
      />
    </ToastViewport>
  </ToastProvider>
</template>
```

`VyToast` opens when it mounts. Remove it when `update:open(false)` fires, whether dismissal came from the timer, close control, action, or swipe.

### Actions

Pass button prop objects to `actions`. Tapping an action closes the toast after the button's own handler runs.

```vue
<script setup lang="ts">
import { ToastProvider } from '@vyui/core'
import { VyToast } from '@vyui/kit/toast'

function undo() {
  console.log('Undo deletion')
}
</script>

<template>
  <ToastProvider :duration="0">
    <VyToast
      title="Conversation deleted"
      description="This action can be undone."
      color="warning"
      :actions="[
        { label: 'Undo', color: 'warning', variant: 'soft', onTap: undo },
      ]"
      :close="{ size: 'sm' }"
    />
  </ToastProvider>
</template>
```

Set the provider duration to `0` for a persistent toast. The kit component does not currently expose a per-toast `duration` prop.

### Stacked toasts

One provider coordinates order, measured heights, and expanded state for every toast in the stack. Match `stackFrom` to the viewport's vertical edge.

```vue
<script setup lang="ts">
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyToast } from '@vyui/kit/toast'
import { ref } from 'vue'

const toasts = ref([
  { id: 1, title: 'Build complete', description: 'Artifacts are ready.' },
  { id: 2, title: 'Preview deployed', description: 'The preview URL is live.' },
])

function remove(id: number) {
  toasts.value = toasts.value.filter(toast => toast.id !== id)
}
</script>

<template>
  <ToastProvider :duration="6000">
    <ToastViewport position="top" :style="{ top: '16px', zIndex: 60 }">
      <VyToast
        v-for="toast in toasts"
        :key="toast.id"
        stacked
        stack-from="top"
        swipe
        progress
        :title="toast.title"
        :description="toast.description"
        @update:open="open => !open && remove(toast.id)"
      />
    </ToastViewport>
  </ToastProvider>
</template>
```

The newest mounted toast is at the front. Tapping any stacked toast toggles the entire provider between its collapsed and expanded states. Auto-dismiss timers pause while expanded and restart when the stack collapses.

### Progress color

The countdown bar is colored by the toast's `color` by default. Pass `progress` an object to color the bar independently — either a fixed `color`, or a function of the remaining fraction (`1` at the start, `0` at dismissal) so the bar recolors as it drains.

::component-code
---
name: toast-progress-color
height: 220px
---
::

```vue
<script setup lang="ts">
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyToast } from '@vyui/kit/toast'
import { ref } from 'vue'

const shown = ref(0)
</script>

<template>
  <ToastProvider :duration="6000">
    <ToastViewport position="top" :style="{ top: '16px', zIndex: 60 }">
      <VyToast
        :key="shown"
        color="neutral"
        title="Saving changes…"
        description="Watch the bar go green → amber → red as it drains."
        :progress="{ color: (p) => p > 0.5 ? 'success' : p > 0.25 ? 'warning' : 'error' }"
        :close="false"
      />
    </ToastViewport>
  </ToastProvider>
</template>
```

### Custom content

Named slots replace the corresponding built-in regions.

```vue
<ToastProvider :duration="0">
  <VyToast color="info" :close="false">
    <template #leading="{ iconColor }">
      <VyIcon name="i-lucide-cloud" :color="iconColor" />
    </template>

    <template #title>
      <text class="text-sm font-semibold text-neutral-900">Uploading release</text>
    </template>

    <template #description>
      <text class="text-sm text-neutral-500">12 of 20 files complete</text>
    </template>
  </VyToast>
</ToastProvider>
```

## Features and behavior

- `icon` takes precedence over `avatar` in the leading region.
- `orientation="vertical"` places actions below the copy; `horizontal` places them after the copy.
- `close` defaults to `true`. Pass a partial `ButtonProps` object to customize the built-in button.
- The close icon resolves from `closeIcon`, then `appConfig.ui.icons.close`, then `i-lucide-x`.
- `progress` renders only when the provider's resolved duration is greater than `0`.
- `swipe` dismisses after a horizontal drag crosses 45% of the measured width or a fling reaches 600 px/s.
- `swipeDirection` can allow both horizontal directions or constrain dismissal to one side.
- Collapsed stacks show at most three cards; deeper cards remain mounted but transparent.
- The declared default slot is not currently rendered by the kit template. Use the named slots for custom content.
- The custom `actions` slot is currently invoked at both the vertical and horizontal insertion points. Prefer the `actions` prop until that duplication is resolved.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `undefined` | Title text, replaced by the `title` slot. |
| `description` | `string` | `undefined` | Supporting text, replaced by the `description` slot. |
| `icon` | `string` | `undefined` | Leading Iconify icon name. Takes precedence over `avatar`. |
| `avatar` | `AvatarProps` | `undefined` | Leading avatar shown when no `icon` is set. |
| `color` | `Color` | `'primary'` | Semantic icon and progress-bar color. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | Places actions beside or below the body. |
| `stacked` | `boolean` | `false` | Enables the shared collapsible stack geometry. |
| `stackFrom` | `'top' \| 'bottom'` | `'bottom'` | Edge from which a stacked group fans out. |
| `progress` | `boolean \| { color?: Color \| ((p: number) => Color) }` | `false` | Shows a countdown bar for an active auto-dismiss timer. Pass an object to color the bar independently of the toast; `color` may be a function of the remaining fraction (`1` → `0`) so the bar recolors as it drains. |
| `swipe` | `boolean` | `false` | Enables swipe-to-dismiss. |
| `swipeDirection` | `'horizontal' \| 'left' \| 'right'` | `'horizontal'` | Allowed swipe-dismiss direction. |
| `actions` | `ButtonProps[]` | `undefined` | Buttons wrapped in core `ToastAction` primitives. |
| `close` | `boolean \| Partial<ButtonProps>` | `true` | Shows or customizes the built-in close button. |
| `closeIcon` | `string` | App icon / `i-lucide-x` | Iconify name for the close button. |
| `class` | `any` | `undefined` | Classes merged onto the visual card. |
| `ui` | `Partial<Record<ToastSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

The kit wrapper does not expose the core root's `open`, `defaultOpen`, `duration`, or `type` props. Control lifetime by mounting the toast, configure duration on `ToastProvider`, and use core primitives directly when those lower-level controls are required.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | Forwards the core open-state change. In normal use the emitted closing value is `false`. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Declared in the public type but not currently rendered. |
| `leading` | `{ iconColor: string }` | Replaces the built-in icon or avatar. |
| `title` | — | Replaces title text. |
| `description` | — | Replaces supporting text. |
| `actions` | — | Replaces generated actions, but is currently rendered at both orientation insertion points. |
| `close` | `{ ui: any }` | Replaces the built-in close control. |

## Provider and viewport

`ToastProvider` and `ToastViewport` are unstyled primitives exported by `@vyui/core`.

### `ToastProvider` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `'Notification'` | Author-localized label stored in provider context. |
| `duration` | `number` | `5000` | Auto-dismiss delay in milliseconds; `0` disables it. |
| `expandByDefault` | `boolean` | `false` | Starts a stacked group expanded. |

### `ToastViewport` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'top' \| 'bottom' \| 'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom'` | Fixed screen edge and horizontal alignment. |
| `as` | `AsTag` | `'view'` | Rendered Lynx element. |
| `asChild` | `boolean` | `false` | Primitive child-merging option. |

The viewport is a content-sized strip, so taps outside the toast area pass through to the app.

## Styling and theming

Override globally through `appConfig.ui.toast` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Visual card surface, width, spacing, and layout. |
| `wrapper` | Title and description column. |
| `title` | Title text. |
| `description` | Supporting text. |
| `icon` | Built-in leading icon. |
| `avatar` | Built-in leading avatar. |
| `avatarSize` | Theme value reserved for avatar sizing. |
| `actions` | Generated action-button group. |
| `progress` | Countdown bar. |
| `close` | Built-in close button. |

The theme combines `color`, `orientation`, and an internal title-present state. Semantic color affects the leading icon and progress bar; the default card surface remains white with neutral text and border colors.

## Accessibility

Core `ToastRoot` exposes foreground toasts with an alert role description and background toasts as summaries. The kit wrapper always uses the core foreground default. `ToastTitle` is exposed as a heading, and the built-in close control is labeled “Close” with button semantics.

Generated actions are wrapped in `ToastAction`, but the kit currently passes an empty `altText`. Ensure each `VyButton` action has a clear visible label and add application-level announcement handling for critical foreground messages: the current Lynx alert mapping identifies the role but does not itself call the runtime announcement API.

Keep durations long enough to read and act on the message. Use `duration="0"` on the provider for important content that must remain until explicitly dismissed.

## Platform notes

- `ToastViewport` paints through the app-root `OverlayRoot`; include that root in the application shell for floating toasts.
- Lynx has no DOM teleport, so the overlay store preserves provider context while moving viewport content out of clipped ancestors.
- Swipe movement runs on the Lynx main thread and requires a measured toast width for distance-based dismissal; velocity-based dismissal can still work before measurement.
- Stacking transforms run on an outer shell while swipe transforms run on an inner layer, preventing the two animations from overwriting each other.
- Lynx SVG does not inherit `currentColor`, so the component resolves the leading icon color to an explicit hex value.
- The default theme uses vyui's semantic surface/text/border tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)).

## Related components

- [`Alert`](/components/alert) for persistent inline feedback.
- [`ActionSheet`](/components/action-sheet) for choosing an action.
- `Progress` for persistent task progress.
