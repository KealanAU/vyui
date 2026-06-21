<script setup lang="ts">
const { seo } = useAppConfig()
const { public: { siteUrl } } = useRuntimeConfig()
const url = useRequestURL()

// `package` (kit | core) drives the Components Core/Kit sub-filter; it must be
// requested explicitly to appear on navigation nodes.
const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs', ['package']))

useHead({
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'canonical', href: url.href },
  ],
})

useSeoMeta({
  titleTemplate: `%s — ${seo?.siteName}`,
  ogSiteName: seo?.siteName,
  ogType: 'website',
  ogUrl: url.href,
  twitterCard: 'summary_large_image',
  twitterSite: '@vyui_dev',
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      :height="3"
      color="#42b883"
    />

    <UBanner
      id="prealpha-banner"
      icon="i-lucide-flask-conical"
      title="Vy UI and Vue-Lynx are pre-alpha — breaking changes ahead."
      close
      :ui="{
        root: 'bg-(--color-vue-mint) border-b border-(--color-ink)/10',
        title: 'text-sm font-medium truncate text-(--color-ink)',
        icon: 'size-5 shrink-0 pointer-events-none text-(--color-ink)',
        close: '-me-1.5 lg:me-0 text-(--color-ink) hover:bg-(--color-ink)/10 focus-visible:bg-(--color-ink)/10',
      }"
    />

    <AppHeader />

    <AppDocsNav />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />
  </UApp>
</template>
