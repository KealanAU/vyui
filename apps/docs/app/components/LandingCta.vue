<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const links: ButtonProps[] = [
  {
    label: 'Browse components',
    to: '/components',
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: 'Browse on GitHub',
    to: 'https://github.com/KealanAU/vyui',
    target: '_blank',
    variant: 'outline',
    color: 'neutral',
    icon: 'i-simple-icons-github',
  },
]
</script>

<template>
  <UPageCTA
    class="border-t border-default"
    title="Component docs are live"
    description="Every component has a full reference — props, slots, events, and a live demo running a real Lynx bundle. Source is always one click away when you need more."
    variant="subtle"
    :links="links"
  />
</template>
