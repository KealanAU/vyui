<script setup lang="ts">
// Bottom-sheet comments drawer. Opens when the user taps the comment count on
// any video card. Contains a VyFeedList of mock comments with load-more on
// scrolltolower — demonstrating the existing FeedList load-more API today.
//
// The N/total counter (loadedCount / totalCount) is lifted to the parent so
// it can also count video load-more events in the same badge.
//
// NOTE: `defineModel` is avoided here because the vue-lynx@0.4 runtime does
// not export `mergeModels` — combining defineModel with extra emits triggers
// the compiler to emit `_mergeModels(...)` which fails at link time. Use
// plain `defineProps` + `defineEmits` instead.

import { ref } from 'vue'
import { Icon as VyIcon } from '@vyui/core'
import { VyDrawer, VyFeedList } from '@vyui/kit'
import { SEED_COMMENTS, makeComments, COMMENTS_TOTAL, type Comment } from '../data/comments'
import LoadCounter from './LoadCounter.vue'
import Spinner from './Spinner.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  // Fired when the open state should change — parent owns the state.
  'update:open': [value: boolean]
  // Fired when a batch of comments loads — parent uses this to bump its
  // global loadedCount counter.
  commentsLoaded: [count: number]
}>()

function onOpenChange(value: boolean) {
  emit('update:open', value)
}

const comments = ref<Comment[]>([...SEED_COMMENTS])
const loadingMore = ref(false)
const allLoaded = ref(false)

// N/total for comments — local to this drawer. `commentsTotal` is the ceiling
// the repeated load-more batches climb toward, so the badge reads e.g. 5/45.
const commentsLoaded = ref(SEED_COMMENTS.length)
const commentsTotal = ref(COMMENTS_TOTAL)
const BATCH = 8

// A native Lynx `<list>` renders nothing unless its parent has an explicit
// height (flex-1 alone leaves it 0px — that's why the comments looked empty).
// Pin the list to a screen-height fraction so it shows rows and scrolls
// internally. Sized to fit the 0.9 snap; clips gracefully at 0.6.
const screenH = (() => {
  const sys = (globalThis as { SystemInfo?: { pixelHeight?: number, pixelRatio?: number } }).SystemInfo
  if (sys?.pixelHeight && sys?.pixelRatio) return Math.round(sys.pixelHeight / sys.pixelRatio)
  return 812
})()
const listHeight = Math.round(screenH * 0.62)

// Each scroll-to-bottom appends another batch until the ceiling is hit — this
// is the demo's main "load on scroll down" behaviour. Unlike a single second
// page, scrolling keeps pulling more rows in, which is what we want to show.
function onLoadMore() {
  if (loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  // Forced ~1.5s delay so the spinner is actually visible on every fetch.
  setTimeout(() => {
    const remaining = COMMENTS_TOTAL - comments.value.length
    const next = makeComments(comments.value.length, Math.min(BATCH, remaining))
    comments.value = [...comments.value, ...next]
    commentsLoaded.value = comments.value.length
    allLoaded.value = comments.value.length >= COMMENTS_TOTAL
    loadingMore.value = false
    // Notify parent so the global N/total badge updates.
    emit('commentsLoaded', next.length)
  }, 1500)
}
</script>

<template>
  <!-- open via :open + @update:open; no trigger slot needed — parent controls
       open state by watching the comment-button tap in VideoCard. SheetTrigger
       wraps whatever is in the default slot; an empty view is fine and does
       not add layout. -->
  <VyDrawer
    :open="props.open"
    :snap-points="[0.6, 0.9]"
    :default-snap-index="1"
    title="Comments"
    @update:open="onOpenChange"
  >
    <!-- Empty trigger — parent opens the drawer programmatically. -->
    <view />

    <template #body>
      <view class="flex flex-col h-full">
        <!-- Counter shows how many of the total comments have loaded. -->
        <view class="flex flex-row justify-end px-4 pb-2">
          <LoadCounter :loaded="commentsLoaded" :total="commentsTotal" label="comments" />
        </view>

        <!-- Comments list with load-more on scroll-to-lower. Wrapped in an
             explicit-height view (the native <list> needs a definite height —
             the kit-demo FeedList does the same) so rows actually render. -->
        <view :style="{ height: `${listHeight}px` }">
        <VyFeedList
          :items="comments"
          item-key-field="id"
          :enable-load-more="!allLoaded"
          :load-more-threshold-item-count="2"
          class="w-full h-full"
          @load-more="onLoadMore"
        >
          <template #item="{ item }">
            <view class="flex flex-row items-start gap-3 px-4 py-3 border-b border-slate-100">
              <!-- Avatar circle — initials from username. -->
              <view class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <text class="text-slate-600 text-xs font-semibold">
                  {{ item.author.slice(1, 3).toUpperCase() }}
                </text>
              </view>
              <view class="flex flex-col flex-1 gap-0.5">
                <view class="flex flex-row items-center gap-2">
                  <text class="text-slate-800 text-sm font-semibold">{{ item.author }}</text>
                  <text class="text-slate-400 text-xs">{{ item.time }}</text>
                </view>
                <text class="text-slate-700 text-sm">{{ item.text }}</text>
                <view class="flex flex-row items-center gap-1 mt-1">
                  <VyIcon name="icon-park-solid:like" :size="12" color="#94a3b8" />
                  <text class="text-slate-400 text-xs">{{ item.likes }}</text>
                </view>
              </view>
            </view>
          </template>
        </VyFeedList>
        </view>

        <!-- Sentinel footer row shown while loading or when all comments have
             loaded. FeedList's loadMoreFooter/noMoreDataFooter slots are not in
             the current kit interface so we use a plain view beneath the list. -->
        <view v-if="loadingMore" class="py-4 flex flex-row items-center justify-center gap-2">
          <Spinner :size="18" color="#94a3b8" />
          <text class="text-slate-400 text-sm">Loading more comments…</text>
        </view>
        <view v-else-if="allLoaded" class="py-4 flex items-center justify-center">
          <text class="text-slate-400 text-sm">No more comments</text>
        </view>
      </view>
    </template>
  </VyDrawer>
</template>
