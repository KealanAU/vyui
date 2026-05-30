<script setup lang="ts">
import type { ToggleGroupRootProps } from '..'
import { ToggleGroupItem, ToggleGroupRoot } from '..'

const props = defineProps<ToggleGroupRootProps>()
</script>

<template>
  <ToggleGroupRoot v-bind="props">
    <ToggleGroupItem value="left" accessibility-label="Toggle left" data-testid="toggle-item" />
    <ToggleGroupItem value="center" accessibility-label="Toggle center" data-testid="toggle-item" />
    <ToggleGroupItem value="right" accessibility-label="Toggle right" data-testid="toggle-item" />
  </ToggleGroupRoot>
</template>
