<script setup lang="ts">
import type { ChatTurn } from '../composables/useChat'
import ChatBubble from './ChatBubble.vue'

// Renders the conversation. Stateless — the thread is owned upstream and
// passed straight through to one <ChatBubble> per turn.
defineProps<{
  messages: ChatTurn[]
}>()
</script>

<template>
  <view class="flex flex-col gap-5">
    <ChatBubble
      v-for="turn in messages"
      :key="turn.id"
      :turn="turn"
    />
  </view>
</template>
