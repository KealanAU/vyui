<script setup lang="ts">
import { VyIcon } from '@vyui/kit'

// The trailing action button of the composer row. It's a pure function of two
// flags — responding? has text? — and emits the matching intent. Keeping the
// state out here lets the composer own the chat lifecycle.
defineProps<{
  isResponding: boolean
  hasText: boolean
}>()

defineEmits<{
  send: []
  stop: []
  voice: []
}>()
</script>

<template>
  <!-- Responding → stop. Has text → send. Otherwise → voice. The active
       buttons sit on Ash Border with an ink-dark glyph (the Lynx <svg> bakes
       its color from the `color` prop, not CSS). -->
  <view
    v-if="isResponding"
    class="size-9 rounded-full bg-ash-border flex items-center justify-center"
    @tap="$emit('stop')"
  >
    <view class="size-3 rounded-[3px] bg-[#1c1917]" />
  </view>
  <view
    v-else-if="hasText"
    class="size-9 rounded-full bg-ash-border flex items-center justify-center"
    @tap="$emit('send')"
  >
    <VyIcon name="i-tabler-arrow-up" :size="22" color="#1c1917" />
  </view>
  <view
    v-else
    class="size-9 rounded-full bg-slate-100 flex items-center justify-center"
    @tap="$emit('voice')"
  >
    <VyIcon name="i-tabler-microphone" :size="20" color="#334155" />
  </view>
</template>
