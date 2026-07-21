<script setup lang="ts">
import { ref } from 'vue'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetTrigger,
  SheetView,
} from '..'

defineProps<{
  defaultOpen?: boolean
  defaultSnapIndex?: number
  snapPoints?: number[]
  viewportHeight?: number
}>()

const open = ref(false)
</script>

<template>
  <view>
    <SheetRoot
      v-model:open="open"
      :default-open="defaultOpen"
      :default-snap-index="defaultSnapIndex"
      :snap-points="snapPoints ?? [0.4, 0.9]"
      :viewport-height="viewportHeight"
    >
      <SheetTrigger data-testid="trigger">
        <text>open sheet</text>
      </SheetTrigger>
      <!-- Core ships no color, so the story supplies the dim and the panel
           surface itself — the same job `@vyui/kit`'s themes do. -->
      <SheetBackdrop data-testid="backdrop" :style="{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }" />
      <SheetContent data-testid="content" :style="{ backgroundColor: '#fff' }">
        <SheetHandle />
        <SheetView>
          <text data-testid="view-text">sheet content</text>
        </SheetView>
      </SheetContent>
    </SheetRoot>
    <text data-testid="open-state">{{ open ? 'open' : 'closed' }}</text>
  </view>
</template>
