<script setup lang="ts">
import type { ToggleGroupRootProps } from '..'
import { ToggleGroupItem, ToggleGroupRoot } from '..'

const props = defineProps<ToggleGroupRootProps>()
</script>

<template>
  <ToggleGroupRoot v-bind="props">
    <ToggleGroupItem value="left" accessibility-label="Toggle left" />
    <ToggleGroupItem value="center" accessibility-label="Toggle center" />
    <ToggleGroupItem value="right" accessibility-label="Toggle right" />
  </ToggleGroupRoot>
</template>
