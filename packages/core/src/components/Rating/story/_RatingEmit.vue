<script setup lang="ts">
import type { RatingRootEmits, RatingRootProps } from '..'
import { useEmitAsProps } from '@/shared'
import { RatingItem, RatingItemIndicator, RatingRoot } from '..'

const props = defineProps<RatingRootProps>()
const emits = defineEmits<RatingRootEmits>()
</script>

<template>
  <RatingRoot v-slot="{ items }" v-bind="{ ...props, ...useEmitAsProps(emits) }">
    <RatingItem v-for="item in items" :key="item" v-slot="{ steps }" :item="item">
      <RatingItemIndicator v-for="step in steps" :key="step" :step="step" data-testid="rating-item" />
    </RatingItem>
  </RatingRoot>
</template>
