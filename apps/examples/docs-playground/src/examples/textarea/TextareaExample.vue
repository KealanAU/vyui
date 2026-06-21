<script setup lang="ts">
import { ref } from 'vue'
import { VyTextarea } from '@vyui/kit'

const message = ref('')
</script>

<template>
  <VyTextarea
    v-model="message"
    placeholder="Write a message…"
    :rows="4"
    class="w-full"
  />
</template>
