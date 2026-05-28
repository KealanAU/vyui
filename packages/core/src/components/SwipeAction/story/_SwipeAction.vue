<script setup lang="ts">
import { ref } from 'vue'

import { SwipeAction } from '..'

const open = ref(false)
const committed = ref(0)

function onCommit() {
  committed.value++
}
</script>

<template>
  <view data-vyui-swipe-action-story>
    <SwipeAction
      v-model:open="open"
      :action-width="80"
      :row-width="320"
      data-testid="swipe-action"
      @commit="onCommit"
    >
      <template #default>
        <view
          :style="{
            height: '56px',
            paddingLeft: '16px',
            display: 'flex',
            alignItems: 'center',
          }"
        >
          <text data-testid="row-text">Inbox row</text>
        </view>
      </template>
      <template #action="{ close }">
        <view
          data-testid="action-button"
          :style="{
            width: '80px',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
          bindtap="close"
        >
          <text>Delete</text>
        </view>
      </template>
    </SwipeAction>
    <text data-testid="open">{{ open ? 'open' : 'closed' }}</text>
    <text data-testid="commit-count">{{ committed }}</text>
  </view>
</template>
