<script setup lang="ts">
import { ref } from 'vue'
import { VyAccordion } from '@vyui/kit'

const open = ref<string[]>(['account'])
const items = [
  { value: 'account', label: 'Account', content: 'Manage your profile and preferences.' },
  { value: 'billing', label: 'Billing', content: 'Review invoices and payment methods.' },
  { value: 'security', label: 'Security', content: 'Configure sign-in and recovery options.' },
]
</script>

<template>
  <VyAccordion v-model="open" type="multiple" :items="items" class="w-[320px]" />
</template>
