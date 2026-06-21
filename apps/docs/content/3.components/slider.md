---
title: Slider
description: Select one value or a range by dragging along a track.
navigation:
  icon: i-lucide-sliders-horizontal
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Slider.vue
    target: _blank
---

## Overview

`VySlider` is a themed wrapper around the `@vyui/core` slider primitives. It supports a single numeric value or multiple thumbs, horizontal and vertical tracks, step snapping, minimum thumb spacing, inversion, semantic colors, and controlled or uncontrolled state.

::component-playground{name="slider"}
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySlider } from '@vyui/kit'

const volume = ref(40)
</script>

<template>
  <VySlider v-model="volume" :min="0" :max="100" />
</template>
```

The shape of the bound value is preserved: a number emits a number, while an array emits an array.

### Range

Use an array to render one thumb per value.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySlider } from '@vyui/kit'

const price = ref([20, 80])
</script>

<template>
  <VySlider
    v-model="price"
    :min="0"
    :max="100"
    :step="5"
    :min-steps-between-thumbs="2"
    color="success"
  />
</template>
```

`minStepsBetweenThumbs` is measured in steps. With `step="5"` and `minStepsBetweenThumbs="2"`, adjacent thumbs remain at least 10 units apart.

### Vertical

A vertical slider needs an explicit height from its parent or `class`.

```vue
<template>
  <VySlider
    :default-value="60"
    orientation="vertical"
    class="h-48"
  />
</template>
```

## Features and behavior

- `modelValue` controls the slider; `defaultValue` initializes uncontrolled state.
- A number creates one thumb. An array creates one thumb for every entry.
- Values are clamped to `min` and `max`, snapped to `step`, and kept in ascending order.
- `inverted` reverses the visual value direction. A normal vertical slider runs from minimum at the bottom to maximum at the top.
- Tapping or dragging the track moves the closest thumb.
- `disabled` prevents interaction and dims the root.
- The kit wrapper does not expose the core slider's `valueCommit` event.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number \| number[]` | `undefined` | Controlled value used by `v-model`; its number or array shape is preserved. |
| `defaultValue` | `number \| number[]` | Core default `[0]` | Initial value when uncontrolled. |
| `min` | `number` | `0` | Minimum permitted value. |
| `max` | `number` | `100` | Maximum permitted value. |
| `step` | `number` | `1` | Increment used when snapping values. |
| `disabled` | `boolean` | `false` | Prevents user interaction. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Track and drag direction. |
| `inverted` | `boolean` | `false` | Reverses the visual value direction. |
| `minStepsBetweenThumbs` | `number` | `0` | Minimum step count allowed between adjacent thumbs. |
| `color` | `Color` | `'primary'` | Semantic range and thumb-border color. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Thumb size and track thickness. |
| `name` | `string` | `undefined` | Name forwarded to the core form control. |
| `class` | `any` | `undefined` | Classes merged onto the slider root. |
| `ui` | `Partial<Record<SliderSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `number \| number[]` | Emitted when the value changes, preserving the input shape. |

## Slots

This kit component does not expose slots. Use the `ui` prop to customize its rendered parts, or compose the headless slider primitives from `@vyui/core` when custom markup is required.

## Styling and theming

Override globally through `appConfig.ui.slider` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Orientation, dimensions, disabled opacity, and outer layout. |
| `track` | Unfilled rounded track. |
| `range` | Filled section between the start and active thumb values. |
| `thumb` | Draggable circular handle. |

The `color` variant colors the range and thumb border. The `size` variant changes the thumb from 16px to 24px and adjusts track thickness. Orientation switches the root and range axes.

## Accessibility

Each core thumb is an adjustable accessibility element and announces its current value as “value of maximum.” A two-thumb slider labels its thumbs “Minimum” and “Maximum”; larger ranges use numbered value labels. Pair the slider with nearby visible text that explains what the value controls, and show the current value separately when users need exact feedback.

The kit wrapper does not currently expose per-thumb slots or a direct per-thumb accessibility-label API. Use the `@vyui/core` primitives when each thumb requires a custom accessible name.

## Platform notes

- Dragging uses Lynx touch events rather than DOM pointer events.
- The core control uses a main-thread drag path by default for smooth native movement. The bound value is synchronized when the gesture commits rather than on every painted frame.
- Thumb positions use concrete inline transforms because Lynx native does not resolve inline CSS custom properties reliably.
- Vertical sliders require a constrained height; horizontal sliders fill the available width by default.

## Related components

- `Progress` for displaying a non-interactive value.
- `NumberField` for precise typed increments.
- The `@vyui/core` slider primitives for custom tracks, ranges, and thumbs.
