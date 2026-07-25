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

`VySwiper` is the styled carousel built on the `@vyui/core` `SwiperRoot` and `SwiperItem` primitives. Slides follow the finger natively, snap to the nearest page on release, and a quick flick advances even before the halfway point. It supports controlled index state, data-driven or manual slides, measured full-width pages, seamless looping, autoplay, axis locking, and opt-in indicator dots.

::component-code
---
name: swiper-example
height: 280px
---
::

::callout{icon="i-lucide-pointer"}
Works with touch and mouse: drag the slides in the preview above with a mouse, or swipe on device — both drive the same gesture.
::

::callout{icon="i-lucide-box"}
Styled on top of the `@vyui/core` Swiper primitives, whose gesture is a shared main-thread drag controller. Reach for [`SwiperRoot`](#built-on-vyuicore) directly when you need spacing, alignment, RTL, or custom thresholds.
::

## Usage

Bind the active index with `v-model`, pass an `items` array, and render each slide through the `item` slot.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwiper } from '@vyui/kit/swiper'

const current = ref(0)
const slides = [
  { title: 'Explore', description: 'Find something new.' },
  { title: 'Save', description: 'Keep favorites close.' },
  { title: 'Share', description: 'Send them to friends.' },
]
</script>

<template>
  <VySwiper v-model="current" :items="slides" show-indicators>
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

When `itemWidth` is omitted, the wrapper measures its container and makes each slide fill the available width (using `300px` until the first layout measurement arrives). Set `itemWidth` explicitly for fixed-width slides.

### Loop and autoplay

Set `loop` to navigate seamlessly across both ends — the edge slides are cloned so motion continues over the seam instead of rewinding. Set `autoplay` to `true` for the default `3000ms` interval, or pass an interval in milliseconds.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwiper } from '@vyui/kit/swiper'

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

Autoplay pauses while the user is dragging and resumes after the release settles. Without `loop`, autoplay stops advancing at the final slide.

### Manual slides

Omit `items` and place core `SwiperItem` children in the default slot. The wrapper derives the item count from the number of top-level slot nodes, so keep the slot to direct `SwiperItem` children.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SwiperItem } from '@vyui/core'
import { VySwiper } from '@vyui/kit/swiper'

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

### Indicators

Indicators are opt-in via `showIndicators` and appear when there is more than one slide. The active dot is derived from `modelValue`, so keep it bound. `size` scales the dots.

```vue
<VySwiper v-model="current" :items="slides" size="lg" show-indicators>
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

- `v-model` controls the zero-based active index; it updates after a completed swipe or autoplay step, and changing it programmatically animates the track to the new slide.
- Release snaps to the nearest page: a drag past `0.3` of the slide width advances, and a flick of at least `300px/s` advances one slide from where the drag started, even on a short drag.
- Non-looping swipers clamp at the first and last slide. Looping swipers clone the slide set on both sides of the track so seam crossings are continuous; in loop mode a programmatic index change takes the shortest path, including over the seam.
- `axisLock` classifies the gesture once it moves ~8px: within 45° of horizontal the swiper consumes it, otherwise the drag is released to the surrounding scroll surface. Use it whenever a swiper sits inside a vertical scroller.
- `itemWidth` sets the slide and snap width. When omitted, the measured wrapper width follows layout changes such as device rotation.
- `showIndicators` renders the dot strip as a fixed overlay outside the moving track.

::warning
`direction="vertical"` only moves the indicator strip to a vertical layout. Slides, track movement, and gesture recognition remain horizontal.
::

## API

These tables are generated directly from the component source.

### Props

::component-props{name="Swiper"}
::

### Emits

::component-emits{name="Swiper"}
::

The kit wrapper does not forward the core `swipeStart` / `swipeEnd` events — use `SwiperRoot` directly when you need drag lifecycle callbacks.

### Slots

::component-slots{name="Swiper"}
::

## Built on `@vyui/core`

`VySwiper` composes the headless `SwiperRoot` and `SwiperItem` primitives. Use them directly for the options the kit wrapper does not expose: item spacing (`spaceBetween`), viewport alignment (`align` / `containerWidth`), RTL, offset clamping (`offsetLimit`), custom snap thresholds and duration, `disabled`, and the drag lifecycle emits. `SwiperRoot` also exposes a `setIndex(index)` method (via template ref) that wraps or clamps and animates to a slide.

```vue
<SwiperRoot v-model="current" :item-width="300" :item-count="3" :space-between="12">
  <SwiperItem>...</SwiperItem>
  <SwiperItem>...</SwiperItem>
  <SwiperItem>...</SwiperItem>
  <template #overlay>
    <!-- fixed content that must not move with the track -->
  </template>
</SwiperRoot>
```

#### `SwiperRoot` props

::component-props{name="SwiperRoot"}
::

#### `SwiperRoot` emits

::component-emits{name="SwiperRoot"}
::

#### `SwiperItem` props

::component-props{name="SwiperItem"}
::

## Styling and theming

Override globally through `appConfig.ui.swiper` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Relative, full-width clipping wrapper. |
| `item` | Classes applied to each generated `SwiperItem`. |
| `indicators` | Fixed indicator strip positioned over the viewport. |
| `indicator` | Inactive indicator dot. |
| `indicatorActive` | Additional class applied to the active dot. |

The `direction` variant positions the indicator strip horizontally at the bottom or vertically at the right. The `size` variant (`sm` / `md` / `lg`) controls dot diameter and spacing. Defaults are `horizontal` and `md`.

## Accessibility

- The swiper does not add carousel, group, or live-region semantics, and the indicator dots are visual elements, not controls. There is no keyboard navigation — provide separate accessible controls when users must be able to move directly between slides, and avoid placing essential information only in an automatically advancing slide.
- Loop mode renders cloned copies of the slide slot that are not hidden from the accessibility tree. Test looped carousels with VoiceOver and TalkBack before using them for interactive content.

## Platform notes

- Drag tracking, velocity sampling, snapping, looping, and autoplay all run in Lynx main-thread worklets, so slides track the finger without a background-thread round trip.
- Touch and mouse are both wired: on-device swipes use touch events, while desktop browsers (Lynx web) drive the same worklets from mouse events — the live preview above works with a mouse. There is no keyboard support.
- The wrapper listens for Lynx `layoutchange` to update full-width slides after its container resizes.
- Avoid changing slide identity or count during a gesture, especially in loop mode where the slot is cloned.

## Related components

- [`SwipeAction`](/components/swipe-action) for revealing row actions with a horizontal gesture.
- [`Draggable`](/components/draggable) — the headless pan-gesture primitive family behind vyui's drag surfaces.
- `Tabs` for persistent, directly selectable peer views.
