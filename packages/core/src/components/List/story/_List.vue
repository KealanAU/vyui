<script setup lang="ts">
import { ref } from 'vue'

import { List, ListItem } from '..'

const items = ref(Array.from({ length: 40 }, (_, i) => ({ id: `r-${i}`, label: `Row ${i + 1}` })))
const listRef = ref<InstanceType<typeof List> | null>(null)

function jumpToTop() {
  listRef.value?.scrollTo(0, { smooth: true })
}

function jumpToMiddle() {
  listRef.value?.scrollTo(Math.floor(items.value.length / 2), { alignTo: 'middle', smooth: true })
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }">
    <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
      <view @tap="jumpToTop" :style="{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#3b82f6' }">
        <text :style="{ color: '#fff', fontWeight: '700' }">Top</text>
      </view>
      <view @tap="jumpToMiddle" :style="{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#3b82f6' }">
        <text :style="{ color: '#fff', fontWeight: '700' }">Middle</text>
      </view>
    </view>

    <List
      ref="listRef"
      :style="{ height: '400px' }"
      :main-axis-gap="6"
    >
      <ListItem v-for="item in items" :key="item.id" :item-key="item.id">
        <view :style="{ padding: '14px', borderRadius: '8px', backgroundColor: '#f1f5f9' }">
          <text :style="{ fontSize: '14px', color: '#0f172a' }">{{ item.label }}</text>
        </view>
      </ListItem>
    </List>
  </view>
</template>
