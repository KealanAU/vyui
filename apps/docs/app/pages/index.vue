<script setup lang="ts">
const coreInstall = `pnpm add @vyui/core`
const kitInstall = `pnpm add @vyui/core @vyui/kit`

const coreUsage = `<script setup>
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from '@vyui/core'
import { ref } from 'vue'

const value = ref(50)
<\/script>

<template>
  <SliderRoot v-model="value" :max="100">
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb />
  </SliderRoot>
</template>`

const kitPluginUsage = `// src/index.ts
import { createApp } from '@lynx-js/vue'
import { VyUI } from '@vyui/kit'
import '@vyui/kit/style.css'
import App from './App.vue'

createApp(App).use(VyUI).mount('#app')`

const kitUsage = `<script setup>
import { VyButton, VySlider } from '@vyui/kit'
import { ref } from 'vue'

const value = ref(50)
<\/script>

<template>
  <VySlider v-model="value" :max="100" />
  <VyButton variant="solid" color="primary">Save</VyButton>
</template>`

const packages = [
  {
    name: '@vyui/core',
    tag: 'Headless',
    description:
      'Behavioral primitives — accessibility, state, focus, keyboard, gestures. You bring the styles. Inspired by Reka UI and Radix.',
    icon: 'i-lucide-box',
    points: [
      '47 primitives — Dialog, Sheet, Popover, Combobox, Slider, Swiper, Sortable, …',
      'Native-first for Lynx’s <view> / <text> rendering model',
      'Zero styling opinions — compose your own design system on top',
    ],
    cta: { label: 'View on npm', to: 'https://www.npmjs.com/package/@vyui/core', target: '_blank' },
  },
  {
    name: '@vyui/kit',
    tag: 'Styled',
    description:
      'Opinionated styled components built on top of @vyui/core. Drop-in Vy* components with a Tailwind Variants theme.',
    icon: 'i-lucide-palette',
    points: [
      '44 styled components — VyButton, VyDrawer, VyModal, VyToast, VyIsland, …',
      'Themeable via Tailwind Variants (createTv) and an app config object',
      'Re-exports keyboard-aware + icon primitives from core for convenience',
    ],
    cta: { label: 'Coming to npm', disabled: true, color: 'neutral' as const },
  },
]

const decisionPoints = [
  {
    title: 'Use @vyui/core if…',
    icon: 'i-lucide-pencil-ruler',
    body: 'You already have a design system, a Tailwind theme, or strong visual opinions. You want raw behavior and a11y — no painted defaults.',
  },
  {
    title: 'Use @vyui/kit if…',
    icon: 'i-lucide-paintbrush',
    body: 'You want to ship fast with sensible defaults. Kit gives you styled Vy* components on top of core, ready to drop into a Lynx app.',
  },
  {
    title: 'Mix them freely',
    icon: 'i-lucide-blocks',
    body: 'Kit re-exports everything you need from core. Start with kit, drop down to core primitives anywhere you need bespoke styling.',
  },
]
</script>

