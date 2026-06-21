<script setup lang="ts">
useSeoMeta({
  titleTemplate: '',
  title: 'Vy UI — Styled & headless components for Vue-Lynx',
  ogTitle: 'Vy UI — Styled & headless components for Vue-Lynx',
  description: 'The component library for Vue-Lynx. A styled kit on headless, accessible primitives, with native rendering across iOS, Android, and web — all from one Vue codebase.',
  ogDescription: 'The component library for Vue-Lynx. A styled kit on headless, accessible primitives, with native rendering across iOS, Android, and web — all from one Vue codebase.',
})

useHead({ bodyAttrs: { class: 'landing-page' } })

defineOgImageComponent('Default', {
  title: 'Vy UI',
  description: 'Styled & headless components for Vue-Lynx — native iOS, Android & web from one codebase.',
})
</script>

<template>
  <div>
    <LandingHero />
    <LandingFeatures />
    <LandingTargets />
    <LandingCta />
  </div>
</template>
