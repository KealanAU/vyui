<script setup lang="ts">
import { ref } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '..'

const props = defineProps<{ disabled?: boolean }>()
const radioStateSingle = ref('default')
</script>

<template>
  <RadioGroupRoot v-model="radioStateSingle" :loop="false" :disabled="props.disabled">
    <RadioGroupItem value="default" accessibility-label="Default">
      <RadioGroupIndicator />
    </RadioGroupItem>
    <RadioGroupItem value="comfortable" accessibility-label="Comfortable">
      <RadioGroupIndicator />
    </RadioGroupItem>
    <RadioGroupItem value="compact" accessibility-label="Compact">
      <RadioGroupIndicator />
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
