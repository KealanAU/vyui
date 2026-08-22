---
title: Scroll View
description: Headless scroll container primitive with edge thresholds and an optional main-thread bounce/overscroll system.
navigation:
  icon: i-lucide-scroll
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/ScrollView
    target: _blank
category: Layout
---

## Overview

`ScrollView` is a headless `@vyui/core` scroll container. By default it is a thin wrapper that forwards native scrolling and edge-threshold events; opt into `enableBounces` for a custom main-thread bounce/overscroll system with parity to `lynx-ui`.

::callout{icon="i-lucide-box"}
This is a vyui-original `@vyui/core` primitive (adapted from `lynx-ui`, Apache 2.0). Behavior only, no styles.
::

## Usage

```vue
<script setup lang="ts">
import { ScrollView } from '@vyui/core'

function onLower() {
  // load more
}
</script>

<template>
  <ScrollView
    scroll-orientation="vertical"
    :lower-threshold="80"
    @scroll-to-lower="onLower"
  >
    <view
      v-for="n in 50"
      :key="n"
      class="p-4"
    >
      <text>Row {{ n }}</text>
    </view>
  </ScrollView>
</template>
```

## Features and behavior

- `scrollOrientation` chooses `'vertical'` (default) or `'horizontal'`.
- `upperThreshold` / `lowerThreshold` set the distance from each edge that fires `scrollToUpper` / `scrollToLower`, which is useful for infinite loading.
- `bounces` forwards the native bounce (iOS / Harmony / PC); `scrollBarEnable` shows the native scroll bar.
- `enableBounces` turns on the custom main-thread bounce. Then `startBounceTriggerDistance` / `endBounceTriggerDistance`, `alwaysBouncing`, and the bounce edges control overscroll, emitting `scrollToBounces`.
- `id` is required by the bounce system to select the container on the main thread; it is auto-generated when omitted.

## API

### Props

::component-props{name="ScrollView"}
::

### Emits

::component-emits{name="ScrollView"}
::

## Platform notes

- The custom bounce runs through main-thread (MTS) worklets; without `enableBounces` the component is a thin pass-through to native scrolling.

## Related components

- [`FeedList`](/components/feedlist) gives virtualized lists with pull-to-refresh built on the scroll/gesture layer.
- [`Swiper`](/components/swiper) does paged horizontal scrolling.
