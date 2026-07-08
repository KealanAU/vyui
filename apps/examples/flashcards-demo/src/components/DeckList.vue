<script setup lang="ts">
import { VyBadge, VyIcon } from '@vyui/kit'
import { DECK_TEXT_CLASS, type Deck } from '../types'

defineProps<{ decks: Deck[] }>()
const emit = defineEmits<{ (e: 'start', id: string): void }>()
</script>

<template>
  <view class="flex flex-col gap-3">
    <view
      v-for="deck in decks"
      :key="deck.id"
      class="flex flex-row items-center gap-3 bg-elevated rounded-lg p-4"
      @tap="emit('start', deck.id)"
    >
      <view class="w-10 h-10 rounded-lg bg-default flex items-center justify-center">
        <VyIcon :name="deck.icon" :class="['w-5 h-5', DECK_TEXT_CLASS[deck.color]]" />
      </view>
      <view class="flex flex-col gap-1 flex-1 min-w-0">
        <text class="text-highlighted text-base font-semibold">{{ deck.title }}</text>
        <text class="text-muted text-xs">{{ deck.description }}</text>
      </view>
      <VyBadge :label="`${deck.questions.length} cards`" color="neutral" variant="soft" size="sm" />
      <VyIcon name="lucide:chevron-right" class="w-4 h-4 text-dimmed" />
    </view>
  </view>
</template>
