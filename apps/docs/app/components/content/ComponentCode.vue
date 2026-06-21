<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { examples } from '~/generated/examples'

// `name` is the example id (kebab basename) in the generated source manifest.
// NOTE: the live `<lynx-view>` preview is temporarily hidden (the Lynx web
// runtime embed is being reworked) — we render the source only for now. The
// preview wiring lives in LynxPreview.vue, ready to re-enable.
const props = defineProps<{
  name: string
  height?: string
}>()

const source = computed(() => examples[props.name]?.source ?? '')
const highlighted = computed(() => examples[props.name]?.highlighted ?? '')
const { copy, copied } = useClipboard({ source })
</script>

<template>
  <div class="not-prose my-5 rounded-lg border border-default overflow-hidden">
    <div class="flex items-center justify-between border-b border-default bg-elevated/50 px-3 py-1.5">
      <span class="text-xs text-muted font-medium">{{ name }}.vue</span>
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="copy(source)"
      />
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -- trusted build-time Shiki output -->
    <div
      class="component-code-shiki max-h-[480px] overflow-auto text-[13px] leading-relaxed"
      v-html="highlighted"
    />
    <pre v-if="!highlighted" class="p-4 m-0 text-[13px]"><code>{{ source }}</code></pre>
  </div>
</template>

<style scoped>
.component-code-shiki :deep(pre.shiki) {
  margin: 0;
  padding: 1rem;
  white-space: pre;
}
</style>
