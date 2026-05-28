<script setup lang="ts">
import { TEXT_SECONDARY } from './tokens'

const style = { fontSize: '12px', fontWeight: '500' as const, color: TEXT_SECONDARY }
</script>

<template>
  <text :style="style"><slot /></text>
</template>
