<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyStepper } from '@vyui/kit'

const step = ref(0)
const items = [
  { title: 'Account', description: 'Create your profile' },
  { title: 'Plan', description: 'Choose a subscription' },
  { title: 'Payment', description: 'Add a payment method' },
]
</script>

<template>
  <view class="flex flex-col gap-4 w-full">
    <VyStepper v-model="step" :items="items" />

    <view class="flex flex-row gap-2">
      <VyButton
        label="Back"
        color="neutral"
        variant="soft"
        :disabled="step === 0"
        @tap="step--"
      />
      <VyButton
        label="Next"
        :disabled="step === items.length - 1"
        @tap="step++"
      />
    </view>
  </view>
</template>
