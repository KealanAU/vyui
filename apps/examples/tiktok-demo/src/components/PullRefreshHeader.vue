<script setup lang="ts">
// Pull-to-refresh header UI affordance. This component is BUILT but NOT YET
// WIRED to FeedList — the `enableRefresh` / `refreshHeader` slot props don't
// exist in @vyui/core yet (being added in a parallel branch).
//
// INTEGRATION(PTR): once @vyui/core FeedList ships enableRefresh, wire
//   enableRefresh + v-model:refreshing + #refreshHeader here. Contract:
//   state ∈ 'idle'|'pulling'|'releaseReady'|'refreshing'|'done',
//   progress 0..1.
//
// When wired, pass these props from the parent #refreshHeader slot:
//   <PullRefreshHeader :state="state" :progress="progress" :loaded="loadedCount" :total="totalCount" />

export type PtrState = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'

const props = withDefaults(defineProps<{
  // PTR gesture state. Currently always 'idle' — will be driven by the
  // FeedList #refreshHeader slot's `{ state, progress }` when PTR ships.
  state?: PtrState
  // Drag progress 0..1 (how far past the threshold the user has pulled).
  progress?: number
  // How many items have loaded so far (shown in the N/total badge).
  loaded: number
  // Total item cap (denominator for the N/total counter).
  total: number
}>(), {
  state: 'idle',
  progress: 0,
})
</script>

<template>
  <!-- The outer view gives the refresh-header a fixed height that Lynx can
       measure. Height must be declared so the list knows how far to bounce.
       When PTR is wired, adjust this height to match the design. -->
  <view class="w-full h-16 flex flex-row items-center justify-center gap-3 bg-black">
    <!-- Spinner / arrow — adapts to PTR state when wired. -->
    <view class="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
      <text
        class="text-white text-base"
        :style="{ opacity: state === 'refreshing' ? '1' : String(Math.min(1, progress * 2)) }"
      >
        <!-- Arrow icon: points up when pulling, rotates at releaseReady,
             becomes a spinner during refreshing.  Currently static since
             state is always 'idle'. -->
        {{ state === 'refreshing' ? '↻' : state === 'releaseReady' ? '↑' : '↓' }}
      </text>
    </view>

    <!-- N/total counter — shows how many items are loaded. Updates live as
         the video feed and comments list load-more handlers fire. -->
    <text class="text-white/70 text-sm font-medium">
      {{ loaded }}/{{ total }} loaded
    </text>

    <!-- State label — only meaningful once PTR is wired. -->
    <text v-if="state !== 'idle'" class="text-white/50 text-xs">
      {{ state === 'refreshing' ? 'Refreshing…' : state === 'done' ? 'Done' : state === 'releaseReady' ? 'Release' : 'Pull' }}
    </text>
  </view>
</template>
