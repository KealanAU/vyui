<script setup lang="ts">
import { ref } from 'vue'
import { VyInput } from '@vyui/kit'

const value = ref('Read only for now')
</script>

<template>
  <VyInput
    v-model="value"
    disabled
    placeholder="Disabled"
    class="w-[280px]"
  />
</template>
