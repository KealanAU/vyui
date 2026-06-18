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
    <!-- Wrapper carries the entrance animation so it runs once per turn on
         mount (keyed by id) — ChatBubble's branching roots don't each need the
         class, and streaming text mutations don't re-trigger it. -->
    <view
      v-for="turn in messages"
      :key="turn.id"
      class="vyai-rise"
    >
      <ChatBubble :turn="turn" />
    </view>
  </view>
</template>
