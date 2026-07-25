<script setup lang="ts">
import { ref } from 'vue'
import { VyAvatar, VyButton, VyIcon, VyIsland, VyIslandButton } from '@vyui/kit'

const CHROME = '#a3a6af'

const tab = ref<string | number | null>('home')
const gridTab = ref<'posts' | 'liked'>('posts')
const following = ref(false)

// Deliberately no autoplay. The landing page mounts this scene in three
// side-by-side devices, each on its own Lynx runtime — separate workers with
// separate clocks, so any timed state change would visibly drift between them
// and read as three broken phones rather than one screen on three targets.
// The loaded-then-loading grid below is a static composition, not a cycle.
</script>

<template>
  <view class="w-full flex-1 flex flex-col gap-3">
    <view class="flex flex-row items-center">
      <VyIcon name="i-lucide-chevron-left" :size="20" :color="CHROME" />
      <text class="flex-1 text-center text-base font-semibold text-highlighted">vyui</text>
      <VyIcon name="i-lucide-ellipsis" :size="20" :color="CHROME" />
    </view>

    <view class="flex flex-col items-center gap-2">
      <VyAvatar text="VY" color="primary" size="xl" />
      <text class="text-base font-semibold text-highlighted">Vy UI</text>
      <text class="text-sm text-muted">Components for Vue-Lynx</text>
    </view>

    <view class="flex flex-row items-center justify-center gap-7">
      <view class="flex flex-col items-center">
        <text class="text-base font-semibold text-highlighted">47</text>
        <text class="text-xs text-muted">Components</text>
      </view>
      <view class="flex flex-col items-center">
        <text class="text-base font-semibold text-highlighted">3</text>
        <text class="text-xs text-muted">Targets</text>
      </view>
      <view class="flex flex-col items-center">
        <text class="text-base font-semibold text-highlighted">1</text>
        <text class="text-xs text-muted">Codebase</text>
      </view>
    </view>

    <view class="flex flex-row gap-2">
      <view class="flex-1">
        <VyButton
          :label="following ? 'Following' : 'Follow'"
          :variant="following ? 'outline' : 'solid'"
          :color="following ? 'neutral' : 'primary'"
          block
          @tap="following = !following"
        />
      </view>
      <view class="flex-1">
        <VyButton label="Share" color="neutral" variant="outline" block />
      </view>
    </view>

    <view class="flex flex-row">
      <view
        class="flex-1 items-center py-2 border-b-2"
        :class="gridTab === 'posts' ? 'border-primary-600' : 'border-transparent'"
        @tap="gridTab = 'posts'"
      >
        <VyIcon name="i-lucide-grid-3x3" :size="18" :color="CHROME" />
      </view>
      <view
        class="flex-1 items-center py-2 border-b-2"
        :class="gridTab === 'liked' ? 'border-primary-600' : 'border-transparent'"
        @tap="gridTab = 'liked'"
      >
        <VyIcon name="i-lucide-heart" :size="18" :color="CHROME" />
      </view>
    </view>

    <!-- Two fixed rows rather than a wrapping grid: Lynx flex-wrap plus
         percentage min-widths is fiddly, and three flex-1 tiles per row is
         the same picture with none of the guesswork. Row one is loaded, row
         two is still coming in — the ordinary shape of an infinite feed. -->
    <view class="flex flex-col gap-1">
      <view class="flex flex-row gap-1">
        <view v-for="col in 3" :key="col" class="flex-1 h-20 rounded-lg bg-elevated items-center justify-center">
          <VyIcon name="i-lucide-play" :size="18" :color="CHROME" />
        </view>
      </view>
      <!-- Deliberately NOT VySkeleton: its `animate-pulse` never stops, and an
           animation inside the Lynx runtime keeps that runtime painting
           forever. Three of these on the landing page meant three workers that
           never went idle. Same picture, static. -->
      <view class="flex flex-row gap-1">
        <view v-for="col in 3" :key="col" class="flex-1 h-20 rounded-lg bg-accented" />
      </view>
    </view>

    <VyIsland v-model:value="tab" position="bottom" size="sm">
      <VyIslandButton value="home" icon="i-lucide-house" />
      <VyIslandButton value="search" icon="i-lucide-search" />
      <VyIslandButton value="activity" icon="i-lucide-bell" />
      <VyIslandButton value="profile" icon="i-lucide-user" />
    </VyIsland>
  </view>
</template>
