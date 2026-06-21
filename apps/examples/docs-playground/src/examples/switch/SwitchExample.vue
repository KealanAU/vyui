<script setup lang="ts">
import { ref } from 'vue'
import { VySwitch } from '@vyui/kit'

const notifications = ref(true)
</script>

<template>
  <VySwitch
    v-model="notifications"
    label="Push notifications"
    description="Receive alerts for messages and account activity."
  />
</template>
