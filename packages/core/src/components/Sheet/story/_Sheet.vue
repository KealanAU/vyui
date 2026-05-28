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
      <SheetBackdrop data-testid="backdrop" />
      <SheetContent data-testid="content">
        <SheetHandle />
        <SheetView>
          <text data-testid="view-text">sheet content</text>
        </SheetView>
      </SheetContent>
    </SheetRoot>
    <text data-testid="open-state">{{ open ? 'open' : 'closed' }}</text>
  </view>
</template>
