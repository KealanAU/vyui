---
title: Skeleton
description: Display a pulsing placeholder while content is loading.
navigation:
  icon: i-lucide-panels-top-left
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Skeleton.vue
    target: _blank
---

## Overview

`VySkeleton` renders a neutral, rounded `view` with a pulse animation. Give it explicit dimensions to reserve the same space as the content it replaces, or place custom placeholder content inside it.

::component-playground{name="skeleton"}
::

## Usage

```vue
<script setup lang="ts">
import { VySkeleton } from '@vyui/kit'
</script>

<template>
  <VySkeleton class="h-5 w-48" />
</template>
```

### Content card

Compose several skeletons to approximate the final layout and avoid a large shift when data arrives.

```vue
<template>
  <view class="flex flex-row gap-3">
    <VySkeleton class="size-12 rounded-full" />

    <view class="flex-1 flex flex-col gap-2">
      <VySkeleton class="h-4 w-2/3" />
      <VySkeleton class="h-3 w-full" />
      <VySkeleton class="h-3 w-4/5" />
    </view>
  </view>
</template>
```

### With child content

The default slot is rendered inside the animated root.

```vue
<template>
  <VySkeleton class="p-4">
    <view class="h-16" />
  </VySkeleton>
</template>
```

## Features and behavior

- The component is a plain Lynx `view`; it has no headless core primitive or loading-state logic.
- The default theme applies `animate-pulse`, `rounded-md`, and `bg-neutral-200`.
- Width and height are not supplied automatically.
- The default slot is optional and pulses with the root.
- Loading completion, delayed display, and transitions are controlled by the parent.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `class` | `any` | `undefined` | Classes merged with the root skeleton theme. Use this to set dimensions and shape. |

## Emits

This component does not emit events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Optional content rendered inside the pulsing root view. |

## Styling and theming

Override the global Tailwind Variants configuration through `appConfig.ui.skeleton`, or use `class` for a single instance.

| Theme part | Default | Purpose |
| --- | --- | --- |
| `base` | `animate-pulse rounded-md bg-neutral-200` | Animation, corner radius, and placeholder surface. |

`VySkeleton` has no `ui` prop and no variants. Local classes are merged after the global theme, so they can change dimensions, radius, color, or animation.

## Accessibility

Skeletons are visual placeholders and should not be announced as the real content. Keep meaningful labels outside the skeleton, expose loading state on the surrounding region where appropriate, and replace the placeholders when loading finishes. Avoid putting interactive controls inside a skeleton.

Animation can be uncomfortable for some users. If the consuming platform or app provides a reduced-motion mode, override or remove `animate-pulse` in the global theme or instance class.

## Platform notes

- The root is a native Lynx `view`, so web-only skeleton attributes and pseudo-elements are not added.
- Explicit dimensions prevent layout shifts and are required for an empty skeleton to be visible.
- Semantic `bg-neutral-200` resolves through the consuming app's Vy UI color configuration.
- Complex loading layouts are built by composing multiple skeletons rather than through component-specific shape props.

## Related components

- `Progress` for determinate or indeterminate task progress.
- `Card` for the final content container represented by a skeleton layout.
