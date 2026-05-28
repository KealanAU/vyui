<script setup lang="ts">
const { seo } = useAppConfig()

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
})

useSeoMeta({
  titleTemplate: `%s — ${seo?.siteName}`,
  ogSiteName: seo?.siteName,
  twitterCard: 'summary_large_image',
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      :height="3"
      color="#d6a5b3"
    />

    <UBanner
      id="prealpha-banner"
      icon="i-lucide-flask-conical"
      title="Vy UI is pre-alpha. Vue-Lynx is pre-alpha. Expect breaking changes. Not production-ready."
      close
      :ui="{
        root: 'bg-(--color-warm-mist) border-b border-(--color-ink)/10',
        title: 'text-sm font-medium truncate text-(--color-ink)',
        icon: 'size-5 shrink-0 pointer-events-none text-(--color-ink)',
        close: '-me-1.5 lg:me-0 text-(--color-ink) hover:bg-(--color-ink)/10 focus-visible:bg-(--color-ink)/10',
      }"
    />

    <AppHeader />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />
  </UApp>
</template>
