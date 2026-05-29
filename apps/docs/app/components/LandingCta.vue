<script setup lang="ts">
const links = [
  {
    label: 'Read the docs',
    to: '/getting-started',
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
    title="Component docs are on the way"
    description="A per-component reference with props, slots, events, and live demos is the next thing being built. Until then, the source is the documentation."
    variant="subtle"
    :links="links"
  />
</template>
