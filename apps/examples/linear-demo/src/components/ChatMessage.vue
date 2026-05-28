<script setup lang="ts">
export type ChatRole = 'user' | 'assistant'

/**
 * `thinking` renders a single shimmering line (no bubble) — the parent
 * cycles its `text` through a handful of cheeky placeholder phrases for the
 * "Claude Code"-style staging. `typing` swaps in the real reply text under
 * a pulse for the "streaming in" beat. `done` is the resting state.
 */
export type ChatState = 'thinking' | 'typing' | 'done'

withDefaults(defineProps<{
  role: ChatRole
  text: string
  state?: ChatState
}>(), {
  state: 'done',
})
</script>

<template>
  <!-- `thinking` skips the bubble entirely and renders a bare shimmering
       line — the parent rotates `text` through a pool of "Pondering…",
       "Cogitating…" etc. so it reads like Claude Code's spinner copy. -->
  <view
    v-if="state === 'thinking' && role === 'assistant'"
    class="flex flex-row justify-start px-2"
  >
    <text class="text-slate-500 text-sm italic animate-pulse">{{ text }}</text>
  </view>

  <view
    v-else
    class="flex flex-row"
    :class="role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <view
      :class="role === 'user'
        ? 'bg-blue-500 rounded-2xl px-4 py-2 max-w-[80%]'
        : 'bg-slate-100 rounded-2xl px-4 py-2 max-w-[80%]'"
    >
      <text
        :class="[
          role === 'user' ? 'text-white text-sm' : 'text-slate-900 text-sm',
          state === 'typing' ? 'animate-pulse' : '',
        ]"
      >{{ text }}</text>
    </view>
  </view>
</template>
