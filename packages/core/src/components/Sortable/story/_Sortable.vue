<script setup lang="ts">
import { ref } from 'vue'

import { SortableItem, SortableRoot } from '..'

const items = ref([
  { id: 'a', label: 'Item A' },
  { id: 'b', label: 'Item B' },
  { id: 'c', label: 'Item C' },
  { id: 'd', label: 'Item D' },
])

const lastReorder = ref<{ from: number, to: number } | null>(null)

function onReorder(payload: { from: number, to: number }) {
  lastReorder.value = payload
}
</script>

<template>
  <view data-vyui-sortable-story>
    <SortableRoot
      v-model="items"
      :item-height="56"
      data-testid="sortable-root"
      @reorder="onReorder"
    >
      <template #default="{ items: rendered }">
        <SortableItem
          v-for="(item, idx) in (rendered as Array<{ id: string, label: string }>)"
          :key="item.id"
          :index="idx"
          :data-testid="`row-${item.id}`"
        >
          <template #default="{ dragging }">
            <view
              :style="{
                height: '56px',
                paddingLeft: '16px',
                paddingRight: '16px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: dragging ? '#dbeafe' : '#fff',
                borderBottomWidth: '1px',
                borderBottomColor: '#eee',
              }"
            >
              <text>{{ item.label }}</text>
            </view>
          </template>
        </SortableItem>
      </template>
    </SortableRoot>
    <text data-testid="last-reorder">
      {{ lastReorder ? `${lastReorder.from}->${lastReorder.to}` : 'none' }}
    </text>
    <text data-testid="order">{{ items.map(i => i.id).join(',') }}</text>
  </view>
</template>
