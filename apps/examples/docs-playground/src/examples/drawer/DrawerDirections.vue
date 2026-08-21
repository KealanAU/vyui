<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyDrawer } from '@vyui/kit'

const open = ref(false)
</script>

<template>
  <VyDrawer
    v-model:open="open"
    side="right"
    title="Notifications"
    description="A drawer can slide in from any edge."
  >
    <VyButton color="neutral" variant="soft" label="Open from the right" />

    <template #content>
      <view class="flex-1 p-4">
        <text class="text-sm text-neutral-600">
          Use <code>side</code> to pick
          <code>top</code>, <code>right</code>, <code>bottom</code>, or
          <code>left</code>.
        </text>
      </view>
    </template>
  </VyDrawer>
</template>
