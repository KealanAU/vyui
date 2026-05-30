<script setup lang="ts">
const appConfig = useAppConfig()

interface UnghRelease {
  name?: string
  tag: string
  publishedAt: string
  markdown: string
}

// Post-alpha gate: once we ship 0.1.0 the 0.0.x pre-alpha releases stop being
// relevant. Uncomment MIN_VERSION + the `.filter` below to only show the
// changelog from 0.1.0 onward.
// const MIN_VERSION = [0, 1, 0]
// function gteMinVersion(version: string) {
//   const parts = version.split('.').map(n => Number.parseInt(n, 10) || 0)
//   for (let i = 0; i < MIN_VERSION.length; i++) {
//     if ((parts[i] ?? 0) > MIN_VERSION[i]) return true
//     if ((parts[i] ?? 0) < MIN_VERSION[i]) return false
//   }
//   return true
// }

const PACKAGES = [
  { key: 'core', label: '@vyui/core', prefix: '@vyui/core@' },
  { key: 'kit', label: '@vyui/kit', prefix: '@vyui/kit@' },
] as const

const { data: releases } = await useFetch(
  computed(() => `https://ungh.cc/repos/${appConfig.repository}/releases`),
  {
    transform: (data: { releases: UnghRelease[] }) => data.releases,
  },
)

const columns = computed(() =>
  PACKAGES.map(pkg => ({
    ...pkg,
    versions: (releases.value ?? [])
      .filter(release => release.tag.startsWith(pkg.prefix))
      // .filter(release => gteMinVersion(release.tag.slice(pkg.prefix.length)))
      .map(release => ({
        tag: release.tag,
        title: release.tag.slice(pkg.prefix.length),
        date: release.publishedAt,
        markdown: release.markdown,
      })),
  })),
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

      <div class="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        <section
          v-for="column in columns"
          :key="column.key"
        >
          <h2 class="text-highlighted mb-6 font-mono text-lg font-semibold">
            {{ column.label }}
          </h2>

          <UAlert
            v-if="!column.versions.length"
            icon="i-lucide-flask-conical"
            color="warning"
            variant="subtle"
            title="No releases yet"
            :description="`No ${column.label} releases have been cut yet.`"
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
              v-for="version in column.versions"
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
        </section>
      </div>
    </div>
  </UContainer>
</template>
