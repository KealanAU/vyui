<script setup lang="ts">
import { computed } from 'vue'

import { ScrollView } from '..'

const props = defineProps<{
  itemCount?: number
  scrollOrientation?: 'vertical' | 'horizontal'
  disabled?: boolean
}>()

const itemCount = computed(() => props.itemCount ?? 24)
const items = computed(() =>
  Array.from({ length: itemCount.value }, (_, i) => ({ id: i, label: `Item ${i + 1}` })),
)
</script>

<template>
  <view>
    <ScrollView
      :scroll-orientation="scrollOrientation ?? 'vertical'"
      :disabled="disabled"
      :style="{ width: '100%', height: '400px' }"
      data-testid="scroll-view"
    >
      <view
        v-for="item in items"
        :key="item.id"
        :data-testid="`item-${item.id}`"
        :style="{ height: '60px', padding: '12px' }"
      >
        <text>{{ item.label }}</text>
      </view>
    </ScrollView>
  </view>
</template>
