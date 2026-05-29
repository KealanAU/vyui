<script setup lang="ts">
useSeoMeta({
  titleTemplate: '',
  title: 'Vy UI — Headless components for Vue-Lynx',
  ogTitle: 'Vy UI — Headless components for Vue-Lynx',
  description: 'The component library for Vue-Lynx. Behavioral primitives, a styled kit, and native rendering across iOS, Android, and web — all from one Vue codebase.',
  ogDescription: 'The component library for Vue-Lynx. Behavioral primitives, a styled kit, and native rendering across iOS, Android, and web — all from one Vue codebase.',
})

useHead({ bodyAttrs: { class: 'landing-page' } })
</script>

<template>
  <div>
    <LandingHero />
    <LandingFeatures />
    <LandingTargets />
    <LandingCta />
  </div>
</template>