<template>
  <UPageHero
    title="Headless components for Vue-Lynx — coming soon"
    description="Vy UI brings Radix-style primitives and an opinionated styled kit to ByteDance’s native cross-platform framework. The packages exist, the demos run, and most things are still broken. This page is a preview of what’s being built."
    :links="[
      { label: 'Star on GitHub', to: 'https://github.com/KealanAU/vyui', target: '_blank', icon: 'i-simple-icons-github' },
      { label: 'See what’s shipping', to: '#packages', color: 'neutral', variant: 'subtle', trailingIcon: 'i-lucide-arrow-down' },
    ]"
  >
    <template #top>
      <div class="mb-4 flex flex-wrap items-center justify-center gap-2">
        <UBadge
          color="warning"
          variant="subtle"
          icon="i-lucide-flask-conical"
          label="Pre-alpha"
        />
        <UBadge
          color="neutral"
          variant="subtle"
          icon="i-lucide-construction"
          label="Under construction"
        />
        <UBadge
          color="primary"
          variant="subtle"
          icon="i-lucide-sparkles"
          label="Docs coming soon"
        />
      </div>
    </template>
  </UPageHero>

  <section class="border-default border-y">
    <UContainer class="py-6">
      <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-triangle-alert" class="text-warning mt-0.5 size-5 flex-none" />
          <p class="text-muted text-sm">
            <span class="text-highlighted font-medium">Heads up:</span>
            most things below are aspirational. Vue-Lynx itself is pre-alpha and Vy UI is too. APIs will change. Things will break. Don’t ship this to production yet.
          </p>
        </div>
        <UButton
          to="https://github.com/KealanAU/vyui"
          target="_blank"
          icon="i-simple-icons-github"
          color="neutral"
          variant="subtle"
          size="sm"
          label="Follow on GitHub"
        />
      </div>
    </UContainer>
  </section>

  <UPageSection
    id="packages"
    headline="Packages"
    title="Two layers, one ecosystem"
    description="Pick the level of opinion you want. Drop down to primitives whenever you need to."
  >
    <UPageGrid class="lg:grid-cols-2">
      <UPageCard
        v-for="pkg in packages"
        :key="pkg.name"
        :title="pkg.name"
        :description="pkg.description"
        :icon="pkg.icon"
        spotlight
      >
        <template #footer>
          <ul class="text-muted mb-4 space-y-1.5 text-sm">
            <li v-for="point in pkg.points" :key="point" class="flex gap-2">
              <UIcon name="i-lucide-check" class="text-primary mt-0.5 size-4 flex-none" />
              <span>{{ point }}</span>
            </li>
          </ul>
          <UButton
            :label="pkg.cta.label"
            :to="pkg.cta.to"
            :target="pkg.cta.target"
            :disabled="pkg.cta.disabled"
            :color="pkg.cta.color ?? 'primary'"
            variant="subtle"
            trailing-icon="i-lucide-arrow-right"
            size="sm"
          />
        </template>
        <template #leading>
          <UBadge :label="pkg.tag" color="neutral" variant="subtle" size="sm" />
        </template>
      </UPageCard>
    </UPageGrid>

    <UPageGrid class="mt-8 lg:grid-cols-3">
      <UPageFeature
        v-for="item in decisionPoints"
        :key="item.title"
        :title="item.title"
        :description="item.body"
        :icon="item.icon"
        orientation="vertical"
      />
    </UPageGrid>
  </UPageSection>

  <UPageSection
    id="install"
    headline="Install"
    title="Get started in two minutes"
    description="Vy UI runs inside any Vue-Lynx app. Pick the path that matches how much you want bundled."
  >
    <div class="mx-auto max-w-3xl">
      <UAlert
        icon="i-lucide-triangle-alert"
        color="warning"
        variant="subtle"
        title="Local workspace install is the dependable path"
        description="The npm-published @vyui/core@0.0.2 is known to crash on first touch due to an upstream vue-lynx MT-loader regression. Until that fix lands, clone the repo and work against the workspace packages."
        class="mb-6"
      />

      <UTabs
        :items="[
          { label: '@vyui/core only', icon: 'i-lucide-box', slot: 'core' },
          { label: '@vyui/core + @vyui/kit', icon: 'i-lucide-palette', slot: 'kit' },
        ]"
        variant="link"
        class="gap-4"
      >
        <template #core>
          <p class="text-muted mb-3 text-sm">
            Install the primitives layer and write your own styles.
          </p>
          <pre class="bg-muted ring-default mb-4 overflow-x-auto rounded-md p-4 text-sm ring"><code>{{ coreInstall }}</code></pre>

          <h4 class="text-highlighted mb-2 text-sm font-medium">Use a primitive</h4>
          <pre class="bg-muted ring-default overflow-x-auto rounded-md p-4 text-xs ring"><code>{{ coreUsage }}</code></pre>
        </template>

        <template #kit>
          <p class="text-muted mb-3 text-sm">
            Install both packages and register the kit plugin once in your app entry.
          </p>
          <pre class="bg-muted ring-default mb-4 overflow-x-auto rounded-md p-4 text-sm ring"><code>{{ kitInstall }}</code></pre>

          <h4 class="text-highlighted mb-2 text-sm font-medium">Register the plugin</h4>
          <pre class="bg-muted ring-default mb-4 overflow-x-auto rounded-md p-4 text-xs ring"><code>{{ kitPluginUsage }}</code></pre>

          <h4 class="text-highlighted mb-2 text-sm font-medium">Use Vy* components</h4>
          <pre class="bg-muted ring-default overflow-x-auto rounded-md p-4 text-xs ring"><code>{{ kitUsage }}</code></pre>
        </template>
      </UTabs>
    </div>
  </UPageSection>

  <UPageSection
    id="theming"
    headline="Theming"
    title="Tailwind Variants, not opinions"
    description="@vyui/kit ships a real theme system today — every styled component has its own theme file backed by Tailwind Variants, and the whole thing is overridable at runtime."
    :features="[
      { title: 'Per-component themes', description: 'Each Vy* component reads a theme file under packages/kit/src/theme. Override slots, variants, and defaults without forking the source.', icon: 'i-lucide-palette' },
      { title: 'createTv + tv()', description: 'Re-exported from @vyui/kit so you can compose your own variants on top, with the same DX as Nuxt UI or shadcn.', icon: 'i-lucide-wand-sparkles' },
      { title: 'Runtime app config', description: 'Pass overrides to the VyUI plugin at mount time. No build step. Theme keys are deep-merged into the defaults.', icon: 'i-lucide-sliders-horizontal' },
    ]"
  />

  <UPageSection
    id="icons"
    headline="Icons"
    title="Bring your own, via Iconify"
    description="@vyui/core ships an <Icon> primitive that accepts any Iconify name. There is no bundled icon set — pick a collection at icones.js.org, install the @iconify-json package, and use it."
  >
    <div class="mx-auto max-w-3xl">
      <pre class="bg-muted ring-default mb-4 overflow-x-auto rounded-md p-4 text-sm ring"><code>pnpm add @iconify-json/lucide</code></pre>
      <pre class="bg-muted ring-default overflow-x-auto rounded-md p-4 text-xs ring"><code>&lt;script setup&gt;
