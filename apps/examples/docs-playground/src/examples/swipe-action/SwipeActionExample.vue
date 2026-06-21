<script setup lang="ts">
import { ref } from 'vue'
import { VyIcon, VySwipeAction } from '@vyui/kit'

const open = ref(false)
const archived = ref(false)
</script>

<template>
  <view class="w-full">
    <VySwipeAction
      v-if="!archived"
      v-model:open="open"
      :row-width="360"
      :action-width="96"
      @commit="archived = true"
    >
      <view class="h-16 px-4 justify-center bg-white">
        <text class="font-medium">Quarterly report</text>
        <text class="text-sm text-neutral-500">Swipe left to archive</text>
      </view>

      <template #actions="{ close }">
        <view
          class="w-24 items-center justify-center bg-primary-600"
          accessibility-element="true"
          accessibility-traits="button"
          @tap="archived = true; close()"
        >
          <VyIcon name="i-lucide-archive" class="text-white" />
        </view>
      </template>
    </VySwipeAction>

    <view v-else class="h-16 px-4 justify-center">
      <text class="text-sm text-neutral-500">Archived.</text>
    </view>
  </view>
</template>
