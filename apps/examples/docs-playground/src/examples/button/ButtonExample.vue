<script setup lang="ts">
import { VyButton } from '@vyui/kit'

function saveDraft() {
  // Persist the draft.
}
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <VyButton label="Save draft" @tap="saveDraft" />
    <VyButton color="neutral" variant="soft">
      Continue with slot content
    </VyButton>
  </view>
</template>