import { Icon } from '@vyui/core'
&lt;/script&gt;

&lt;template&gt;
  &lt;Icon name="i-lucide-sparkles" :size="20" color="#6366f1" /&gt;
&lt;/template&gt;</code></pre>
      <p class="text-muted mt-4 text-sm">
        Names work in either form — <code class="text-highlighted">i-lucide-folder</code> or <code class="text-highlighted">lucide:folder</code>. Browse 200,000+ icons across collections at
        <ULink to="https://icones.js.org" target="_blank" class="text-primary">icones.js.org</ULink>.
      </p>
      <p class="text-muted mt-2 text-sm">
        Lynx's native <code class="text-highlighted">&lt;svg&gt;</code> rasterizes the XML and can't inherit
        <code class="text-highlighted">currentColor</code> from a surrounding <code class="text-highlighted">&lt;text&gt;</code>, so the
        <code class="text-highlighted">color</code> prop is required to tint an icon.
      </p>
    </div>
  </UPageSection>

  <UPageSection
    headline="Targets"
    title="One codebase, three targets"
    description="Vue-Lynx is ByteDance’s open-source native cross-platform framework — the same one powering parts of TikTok."
    :features="[
      { title: 'iOS', description: 'Native UIView rendering via Lynx Explorer or your own LynxView host.', icon: 'i-simple-icons-apple' },
      { title: 'Android', description: 'Native View rendering; ship inside your Android app via the Lynx runtime.', icon: 'i-simple-icons-android' },
      { title: 'Web', description: 'Lynx Web target compiles to a browser bundle for previews and progressive rollouts.', icon: 'i-lucide-globe' },
    ]"
  />

  <UPageSection
    id="roadmap"
    headline="Roadmap"
    title="What’s next"
    description="Vy UI is pre-alpha. The list below is aspirational — none of it ships yet. It shows where the project is headed."
  >
    <div class="mx-auto max-w-2xl">
      <ul class="space-y-3">
        <li
          v-for="item in [
            { label: '@vyui/core primitives', state: 'in-progress', detail: 'Published as ^0.0.2 with a known MT-loader regression awaiting an upstream fix.' },
            { label: '@vyui/kit on npm', state: 'todo', detail: 'Styled-component package, currently workspace-only.' },
            { label: '@vyui/cli', state: 'todo', detail: 'shadcn-style CLI for adding individual styled components — npx @vyui add button.' },
            { label: 'Hosted registry', state: 'todo', detail: 'vyui.dev/registry/* JSON manifests with source, dependencies, file destinations.' },
            { label: 'Component documentation', state: 'todo', detail: 'Per-component reference, props, examples, demos — generated from real source so it stays in sync.' },
            { label: 'Starter templates', state: 'todo' },
            { label: 'Cross-target testing (iOS / Android / Web)', state: 'todo' },
          ]"
          :key="item.label"
          class="ring-default rounded-md p-4 ring"
        >
          <div class="flex items-start gap-3">
            <UIcon
              :name="item.state === 'in-progress' ? 'i-lucide-loader' : 'i-lucide-circle-dashed'"
              :class="item.state === 'in-progress' ? 'text-warning size-5 mt-0.5' : 'text-muted size-5 mt-0.5'"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-highlighted font-medium">{{ item.label }}</span>
                <UBadge
                  :label="item.state === 'in-progress' ? 'In progress' : 'Planned'"
                  :color="item.state === 'in-progress' ? 'warning' : 'neutral'"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <p v-if="item.detail" class="text-muted mt-1 text-sm">{{ item.detail }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </UPageSection>

  <UPageCTA
    title="Component docs are on the way"
    description="A per-component reference with props, slots, events, and live demos is the next thing being built. Until then, the source is the documentation — clone the repo or browse on GitHub."
    :links="[
      { label: 'Browse on GitHub', to: 'https://github.com/KealanAU/vyui', target: '_blank', icon: 'i-simple-icons-github' },
      { label: 'Read CONTRIBUTING.md', to: 'https://github.com/KealanAU/vyui/blob/main/CONTRIBUTING.md', target: '_blank', color: 'neutral', variant: 'subtle', trailingIcon: 'i-lucide-arrow-right' },
    ]"
  />
</template>
