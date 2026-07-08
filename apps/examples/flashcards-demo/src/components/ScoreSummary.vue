<script setup lang="ts">
import { computed } from 'vue'
import { VyButton, VyIcon, VyProgress } from '@vyui/kit'
import { useIconColors } from '../iconColors'
import type { Deck } from '../types'

const props = defineProps<{ deck: Deck, results: boolean[] }>()
const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'done'): void
}>()

const { accent } = useIconColors()

const total = computed(() => props.deck.questions.length)
const score = computed(() => props.results.filter(Boolean).length)
const percent = computed(() => Math.round((score.value / total.value) * 100))
const headline = computed(() => {
  if (percent.value === 100) return 'Perfect run!'
  if (percent.value >= 60) return 'Nice work!'
  return 'Keep practicing!'
})
</script>

<template>
  <view class="flex flex-col gap-4">
    <view class="flex flex-col items-center gap-2 bg-elevated rounded-lg p-6">
      <VyIcon name="lucide:trophy" :size="32" :color="accent(deck.color)" />
      <text class="text-highlighted text-xl font-bold">{{ headline }}</text>
      <text class="text-muted text-sm">{{ deck.title }} — {{ score }}/{{ total }} correct ({{ percent }}%)</text>
      <VyProgress :model-value="score" :max="total" :color="deck.color" size="sm" class="w-full" />
    </view>

    <view class="flex flex-col gap-2">
      <view
        v-for="(question, i) in deck.questions"
        :key="i"
        class="flex flex-row items-center gap-3 bg-muted rounded-lg p-3"
      >
        <VyIcon
          :name="results[i] ? 'lucide:check' : 'lucide:x'"
          :size="16"
          :color="accent(results[i] ? 'success' : 'error')"
        />
        <view class="flex flex-col gap-1 flex-1 min-w-0">
          <text class="text-default text-sm">{{ question.prompt }}</text>
          <text v-if="!results[i]" class="text-muted text-xs">Answer: {{ question.choices[question.answer] }}</text>
        </view>
      </view>
    </view>

    <view class="flex flex-col gap-2">
      <VyButton block :color="deck.color" label="Try again" leading-icon="lucide:rotate-ccw" @tap="emit('retry')" />
      <VyButton block color="neutral" variant="soft" label="All decks" @tap="emit('done')" />
    </view>
  </view>
</template>
