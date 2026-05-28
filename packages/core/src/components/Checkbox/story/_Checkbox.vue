<script setup lang="ts">
import type { CheckboxRootProps } from '..'
import { ref } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from '..'

const props = defineProps<CheckboxRootProps>()
const modelValue = ref(props.modelValue)
</script>

<template>
  <CheckboxRoot v-bind="props" v-model="modelValue">
    <CheckboxIndicator />
  </CheckboxRoot>
</template>
