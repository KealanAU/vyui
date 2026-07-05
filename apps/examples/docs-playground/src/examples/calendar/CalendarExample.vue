<script setup lang="ts">
import { ref } from 'vue'
import { VyCalendar } from '@vyui/kit'

const value = ref('2026-07-05')
</script>

<template>
  <VyCalendar
    v-model="value"
    default-month="2026-07"
    :disabled-dates="['2026-07-10', '2026-07-11']"
  />
</template>
