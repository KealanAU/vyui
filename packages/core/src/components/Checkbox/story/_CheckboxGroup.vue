<script setup lang="ts">
import type { CheckboxGroupRootProps } from '..'
import { ref } from 'vue'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '..'

const props = defineProps<CheckboxGroupRootProps<any>>()
const modelValue = ref<any[]>([])
const items = [{ name: 'jack' }, { name: 'john' }, { name: 'mike' }]
</script>

<template>
  <CheckboxGroupRoot v-bind="props" v-model="modelValue">
    <view v-for="item in items" :key="item.name">
      <CheckboxRoot :value="item" :accessibility-label="item.name" data-testid="checkbox">
        <CheckboxIndicator />
      </CheckboxRoot>
      <text>{{ item.name }}</text>
    </view>
  </CheckboxGroupRoot>
</template>
