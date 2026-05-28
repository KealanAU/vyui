<script setup lang="ts">
const appConfig = useAppConfig()

interface UnghRelease {
  name?: string
  tag: string
  publishedAt: string
  markdown: string
}

const { data: versions } = await useFetch(
  computed(() => `https://ungh.cc/repos/${appConfig.repository}/releases`),
  {
    transform: (data: { releases: UnghRelease[] }) => {
      return data.releases.map(release => ({
        tag: release.tag,
        title: release.name || release.tag,
        date: release.publishedAt,
        markdown: release.markdown,
      }))
    },
  },
)

useSeoMeta({
  title: 'Changelog',
  description: 'Release notes for Vy UI — @vyui/core and @vyui/kit.',
})
</script>

<template>
  <UContainer>
    <div class="py-12 sm:py-16">
      <div class="mb-12 max-w-2xl">
        <h1 class="text-highlighted text-4xl font-semibold tracking-tight sm:text-5xl">
          Changelog
        </h1>
        <p class="text-muted mt-3 text-base sm:text-lg">
          Release notes for <code class="text-highlighted">@vyui/core</code> and <code class="text-highlighted">@vyui/kit</code>, pulled directly from GitHub releases.
        </p>
      </div>

      <UAlert
        v-if="!versions?.length"
        icon="i-lucide-flask-conical"
        color="warning"
        variant="subtle"
        title="No releases yet"
        description="Vy UI is pre-alpha. This page will populate as we cut the first GitHub releases."
      />

      <UChangelogVersions
        v-else
        :indicator-motion="false"
        :ui="{
          root: 'pb-8',
          indicator: 'inset-y-0',
        }"
      >
        <UChangelogVersion
          v-for="version in versions"
          :key="version.tag"
          v-bind="version"
          :ui="{
            root: 'flex items-start',
            container: 'max-w-2xl min-w-0',
            header: 'border-b border-default pb-4',
            title: 'text-3xl',
            date: 'text-xs/9 text-highlighted font-mono',
            indicator: 'sticky top-16 pt-8 -mt-8',
          }"
        >
          <template #body>
            <MDC
              v-if="version.markdown"
              :value="version.markdown"
            />
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </div>
  </UContainer>
</template>
