<script setup lang="ts">
import { computed, ref } from 'vue'
import { VyButton, VyProgress } from '@vyui/kit'
import type { Deck } from '../types'

const props = defineProps<{ deck: Deck, index: number }>()
const emit = defineEmits<{
  (e: 'answered', correct: boolean): void
  (e: 'next'): void
  (e: 'quit'): void
}>()

const question = computed(() => props.deck.questions[props.index]!)
const total = computed(() => props.deck.questions.length)
const isLast = computed(() => props.index + 1 >= total.value)

// Local by design: the parent keys this component per question, so a fresh
// mount (next question, or a dark-mode remount) resets the selection.
const selected = ref<number | null>(null)
const answered = computed(() => selected.value !== null)

function choose(i: number): void {
  if (answered.value) return
  selected.value = i
  emit('answered', i === question.value.answer)
}

// Reveal styling. `enableCSSInheritance: false` on Lynx means the text color
// can't ride on the row <view> — each <text> sets its own class.
function rowClass(i: number): string {
  const base = 'flex flex-row items-center rounded-lg border p-3'
  if (!answered.value) return `${base} bg-default border-accented`
  if (i === question.value.answer) return `${base} bg-success border-success`
  if (i === selected.value) return `${base} bg-error border-error`
  return `${base} bg-muted border-muted`
}
function rowTextClass(i: number): string {
  if (!answered.value) return 'text-default text-sm'
  if (i === question.value.answer || i === selected.value) return 'text-white text-sm font-medium'
  return 'text-muted text-sm'
}
</script>

<template>
  <view class="flex flex-col gap-4">
    <view class="flex flex-row items-center gap-3">
      <VyButton size="xs" color="neutral" variant="soft" square icon="lucide:arrow-left" @tap="emit('quit')" />
      <text class="text-highlighted text-base font-semibold flex-1">{{ deck.title }}</text>
      <text class="text-muted text-sm">{{ index + 1 }}/{{ total }}</text>
    </view>

    <VyProgress :model-value="index + (answered ? 1 : 0)" :max="total" :color="deck.color" size="sm" />

    <text class="text-highlighted text-lg font-semibold">{{ question.prompt }}</text>

    <view class="flex flex-col gap-2">
      <view
        v-for="(choice, i) in question.choices"
        :key="i"
        :class="rowClass(i)"
        @tap="choose(i)"
      >
        <text :class="rowTextClass(i)">{{ choice }}</text>
      </view>
    </view>

    <view v-if="answered" class="flex flex-col gap-3">
      <text v-if="selected === question.answer" class="text-success text-sm font-medium">Correct!</text>
      <text v-else class="text-error text-sm font-medium">Not quite — the right answer is highlighted.</text>
      <VyButton
        block
        :color="deck.color"
        :label="isLast ? 'See results' : 'Next question'"
        trailing-icon="lucide:arrow-right"
        @tap="emit('next')"
      />
    </view>
  </view>
</template>
