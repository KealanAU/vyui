---
title: Swiper
description: Present swipeable, snapping content as a paged carousel.
navigation:
  icon: i-lucide-gallery-horizontal-end
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Swiper.vue
    target: _blank
---

## Overview

`VySwiper` is the styled carousel wrapper around the `@vyui/core` `SwiperRoot` and `SwiperItem` primitives. It supports controlled index state, data-driven or manual slides, measured full-width pages, seamless looping, autoplay, horizontal gesture locking, and optional indicators.

::component-code
---
name: swiper-example
height: 280px
---
::

::callout{icon="i-lucide-pointer" color="warning"}
Swipe gestures aren't wired up in the web preview yet, so the slides won't drag here — view this on a device or in Lynx Explorer for the real interaction. The code below runs as-is on iOS and Android.
::

## Usage

Pass an `items` array and render each slide through the `item` slot.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwiper } from '@vyui/kit'

const current = ref(0)
const slides = [
  { title: 'Explore', description: 'Find something new.' },
  { title: 'Save', description: 'Keep favorites close.' },
  { title: 'Share', description: 'Send them to friends.' },
]
</script>

<template>
  <VySwiper
    v-model="current"
    :items="slides"
    show-indicators
  >
    <template #item="{ item, index }">
      <view class="h-48 p-6 bg-neutral-100">
        <text class="text-xl font-semibold">{{ item.title }}</text>
        <text class="mt-2 text-neutral-600">{{ item.description }}</text>
        <text class="mt-4 text-sm text-neutral-500">Slide {{ index + 1 }}</text>
      </view>
    </template>
  </VySwiper>
</template>
```

When `itemWidth` is omitted, the wrapper measures its container and makes each slide fill the available width. It uses `300px` until a positive layout measurement is available.

### Loop and autoplay

Set `loop` to navigate seamlessly across both ends. Set `autoplay` to `true` for the core `3000ms` interval, or pass an interval in milliseconds.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwiper } from '@vyui/kit'

const current = ref(0)
const promotions = [
  { label: 'Free delivery', color: 'bg-primary-100' },
  { label: 'Member pricing', color: 'bg-success-100' },
  { label: 'New arrivals', color: 'bg-warning-100' },
]
</script>

<template>
  <VySwiper
    v-model="current"
    :items="promotions"
    :autoplay="5000"
    loop
    axis-lock
    show-indicators
  >
    <template #item="{ item }">
      <view :class="['h-40 items-center justify-center', item.color]">
        <text class="text-xl font-semibold">{{ item.label }}</text>
      </view>
    </template>
  </VySwiper>
</template>
```

Autoplay pauses during a drag. Without `loop`, it stops advancing at the final slide.

### Manual slides

Omit `items` and place core `SwiperItem` children in the default slot. The wrapper derives `itemCount` from the number of rendered top-level slot nodes.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SwiperItem } from '@vyui/core'
import { VySwiper } from '@vyui/kit'

const current = ref(0)
</script>

<template>
  <VySwiper v-model="current" :item-width="320">
    <SwiperItem>
      <view class="h-40 p-5 bg-primary-100"><text>First slide</text></view>
    </SwiperItem>
    <SwiperItem>
      <view class="h-40 p-5 bg-secondary-100"><text>Second slide</text></view>
    </SwiperItem>
  </VySwiper>
</template>
```

Prefer direct top-level `SwiperItem` children. Fragments or unrelated top-level nodes are also counted and can make the wrapper's derived item count inaccurate.

### Indicator size

Use `size` to change the indicator dots. Indicators are opt-in.

```vue
<VySwiper
  v-model="current"
  :items="slides"
  size="lg"
  show-indicators
>
  <template #item="{ item }">
    <view class="h-48 p-6">
      <text>{{ item.title }}</text>
    </view>
  </template>
</VySwiper>
```

### Custom styles

Use `class` for the root or `ui` for individual theme slots.

```vue
<VySwiper
  v-model="current"
  :items="slides"
  show-indicators
  class="rounded-2xl"
  :ui="{
    item: 'rounded-2xl',
    indicators: 'bottom-4',
    indicator: 'bg-neutral-400',
    indicatorActive: 'bg-error-500',
  }"
>
  <template #item="{ item }">
    <view class="h-48 p-6 bg-neutral-100">
      <text>{{ item.title }}</text>
    </view>
  </template>
