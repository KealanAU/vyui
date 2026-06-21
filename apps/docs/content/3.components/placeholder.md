---
title: Placeholder
description: Mark out an unfinished or example layout region with a hatched panel.
navigation:
  icon: i-lucide-square-dashed
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Placeholder.vue
    target: _blank
---

## Overview

`VyPlaceholder` renders an empty, dashed panel with a subtle diagonal hatch. It is intended for wireframes, documentation examples, and layout stubs rather than loading state.

::component-playground{name="placeholder"}
::

## Usage

Give the component explicit dimensions so its empty root is visible.

```vue
<script setup lang="ts">
import { VyPlaceholder } from '@vyui/kit'
</script>

<template>
  <VyPlaceholder class="h-40 w-full" />
</template>
```

### Layout composition

Use placeholders to establish the shape and spacing of a screen before its real content is available.

```vue
<template>
  <view class="flex flex-col gap-4">
    <VyPlaceholder class="h-16 w-full" />

    <view class="flex flex-row gap-4">
      <VyPlaceholder class="size-24 shrink-0" />
      <VyPlaceholder class="h-24 flex-1" />
    </view>

    <VyPlaceholder class="h-48 w-full rounded-xl" />
  </view>
</template>
```

### Square or fixed-ratio regions

The hatch scales with the element, so the same component can represent media, cards, or compact controls.

```vue
<template>
  <view class="flex flex-row items-start gap-3">
    <VyPlaceholder class="size-16 rounded-full" />
    <VyPlaceholder class="aspect-square flex-1" />
  </view>
</template>
```

## Features and behavior

- The component renders one empty Lynx `view`.
- Width and height are controlled entirely through `class` and the surrounding layout.
- The default theme supplies the border, radius, clipping, and neutral surface.
- A repeating linear gradient is applied as an inline style and scales without a rasterized SVG.
- The component has no loading state, animation, content slot, or interaction behavior.
- Unlike `VySkeleton`, it represents an intentional layout stub rather than content that is currently loading.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `class` | `any` | `undefined` | Classes merged with the root theme. Use this to set dimensions, shape, margin, and local colors. |

## Emits

This component does not emit events.

## Slots

This component does not expose slots. It always renders an empty panel.

## Styling and theming

Override the global Tailwind Variants configuration through `appConfig.ui.placeholder`, or use `class` for a single instance.

| Theme part | Default | Purpose |
| --- | --- | --- |
| `base` | `relative overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50` | Root positioning, clipping, radius, dashed border, and surface color. |

`VyPlaceholder` has no `ui` prop and no variants. Local classes are merged after the global theme.

The diagonal hatch is a fixed inline `backgroundImage`, not a theme slot. Theme and instance classes can change the background color beneath it, but they do not remove or replace the hatch. Wrap the component or use a different primitive when a custom pattern is required.

The base theme intentionally does not include `w-full`. This lets margins and flex sizing work without making the panel overflow its parent. Add `w-full` explicitly when the surrounding layout does not stretch the component.

## Accessibility

The placeholder is decorative and contains no meaningful content or interaction. Do not use it as the only representation of information that users need to understand.

The component does not currently set an accessibility-hidden attribute. If it appears in a screen that is being tested with assistive technology, keep explanatory text outside the placeholder and verify that the empty native `view` is ignored on the target platform.

For actual loading interfaces, use `VySkeleton` and expose the loading state on the surrounding region rather than presenting `VyPlaceholder` as content.

## Platform notes

- The root is a native Lynx `view`.
- Empty views need explicit dimensions or layout constraints to be visible.
- The hatch uses `repeating-linear-gradient(135deg, …)` so it remains sharp as the panel grows.
- The inline background image takes precedence over class-based background images.
- `overflow-hidden` clips the hatch to custom rounded corners.
- The neutral border and surface colors resolve through the consuming app's Vy UI theme.

## Related components

- [`Skeleton`](/components/skeleton) for temporary loading placeholders.
- [`Aspect Ratio`](/components/aspect-ratio) for reserving a media region with a fixed ratio.
- `Card` for the final framed content container.
