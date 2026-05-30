<script setup lang="ts">
import type { RatingRootProps } from '..'
import { RatingItem, RatingItemIndicator, RatingRoot } from '..'

const props = defineProps<RatingRootProps>()
</script>

<template>
  <RatingRoot v-slot="{ items }" v-bind="props">
    <RatingItem v-for="item in items" :key="item" v-slot="{ steps }" :item="item">
      <RatingItemIndicator v-for="step in steps" :key="step" :step="step" data-testid="rating-item" />
    </RatingItem>
  </RatingRoot>
</template>
