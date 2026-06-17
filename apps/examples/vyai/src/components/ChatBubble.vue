<script setup lang="ts">
import { computed, ref } from 'vue'
import { VyIcon } from '@vyui/kit'
import type { ChatTurn } from '../composables/useChat'
import VyMark from './VyMark.vue'

const props = defineProps<{ turn: ChatTurn }>()

// Lynx <text> does not reflow on raw \n, so split into lines and render each
// as its own <text>. Blank lines (paragraph gaps) become small spacers.
const lines = computed(() => (props.turn.text ?? '').split('\n'))
const isUser = computed(() => props.turn.role === 'user')
const isThinking = computed(() => props.turn.state === 'thinking')
const isStreaming = computed(() => props.turn.state === 'streaming')

// Reasoning trace, split into discrete steps. Models emit it as prose with
// newlines (often numbered) — one bullet per non-empty line reads as a step
// list. Empty when the model isn't reasoning.
const steps = computed(() =>
  (props.turn.thinking ?? '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean),
)
const hasReasoning = computed(() => steps.value.length > 0)
// Live one-liner while thinking: the latest step, so it reads like a status
// ticking through "checking language… weighing options…". Falls back to the
// cheeky placeholder copy before any reasoning has streamed in.
const status = computed(() => (hasReasoning.value ? steps.value[steps.value.length - 1] : (props.turn.text ?? '')))

// Expanded trace. Auto-open while actively reasoning so the steps stream into
// view; user can collapse/expand once the answer lands.
const open = ref(false)
const showTrace = computed(() => (isThinking.value ? true : open.value))

// While reasoning streams, cap the rendered trace to the most recent steps —
// a long chain-of-thought can run to hundreds of lines, and re-rendering all
// of them every token janks the thread to a standstill. The full trace is
// available once it's done and the user expands it.
const MAX_LIVE_STEPS = 6
const visibleSteps = computed(() =>
  isThinking.value ? steps.value.slice(-MAX_LIVE_STEPS) : steps.value,
)
</script>

<template>
  <!-- Assistant "thinking" — shimmering status line beside the logo dot, with
       the live reasoning trace streaming in below when available. -->
  <view v-if="isThinking" class="flex flex-col gap-2 px-1">
    <view class="flex flex-row items-center gap-3">
      <VyMark :size="28" class="vyai-breathe" />
      <text class="flex-1 text-slate-400 text-sm italic vyai-breathe">{{ status }}</text>
    </view>
    <view v-if="hasReasoning && showTrace" class="ml-10 pl-3 border-l-2 border-slate-100 flex flex-col gap-1.5">
      <view v-for="(s, i) in visibleSteps" :key="i" class="flex flex-row gap-2">
        <text class="text-slate-300 text-[13px] leading-5">•</text>
        <text class="flex-1 text-slate-400 text-[13px] leading-5">{{ s }}</text>
      </view>
    </view>
  </view>

  <!-- User turn — compact gray bubble, right aligned. -->
  <view v-else-if="isUser" class="flex flex-row justify-end px-1">
    <view class="bg-slate-100 rounded-3xl px-4 py-2.5 max-w-[80%]">
      <text class="text-slate-900 text-[15px] leading-6">{{ turn.text }}</text>
    </view>
  </view>

  <!-- Assistant answer — full width, no bubble (ChatGPT style), logo leading. -->
  <view v-else class="flex flex-row gap-3 px-1">
    <VyMark :size="28" />
    <view class="flex-1 flex flex-col pt-0.5">
      <!-- Collapsed "thought process" disclosure, kept after reasoning turns. -->
      <view v-if="hasReasoning" class="mb-2 flex flex-col gap-1.5">
        <view class="flex flex-row items-center gap-1.5 self-start" @tap="open = !open">
          <VyIcon name="i-tabler-bulb" :size="14" color="#94a3b8" />
          <text class="text-slate-400 text-[13px] font-medium">Thought process</text>
          <VyIcon :name="open ? 'i-tabler-chevron-up' : 'i-tabler-chevron-down'" :size="14" color="#94a3b8" />
        </view>
        <view v-if="showTrace" class="pl-3 border-l-2 border-slate-100 flex flex-col gap-1.5">
          <view v-for="(s, i) in visibleSteps" :key="i" class="flex flex-row gap-2">
            <text class="text-slate-300 text-[13px] leading-5">•</text>
            <text class="flex-1 text-slate-400 text-[13px] leading-5">{{ s }}</text>
          </view>
        </view>
      </view>

      <view v-for="(line, i) in lines" :key="i">
        <view v-if="line === ''" class="h-2" />
        <text v-else class="text-slate-900 text-[15px] leading-6">{{ line }}</text>
      </view>
      <!-- Blinking caret while streaming. -->
      <view v-if="isStreaming" class="h-1 w-2 mt-1 rounded-full bg-slate-900 vyai-breathe" />
    </view>
  </view>
</template>
