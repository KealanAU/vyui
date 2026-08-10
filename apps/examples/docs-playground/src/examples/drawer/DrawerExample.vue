<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyDrawer } from '@vyui/kit'

const open = ref(false)
</script>

<template>
  <VyDrawer
    v-model:open="open"
    title="Edit profile"
    description="Make changes to your profile here."
  >
    <VyButton color="neutral" variant="soft" label="Open drawer" />

    <template #body>
      <view class="flex flex-col gap-3 p-4">
        <text class="text-sm text-neutral-600">
          Drawers are great for forms, pickers, and long content that benefits
          from a drag-to-dismiss surface.
        </text>
      </view>
    </template>

    <template #footer="{ close }">
      <VyButton color="neutral" variant="ghost" label="Cancel" @tap="close" />
      <VyButton label="Save" @tap="close" />
    </template>
  </VyDrawer>
</template>
