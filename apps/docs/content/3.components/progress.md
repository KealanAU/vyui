---
title: Progress
description: Show determinate, indeterminate, or stepped task progress.
navigation:
  icon: i-lucide-chart-no-axes-column-increasing
package: kit
links:
  - label: Kit source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Progress.vue
    target: _blank
  - label: Core primitives
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/tree/main/packages/core/src/components/Progress
    target: _blank
---

## Overview

`VyProgress` displays determinate or indeterminate completion as a themed bar. It supports horizontal and vertical layouts, semantic colors, six sizes, percentage status text, reversed direction, animated indeterminate states, and an array-based stepped mode.

::component-playground{name="progress"}
::

## Usage

Bind a numeric value with `v-model` and set the maximum value.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyProgress } from '@vyui/kit'

const uploaded = ref(68)
</script>

<template>
  <VyProgress v-model="uploaded" :max="100" />
</template>
```

Progress is a display component rather than an input. The binding is useful when application state changes the value; users do not directly edit it.

### Status

Set `status` to show the rounded percentage above the bar.

```vue
<template>
  <VyProgress
    :model-value="42"
    :max="60"
    status
    color="success"
  />
</template>
```

Use the `status` slot to replace the default percentage text.

```vue
<template>
  <VyProgress :model-value="3" :max="8">
    <template #status="{ percent }">
      <text>{{ percent }}% · 3 of 8 files</text>
    </template>
  </VyProgress>
</template>
```

### Indeterminate

Omit `modelValue`, or set it to `null`, when the amount of work is unknown.

```vue
<template>
  <VyProgress color="info" animation="swing" />
</template>
```

The status and step labels are hidden while progress is indeterminate.

### Steps

Pass an array to `max` to use its entries as step labels. The numeric value becomes the active zero-based step index, and the effective maximum is `max.length - 1`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyProgress } from '@vyui/kit'

const step = ref(1)
const steps = ['Details', 'Review', 'Payment', 'Complete']
</script>

<template>
  <VyProgress
    v-model="step"
    :max="steps"
    color="primary"
    status
  >
    <template #step-1="{ step: label }">
      <text>Current: {{ label }}</text>
    </template>
  </VyProgress>
</template>
```

Each entry has a named `step-N` slot. By default, only the active step label is visible.

### Vertical and inverted

A vertical progress bar needs an explicit height. `inverted` reverses the direction in either orientation.

```vue
<template>
  <view class="h-48">
    <VyProgress
      :model-value="65"
      orientation="vertical"
      inverted
      size="lg"
      color="warning"
      status
    />
  </view>
</template>
```

## Features and behavior

- A number renders determinate progress; `null` or `undefined` renders the indeterminate state.
- Numeric `max` defaults to `100` in the core primitive.
- An array `max` enables step labels and uses `array.length - 1` as the numeric maximum.
- The displayed percentage is rounded to the nearest whole number and visually clamped from `0%` to `100%`.
- The core primitive validates determinate values. Values below `0`, above `max`, or otherwise invalid are corrected to `null`, producing an indeterminate state.
- `inverted` reverses the indicator translation and status alignment.
- Horizontal progress fills the available width. Vertical progress fills the available height supplied by its parent.
- The indicator exposes `data-state="indeterminate"`, `"loading"`, or `"complete"` through the core primitive.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number \| null` | `null` | Current value. `null` or omission selects the indeterminate state. |
| `max` | `number \| any[]` | Effective `100` | Maximum numeric value, or step labels whose last index becomes the maximum. |
| `status` | `boolean` | `false` | Shows the rounded percentage status for determinate progress. |
| `inverted` | `boolean` | `false` | Reverses the visual fill direction and status alignment. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Bar thickness and status or step text size. |
| `color` | `Color` | `'primary'` | Semantic indicator and step-label color. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Bar and status layout direction. |
| `animation` | `'carousel' \| 'carousel-inverse' \| 'swing' \| 'elastic'` | `'carousel'` | Animation used only for indeterminate progress. |
| `class` | `any` | `undefined` | Classes merged onto the outer root. |
| `ui` | `Partial<Record<ProgressSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `number \| null` | Forwards a corrected value from the core progress primitive. |

The component does not emit ordinary user interaction updates because it is non-interactive.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `status` | `{ percent?: number }` | Replaces the percentage status. Rendered only for determinate progress. |
| `step-N` | `{ step: any }` | Replaces the label for the step at zero-based index `N`. |

## Styling and theming

Override globally through `appConfig.ui.progress` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Outer orientation and spacing layout. |
| `base` | Clipped neutral track. |
| `indicator` | Colored filling or animated bar. |
| `status` | Percentage or custom status wrapper. |
| `steps` | Overlaid step-label grid. |
| `step` | Individual active or hidden step label. |

The theme combines `color`, `size`, `orientation`, `inverted`, `animation`, and an internal step state. Horizontal sizes range from `2px` to `20px`; vertical sizes use the same values as widths. Semantic color affects the indicator and step labels, while the track remains neutral.

Indeterminate animation utilities reference `carousel`, `carousel-vertical`, `carousel-inverse`, `carousel-inverse-vertical`, `swing`, `swing-vertical`, `elastic`, and `elastic-vertical` keyframes. The consuming app must provide the corresponding keyframes for animations it uses.

## Accessibility

The core root is exposed as a native progress bar with the Lynx `updating` trait. Determinate values are announced as a rounded percentage of the maximum, such as “50%.” Indeterminate progress has no numeric accessibility value.

Place a visible label near the component so users know which task is progressing. The kit wrapper does not currently expose the core `getValueLabel` or `getValueText` callbacks; use `ProgressRoot` and `ProgressIndicator` from `@vyui/core` when the announced value must use application-specific wording such as “3 files.”

Do not rely on color alone to communicate completion, failure, or another task state. Pair the bar with text when that distinction matters.

## Platform notes

- The kit provides a bar only. Circular progress based on inline SVG is not supported by Lynx native.
- Determinate fill is painted with a concrete `translateX` or `translateY` transform for consistent Lynx rendering.
- Lynx does not support `fit-content` for the status dimension, so the indeterminate fallback uses intrinsic `auto` sizing.
- Vertical layout requires a constrained parent height.
- Indeterminate motion depends on keyframes supplied by the consuming app; without them, the component remains visually indeterminate but static.

## Related components

- [`Slider`](/components/slider) for a value users can change.
- `Stepper` for navigating an ordered sequence of interactive steps.
- `Skeleton` for placeholder content while its final shape is loading.
- The `@vyui/core` progress primitives for custom markup and accessible value text.
