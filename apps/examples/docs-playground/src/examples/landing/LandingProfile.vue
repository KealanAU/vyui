<script setup lang="ts">
import { ref } from 'vue'
import { VyAvatar, VyButton, VyIcon, VyIsland, VyIslandButton } from '@vyui/kit'

const CHROME = '#a3a6af'

const tab = ref<string | number | null>('home')
const gridTab = ref<'posts' | 'liked'>('posts')
const following = ref(false)

// No autoplay on purpose: three runtimes, three clocks — timed state visibly drifts.
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

    <view class="flex flex-col gap-1">
      <view v-for="row in 2" :key="row" class="flex flex-row gap-1">
        <view
          v-for="col in 3"
          :key="col"
          class="flex-1 h-20 items-center justify-center rounded-lg bg-elevated"
        >
          <VyIcon name="i-lucide-play" :size="18" :color="CHROME" />
        </view>
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
