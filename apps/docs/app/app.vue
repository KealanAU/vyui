<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const { seo, header } = useAppConfig()
const { public: { siteUrl } } = useRuntimeConfig()
const url = useRequestURL()

// `package` (kit | core) drives the Components Core/Kit sub-filter; it must be
// requested explicitly to appear on navigation nodes.
const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs', ['package']))

// The ⌘K palette stays fully dormant until first opened: mounting it eagerly
// pulls the fuse chunk on every page load, and the sections query drags in the
// sqlite WASM chunks (~400 KB). `open` is the shared state the header button
// writes to; the shortcut below covers ⌘K while the palette (which normally
// owns it) isn't mounted yet.
const { open: searchOpen } = useContentSearch()
const searchActivated = ref(false)
const { data: searchSections, execute: loadSearchSections } = useLazyAsyncData('search-sections', () => queryCollectionSearchSections('docs'), { server: false, immediate: false })
watch(searchOpen, () => {
  searchActivated.value = true
  void loadSearchSections()
}, { once: true })
defineShortcuts(computed(() => searchActivated.value ? {} : { meta_k: () => { searchOpen.value = true } }))

// On a phone the whole nav tree (~150 rows) buries the search input, so the
// palette opens on header.quickLinks and only gets the tree once there's a term
// to match. 639px = the `sm` stop where the palette stops being full-height.
const isPhone = useMediaQuery('(max-width: 639px)')
const searchTerm = ref('')

// Canonical = configured site origin + path only. Using siteUrl (not url.origin,
// which is localhost during static prerender) keeps the production host; dropping
// the query string and trailing slash stops ?foo=bar and /path vs /path/ from
// splitting ranking signals.
const canonical = `${siteUrl}${url.pathname.replace(/\/$/, '')}`

useHead({
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'canonical', href: canonical },
  ],
})

useSeoMeta({
  titleTemplate: `%s — ${seo?.siteName}`,
  ogSiteName: seo?.siteName,
  ogType: 'website',
  ogUrl: canonical,
  ogLocale: 'en_US',
  ogImageAlt: 'Vy UI — components for Vue-Lynx',
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
      id="alpha-banner"
      icon="i-lucide-flask-conical"
      title="Vy UI is alpha and Vue-Lynx is pre-alpha — breaking changes ahead."
      close
      :ui="{
        root: 'bg-(--color-vue-mint) border-b border-(--color-ink)/10',
        title: 'text-sm font-medium truncate text-(--color-ink)',
        icon: 'size-5 shrink-0 pointer-events-none text-(--color-ink)',
        close: '-me-1.5 lg:me-0 text-(--color-ink) hover:bg-(--color-ink)/10 focus-visible:bg-(--color-ink)/10',
      }"
    />

    <AppHeader />

    <ClientOnly>
      <LazyUContentSearch
        v-if="searchActivated"
        v-model:search-term="searchTerm"
        :files="searchSections"
        :navigation="isPhone && !searchTerm ? undefined : navigation"
        :links="isPhone ? header?.quickLinks : undefined"
        :fuse="{ resultLimit: 42 }"
        :ui="{ modal: 'h-auto' }"
      />
    </ClientOnly>

    <AppDocsNav />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />
  </UApp>
</template>
