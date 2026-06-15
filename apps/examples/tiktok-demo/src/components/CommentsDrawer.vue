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
import { VyDrawer, VyFeedList } from '@vyui/kit'
import { SEED_COMMENTS, LOAD_MORE_COMMENTS, type Comment } from '../data/comments'
import LoadCounter from './LoadCounter.vue'

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

// N/total for comments specifically — local to this drawer.
const commentsLoaded = ref(SEED_COMMENTS.length)
const commentsTotal = ref(SEED_COMMENTS.length + LOAD_MORE_COMMENTS.length)

function onLoadMore() {
  if (loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  // Simulate a network round-trip. 800ms gives the user visible feedback
  // that a load is in progress before the new rows appear.
  setTimeout(() => {
    comments.value = [...comments.value, ...LOAD_MORE_COMMENTS]
    commentsLoaded.value = comments.value.length
    allLoaded.value = true
    loadingMore.value = false
    // Notify parent so the global N/total badge updates.
    emit('commentsLoaded', LOAD_MORE_COMMENTS.length)
  }, 800)
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
    :default-snap-index="0"
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

        <!-- Comments list with load-more on scroll-to-lower. -->
        <VyFeedList
          :items="comments"
          item-key-field="id"
          :enable-load-more="!allLoaded"
          :load-more-threshold-item-count="2"
          class="flex-1"
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
                  <text class="text-slate-400 text-xs">♥ {{ item.likes }}</text>
                </view>
              </view>
            </view>
          </template>
        </VyFeedList>

        <!-- Sentinel footer row shown while loading or when all comments have
             loaded. FeedList's loadMoreFooter/noMoreDataFooter slots are not in
             the current kit interface so we use a plain view beneath the list. -->
        <view v-if="loadingMore" class="py-4 flex items-center justify-center">
          <text class="text-slate-400 text-sm">Loading more comments…</text>
        </view>
        <view v-else-if="allLoaded" class="py-4 flex items-center justify-center">
          <text class="text-slate-400 text-sm">No more comments</text>
        </view>
      </view>
    </template>
  </VyDrawer>
</template>
