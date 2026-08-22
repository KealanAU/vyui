---
title: Rating
description: Capture an integer score with a row of tappable icons.
navigation:
  icon: i-lucide-star
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Rating.vue
    target: _blank
category: Form
---

## Overview

`VyRating` is a styled integer rating control built on the `@vyui/core` rating primitives. It supports a configurable item count, semantic active color, four sizes, a custom Iconify glyph, disabled state, and controlled state through `v-model`.

::component-code
---
name: rating-example
height: 140px
---
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyRating } from '@vyui/kit/rating'

const rating = ref(3)
</script>

<template>
  <VyRating v-model="rating" />
</template>
```

The bound value is a number from `0` through `count`. A value of `0` leaves every item inactive.

### Item count

Use `count` to change the number of rendered choices.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyRating } from '@vyui/kit/rating'

const difficulty = ref(2)
</script>

<template>
  <view class="gap-2">
    <text class="text-sm font-medium text-neutral-900">
      Difficulty: {{ difficulty }} of 3
    </text>
    <VyRating v-model="difficulty" :count="3" />
  </view>
</template>
```

Keep the model within the new range when changing `count` dynamically. The component does not clamp an existing value when the count decreases.

### Color and size

Use a semantic `color` and one of four sizes to fit the surrounding interface.

```vue
<VyRating
  v-model="rating"
  color="success"
  size="lg"
/>
```

The default active color is `warning`; inactive icons use the neutral theme color.

### Custom icon

Set `icon` to any Iconify name. The icon changes for every rating item.

```vue
<VyRating
  v-model="satisfaction"
  icon="i-lucide-heart"
  color="error"
  size="xl"
/>
```

When `icon` is omitted, the component resolves `appConfig.ui.icons.star` and then falls back to `i-lucide-star`.

### Disabled

Use `disabled` for a read-only score display that keeps the same visual treatment.

```vue
<view class="flex flex-row items-center gap-2">
  <VyRating :model-value="4" disabled />
  <text class="text-sm text-neutral-500">4 out of 5</text>
</view>
```

A disabled rating blocks taps and dims each item.

### Local theme overrides

Use `ui` to customize the root, item wrapper, or icon.

```vue
<VyRating
  v-model="rating"
  :ui="{
    root: 'gap-2',
    icon: 'text-neutral-200 ui-active:text-secondary-500'
  }"
/>
```

## Features and behavior

- `v-model` controls the selected integer value and defaults to `0`.
- The component renders `count` items numbered from `1` through `count`; tapping an item emits that number.
- Every item at or below the selected value receives active styling.
- Tapping the current value again does not clear it.
- `disabled` prevents updates and applies reduced opacity to each item wrapper.
- `icon` is resolved once and used for every item.
- The kit wrapper fixes the core rating granularity to whole items and lays them out horizontally.
- Fractional steps, uncontrolled `defaultValue`, clear-on-repeat, hover previews, and vertical orientation are available only through the lower-level `@vyui/core` rating primitives.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | Controlled integer score used by `v-model`. |
| `count` | `number` | `5` | Number of rating items rendered. |
| `disabled` | `boolean` | `false` | Prevents interaction and dims the items. |
| `color` | `Color` | `'warning'` | Semantic color applied to active icons. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Icon dimensions. |
| `icon` | `string` | App star icon / `i-lucide-star` | Iconify name rendered for every item. |
| `class` | `any` | `undefined` | Classes merged onto the rating root. |
| `ui` | `Partial<Record<RatingSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

`count` is passed directly to the render loop and core `length` prop. Use a positive integer; the kit component does not validate or normalize invalid counts.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `number` | Emitted with the tapped item's one-based value. |

## Slots

This kit component does not expose slots. Use `icon` and `ui` for visual customization, or compose `RatingRoot`, `RatingItem`, and `RatingItemIndicator` from `@vyui/core` when custom item markup or fractional steps are required.

## Styling and theming

Override globally through `appConfig.ui.rating` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Horizontal rating layout and spacing. The `class` prop is also merged here. |
| `base` | Wrapper around one rating item, including disabled opacity. |
| `icon` | Shared inactive color, active color, and dimensions of every glyph. |

### Theme variants

| Variant | Values | Default | Effect |
| --- | --- | --- | --- |
| `color` | Registered semantic colors | `'warning'` | Colors icons whose core indicator has `data-state="active"`. |
| `size` | `sm`, `md`, `lg`, `xl` | `'md'` | Sets icon size from 20px through 32px. |
| `disabled` | `true`, `false` | From `disabled` | Reduces item opacity and applies a non-interactive cursor class. |

The default root is a horizontal flex row with a small gap. Icons start at `text-neutral-300`; the active state uses the selected semantic color at shade `500`.

## Accessibility

Each core rating indicator is exposed as an accessibility element with option semantics mapped to a native button trait. It announces `selected` or `unselected`, and disabled indicators receive the disabled trait.

The kit wrapper does not currently assign an accessible name to the individual icon controls and does not forward arbitrary attributes or per-item accessibility labels. Nearby visible text such as “Rate this product” does not automatically label those controls. Treat this as a current accessibility limitation: test with VoiceOver and TalkBack, and use the `@vyui/core` primitives when each choice must announce a label such as “3 out of 5 stars.”

Do not rely on color alone when displaying an existing score. Pair the rating with visible numeric text when the exact value matters.

## Platform notes

- The component uses Lynx `view` nodes and native `tap` events rather than DOM radio inputs or buttons.
- Active styling is driven by the core indicator's `data-state="active"` and `ui-active` markers.
- The kit wrapper renders one indicator per item, so fractional and partial-fill ratings require direct use of the core primitives.
- The default theme uses vyui's semantic tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)), and does not include DOM hover or focus-ring styles.
- A rating is not a native form input and does not submit a value by itself.

## Related components

- [`Radio Group`](/components/radio-group) for a single choice with visible labels and descriptions.
- [`Slider`](/components/slider) for selecting a value from a larger numeric range.
- `Icon` for rendering a non-interactive score display.
