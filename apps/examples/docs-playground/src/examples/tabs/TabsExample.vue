<script setup lang="ts">
import { ref } from 'vue'
import { VyTabs } from '@vyui/kit'

const active = ref('overview')
const items = [
  { label: 'Overview', value: 'overview', icon: 'i-lucide-layout-dashboard', content: 'Your account summary and recent activity.' },
  { label: 'Security', value: 'security', icon: 'i-lucide-shield-check', content: 'Passkeys, passwords, and signed-in devices.' },
  { label: 'Billing', value: 'billing', icon: 'i-lucide-credit-card', content: 'Plans, invoices, and payment methods.' },
]
</script>

<template>
  <VyTabs v-model="active" :items="items" class="w-full" />
</template>
