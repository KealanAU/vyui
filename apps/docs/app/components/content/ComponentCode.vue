<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { examples } from '~/generated/examples'

// `name` is the example id (kebab basename) in the generated source manifest.
const props = withDefaults(defineProps<{
  name: string
  height?: string
}>(), {
  height: '360px',
})

const tab = ref<'preview' | 'code'>('preview')
const source = computed(() => examples[props.name]?.source ?? '')
const highlighted = computed(() => examples[props.name]?.highlighted ?? '')
const { copy, copied } = useClipboard({ source })
</script>

<template>
  <div class="not-prose my-5 rounded-lg border border-default overflow-hidden">
    <div class="flex items-center justify-between border-b border-default bg-elevated/50 px-3 py-1.5">
      <div class="flex items-center gap-1">
        <UButton
          label="Preview"
          icon="i-lucide-play"
          color="neutral"
          :variant="tab === 'preview' ? 'soft' : 'ghost'"
          size="sm"
          @click="tab = 'preview'"
        />
        <UButton
          label="Code"
          icon="i-lucide-code-2"
          color="neutral"
          :variant="tab === 'code' ? 'soft' : 'ghost'"
          size="sm"
          @click="tab = 'code'"
        />
      </div>
      <UButton
        v-if="tab === 'code'"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="copy(source)"
      />
    </div>
    <ClientOnly v-if="tab === 'preview'">
      <div class="bg-muted/30 p-4">
        <LynxPreview :name="name" :height="height" />
      </div>
      <template #fallback>
        <div class="flex items-center justify-center text-sm text-muted" :style="{ height }">
          Loading Lynx preview…
        </div>
      </template>
    </ClientOnly>

    <template v-else>
      <!-- eslint-disable-next-line vue/no-v-html -- trusted build-time Shiki output -->
      <div
        class="component-code-shiki max-h-[480px] overflow-auto text-[13px] leading-relaxed"
        v-html="highlighted"
      />
      <pre v-if="!highlighted" class="p-4 m-0 text-[13px]"><code>{{ source }}</code></pre>
    </template>
  </div>
</template>

<style scoped>
.component-code-shiki :deep(pre.shiki) {
  margin: 0;
  padding: 1rem;
  white-space: pre;
}
</style>
