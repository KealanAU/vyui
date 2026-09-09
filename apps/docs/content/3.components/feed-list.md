---
title: Feed List
description: Virtualized native list with pull-to-refresh, load-more, and snap paging.
navigation:
  icon: i-lucide-list
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/FeedList.vue
    target: _blank
category: Gestures & Lists
---

## Overview

`VyFeedList` renders a Lynx native `<list>` through the `@vyui/core` `FeedList` primitive: rows are virtualized by the platform, and the primitive adds a rubber-band pull-to-refresh, load-more on scroll-to-lower, and optional snap paging. The kit wrapper only adds the base sizing class, so the look of a feed comes from the `item` slot.

## Usage

Give each item a stable key field and render a row in the `item` slot.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyFeedList } from '@vyui/kit/feed-list'

const posts = ref([{ id: '1', title: 'First' }, { id: '2', title: 'Second' }])
const refreshing = ref(false)

async function onRefresh() {
  refreshing.value = true
  posts.value = await fetchPosts()
  refreshing.value = false
}
</script>

<template>
  <view style="height: 640px">
    <VyFeedList
      v-model:refreshing="refreshing"
      :items="posts"
      item-key-field="id"
      enable-refresh
      @refresh="onRefresh"
    >
      <template #item="{ item }">
        <view class="p-4 border-b border-default">
          <text class="text-highlighted">{{ item.title }}</text>
        </view>
      </template>
    </VyFeedList>
  </view>
</template>
```

The list must sit in a box with a definite height. A native `<list>` inside a `flex-1 min-h-0` parent measures `0px` and renders nothing — measure the container and pass pixels.

### Pull to refresh

`enableRefresh` turns on the gesture; `refresh` fires once when the pull passes `refreshThreshold` and the finger lifts. Bind `v-model:refreshing` so the spinner clears when the fetch resolves, and use the `refreshHeader` slot to draw the pull state yourself.

```vue
<template>
  <VyFeedList v-model:refreshing="refreshing" :items="posts" enable-refresh @refresh="onRefresh">
    <template #refreshHeader="{ state, progress }">
      <view class="h-16 items-center justify-center">
        <text class="text-muted">
          {{ state === 'refreshing' ? 'Refreshing…' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh' }}
        </text>
      </view>
    </template>
    <template #item="{ item }">…</template>
  </VyFeedList>
</template>
```

`state` moves through `idle`, `pulling`, `releaseReady`, `refreshing`, and `done`; `progress` is the pull distance as a fraction of the threshold.

### Load more

`enableLoadMore` emits `loadMore` when scrolling comes within `loadMoreThresholdItemCount` rows of the bottom. Set `noMoreData` once the last page has arrived to stop it and show the `noMoreDataFooter` slot.

### Grids and paging

`listType: 'flow'` or `'waterfall'` with `spanCount` greater than 1 renders columns instead of rows. `itemSnap` snaps each item to a rest position after a scroll — `true` gives full-screen paging, and `snap` reports the settled index in `event.detail.position`.

## Features and behavior

- `itemKeyField` (default `'id'`) or `itemKey` must produce a stable, unique key per row. The native diff appends and removes by key but does not reorder, so replace keys when the data order changes rather than permuting them.
- `enableBounce` adds rubber-band overscroll at both edges, independent of refresh.
- `disabled` stops scrolling and refresh interactions.
- The `empty` slot replaces the list when `items` is empty.
- `bounces` is ignored while pull-to-refresh is on: the native bounce is forced off so the top-edge pull is not stolen from the gesture.
- The kit wrapper does not forward the core's `loadingMore` model, so the `loadMoreFooter` slot never renders through it. Use the core `FeedList` when a loading footer matters.

## API

### Props

::component-props{name="FeedList"}
::

### Emits

::component-emits{name="FeedList"}
::

### Slots

::component-slots{name="FeedList"}
::

## Platform notes

- Pull-to-refresh runs on `:main-thread-bindtouch*` worklets and only takes the gesture while pulling down from the top edge, so it does not fight native scrolling.
- Rows are virtualized by the platform. Keep row templates cheap; anything measured per row runs during scrolling.
- A shrinking `items` array needs a Vue-Lynx whose `<list>` bridge applies removals. Stock releases only append, which leaves ghost rows and a duplicate `item-key` crash on the next append.
- Desktop web has no synthesized touch, so the pull also binds mouse events; it engages only at the top edge and leaves ordinary wheel scrolling alone.

## Related components

- [`Scroll View`](/components/scroll-view) for non-virtualized scrolling with edge thresholds.
- [`Swiper`](/components/swiper) for paged horizontal content.
- [`Swipe Action`](/components/swipe-action) for per-row swipe controls.
