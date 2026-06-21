<script setup lang="ts">
import { ref } from 'vue'
import { VyRadioGroup } from '@vyui/kit'

const plan = ref('pro')
const items = [
  { label: 'Free', value: 'free', description: 'For personal projects.' },
  { label: 'Pro', value: 'pro', description: 'For growing teams.' },
  { label: 'Enterprise', value: 'enterprise', description: 'For larger organizations.' },
]
</script>

<template>
  <VyRadioGroup
    v-model="plan"
    legend="Choose a plan"
    :items="items"
  />
</template>
