<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { findPageBreadcrumb, findPageHeadline } from '@nuxt/content/utils'

definePageMeta({
  layout: 'docs',
})

const route = useRoute()
const { toc } = useAppConfig()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { data: page } = await useAsyncData(route.path, () => queryCollection('docs').path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, async () => {
  const items = await queryCollectionItemSurroundings('docs', route.path, {
    fields: ['description'],
  })
  // Drop icons from the prev/next cards to match the iconless sidebar.
  return items?.map(item => (item ? { ...item, icon: undefined, navigation: undefined } : item))
})

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
})

// Mark every docs page as a TechArticle so it's eligible for richer dev-content
// treatment; headline/description carry the page's Vue-Lynx / native framing.
// BreadcrumbList mirrors the sidebar hierarchy so search results can show the
// section trail (e.g. Components > Accordion) instead of a bare URL.
const breadcrumb = computed(() =>
  (findPageBreadcrumb(navigation?.value, page.value?.path) ?? [])
    .filter(item => item.path)
    .map(item => ({ name: item.title, item: item.path })),
)

useSchemaOrg([
  defineArticle({
    '@type': 'TechArticle',
    headline: title,
    description,
  }),
  defineBreadcrumb({ itemListElement: breadcrumb.value }),
])

// Per-page social card (rendered to PNG at build time).
defineOgImage('Default', { title, description })

const headline = computed(() => findPageHeadline(navigation?.value, page.value?.path))

const links = computed(() => toc?.bottom?.links || [])

const componentCliCommand = computed(() => {
  if (!page.value?.path?.startsWith('/components/') || page.value.package !== 'kit')
    return undefined

  const name = page.value.path.split('/').pop()
  return name ? `npx @vyui/cli add ${name}` : undefined
})
</script>

<template>
  <UPage v-if="page">
    <UPageHeader
      :title="page.title"
      :description="page.description"
      :headline="headline"
    >
      <template #links>
        <UButton
          v-for="(link, index) in page.links"
          :key="index"
          v-bind="link"
        />
        <PageActions />
      </template>
    </UPageHeader>

    <UPageBody>
      <div
        v-if="componentCliCommand"
        class="not-prose mb-8 rounded-lg border border-default bg-elevated/40 p-4"
      >
        <div class="mb-3 flex items-center gap-2 text-sm font-medium text-highlighted">
          <UIcon
            name="i-lucide-terminal"
            class="size-4 text-primary"
          />
          Install with the CLI
        </div>

        <pre class="overflow-x-auto rounded-md bg-inverted px-3 py-2 text-sm text-inverted"><code>{{ componentCliCommand }}</code></pre>
      </div>

      <ContentRenderer
        v-if="page"
        :value="page"
      />

      <USeparator v-if="surround?.length" />

      <UContentSurround :surround="surround" />
    </UPageBody>

    <template
      v-if="page?.body?.toc?.links?.length"
      #right
    >
      <UContentToc
        :title="toc?.title"
        :links="page.body?.toc?.links"
      >
        <template
          v-if="toc?.bottom"
          #bottom
        >
          <div
            class="hidden lg:block space-y-6"
            :class="{ 'mt-6!': page.body?.toc?.links?.length }"
          >
            <USeparator
              v-if="page.body?.toc?.links?.length"
              type="dashed"
            />

            <UPageLinks
              :title="toc.bottom.title"
              :links="links"
            />
          </div>
        </template>
      </UContentToc>
    </template>
  </UPage>
</template>
