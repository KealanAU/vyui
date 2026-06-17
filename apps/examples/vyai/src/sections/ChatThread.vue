<script setup lang="ts">
import { SUGGESTIONS } from '../data/chat'
import { useChat } from '../composables/useChat'
import EmptyState from '../components/EmptyState.vue'
import MessageList from '../components/MessageList.vue'

const { messages, isEmpty, activeModel, send } = useChat()
</script>

<template>
  <scroll-view class="w-full flex-1 min-h-0" scroll-orientation="vertical">
    <!-- Top padding clears the fixed top island; bottom padding clears the
         fixed composer so the last turn is never hidden behind it. -->
    <view class="flex flex-col px-4 pt-24 pb-44">
      <EmptyState
        v-if="isEmpty"
        :model-name="activeModel.name"
        :suggestions="SUGGESTIONS"
        @pick="send"
      />
      <MessageList v-else :messages="messages" />
    </view>
  </scroll-view>
</template>
