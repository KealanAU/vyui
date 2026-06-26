<script setup lang="ts">
useSeoMeta({
  titleTemplate: '',
  title: 'Vy UI — Styled & headless components for Vue-Lynx',
  ogTitle: 'Vy UI — Styled & headless components for Vue-Lynx',
  description: 'The component library for Vue-Lynx. A styled kit on headless, accessible primitives, with native rendering across iOS, Android, and web — all from one Vue codebase.',
  ogDescription: 'The component library for Vue-Lynx. A styled kit on headless, accessible primitives, with native rendering across iOS, Android, and web — all from one Vue codebase.',
})

useHead({ bodyAttrs: { class: 'landing-page' } })

// Classify the project itself for search/AI: a developer tool that renders
// natively to iOS, Android, and web. operatingSystem + keywords encode the
// cross-platform (native) reach that "Vue-Lynx" alone doesn't signal to crawlers.
useSchemaOrg([
  defineSoftwareApp({
    name: 'Vy UI',
    description: 'Accessible Vue-Lynx component library — headless primitives plus a styled kit that render natively to iOS, Android, and web from one Vue codebase.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'iOS, Android, Web',
    keywords: 'Vue, Vue-Lynx, Lynx, native, cross-platform, iOS, Android, component library, headless UI, accessible components, design system',
    // Tie Vy UI to the upstream ecosystem so crawlers connect the entities:
    // written in Vue, built on Vue-Lynx, which is built on Lynx.
    softwareRequirements: 'Vue, Vue-Lynx',
    isBasedOn: ['https://vuejs.org/', 'https://vue.lynxjs.org/', 'https://lynxjs.org/'],
  }),
])

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