</VySwiper>
```

## Features and behavior

- `v-model` controls the zero-based active index and receives updates after a completed swipe or autoplay step.
- With `items`, one core `SwiperItem` is created per entry. Without `items`, the default slot must supply the slides.
- Non-looping swipers clamp at the first and last item. Looping swipers render leading and trailing clone sets for continuous seam-crossing motion.
- `axisLock` waits for a predominantly horizontal gesture and yields a vertical drag to the surrounding scroll surface.
- `itemWidth` sets the slide and snap width. When omitted, the measured wrapper width follows layout changes such as device rotation.
- `showIndicators` renders fixed overlay dots outside the moving track when there is more than one item.
- Keep `modelValue` bound when showing indicators. The active dot is derived from that prop.

### Gesture behavior

The kit wrapper uses the core defaults for gesture physics:

| Behavior | Core value | Result |
| --- | --- | --- |
| Position threshold | `0.3` of one snap unit | A sufficiently long drag advances to the adjacent item. |
| Velocity threshold | `300px/s` | A quick flick advances even before the position threshold. |
| Snap duration | `300ms` | Release and programmatic index changes animate to rest. |
| Axis cone | Within `45°` of horizontal | Used only when `axisLock` is enabled. |
| Autoplay interval | `3000ms` | Used when `autoplay` is `true`. |

The snap unit is `itemWidth` in `VySwiper`. The core primitive also supports spacing, alignment, offset limits, RTL, custom thresholds, and programmatic `setIndex`, but the current kit wrapper does not expose those options.

::warning
`direction="vertical"` only moves the indicator strip to a vertical layout. Slides, track movement, and gesture recognition remain horizontal.
::

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` internally | Controlled zero-based active index used by `v-model`. |
| `items` | `any[]` | `undefined` | Data rendered as one slide per entry through the `item` slot. |
| `itemWidth` | `number` | Measured width / `300` | Width of each slide and snap unit in pixels. |
| `loop` | `boolean` | `false` | Enables circular navigation with seamless cloned edges. |
| `autoplay` | `boolean \| number` | `false` | Enables autoplay; a number sets the interval in milliseconds. |
| `axisLock` | `boolean` | `false` | Consumes only predominantly horizontal gestures. |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Indicator layout direction; it does not change the swipe axis. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Indicator gap and dot size. |
| `showIndicators` | `boolean` | `false` | Shows the fixed indicator overlay when more than one slide exists. |
| `class` | `any` | `undefined` | Classes merged onto the root slot. |
| `ui` | `Partial<Record<SwiperSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `number` | Active index changed after swipe, autoplay, or an underlying state update. |

The kit wrapper does not forward the core `swipeStart` or `swipeEnd` events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `item` | `{ item: any, index: number }` | Renders each entry when `items` is provided. |
| `default` | — | Manual slide content when `items` is omitted; normally direct `SwiperItem` children. |

## Styling and theming

Override globally through `appConfig.ui.swiper` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Relative, full-width clipping wrapper. |
| `item` | Classes applied to each generated `SwiperItem`. |
| `indicators` | Fixed indicator strip positioned over the viewport. |
| `indicator` | Inactive indicator dot. |
| `indicatorActive` | Additional class applied to the active dot. |

The `direction` variant positions the indicator strip horizontally at the bottom or vertically at the right. The `size` variant controls dot diameter and spacing. Defaults are `horizontal` and `md`.

## Accessibility

`VySwiper` does not currently add carousel, group, slide, or live-region semantics. The indicator dots are visual `view` elements, not controls, and the component has no keyboard navigation. Give each slide meaningful accessible content, avoid placing essential information only in an automatically changing slide, and provide separate native controls when users must be able to move directly between slides.

Loop mode renders two cloned copies of the slide slot around the real slides. Those clones are not hidden from the accessibility tree by the current primitive, so test looped carousels with VoiceOver and TalkBack before using them for complex interactive content.

## Platform notes

- Drag tracking, velocity, snapping, looping, and autoplay run through Lynx main-thread worklets for responsive native gestures.
- Use `axisLock` when a swiper sits inside a vertical list so vertical intent can remain with the parent scroller.
- The wrapper listens for Lynx `layoutchange` to update full-width slides after its container changes size.
- The implementation is horizontal-only today. Web carousel expectations such as arrow-key navigation, hover pause, and ARIA carousel roles are not built in.
- Avoid rapidly changing slide identity or count during a gesture, especially in loop mode where the slot is cloned.

## Related components

- [`SwipeAction`](/components/swipe-action) for revealing row actions with a horizontal gesture.
- `Tabs` for persistent, directly selectable peer views.
- `Stepper` for an explicit multi-step flow.
