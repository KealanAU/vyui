<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

// `name` is the example id (kebab basename) of a generated example chunk.
const props = withDefaults(defineProps<{
  name: string
  height?: string
}>(), {
  height: '360px',
})

const tab = ref<'preview' | 'code'>('preview')
// Fetched on the first switch to Code, so the preview-only default costs nothing.
const example = useExample(() => props.name, () => tab.value === 'code')
const source = computed(() => example.value?.source ?? '')
const highlighted = computed(() => example.value?.highlighted ?? '')
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
        :disabled="!source"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="copy(source)"
      />
    </div>
    <ClientOnly v-if="tab === 'preview'">
      <div class="preview-canvas">
        <span class="preview-glow preview-glow-one" />
        <span class="preview-glow preview-glow-two" />
        <div class="relative z-[1] w-full">
          <LynxPreview :name="name" :height="height" />
        </div>
      </div>
      <template #fallback>
        <div class="preview-canvas">
          <div class="relative z-[1] flex flex-col items-center justify-center gap-3" :style="{ height }" aria-hidden="true">
            <div class="preview-skeleton h-9 w-40 rounded-full" />
            <div class="preview-skeleton h-3 w-52 rounded-full" />
            <div class="preview-skeleton h-3 w-36 rounded-full" />
          </div>
        </div>
      </template>
    </ClientOnly>

    <template v-else>
      <!-- eslint-disable-next-line vue/no-v-html -- trusted build-time Shiki output -->
      <div
        v-if="highlighted"
        class="component-code-shiki max-h-[480px] overflow-auto text-[13px] leading-relaxed"
        v-html="highlighted"
      />
      <!-- Code lines, faked, while the example chunk loads. -->
      <div v-else class="flex flex-col gap-2.5 p-4" aria-hidden="true">
        <div v-for="w in ['w-2/5', 'w-4/5', 'w-3/5', 'w-3/4', 'w-1/3', 'w-2/3']" :key="w" class="preview-skeleton h-3 rounded" :class="w" />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Grid + glow surface, so the live preview reads as distinct from the page. */
.preview-canvas {
  position: relative;
  overflow: hidden;
  padding: 1.5rem 1.25rem;
  display: grid;
  place-items: center;
  background:
    linear-gradient(var(--ui-border-muted) 1px, transparent 1px),
    linear-gradient(90deg, var(--ui-border-muted) 1px, transparent 1px),
    color-mix(in srgb, var(--ui-bg-muted) 55%, var(--ui-bg));
  background-size: 26px 26px;
}
.preview-glow {
  position: absolute;
  width: 14rem;
  height: 14rem;
  border-radius: 999px;
  filter: blur(55px);
  opacity: .2;
  pointer-events: none;
}
.preview-glow-one { top: -6rem; left: 8%; background: #42b883; }
.preview-glow-two { right: 5%; bottom: -7rem; background: #818cf8; }

.component-code-shiki :deep(pre.shiki) {
  margin: 0;
  padding: 1rem;
  white-space: pre;
}

/* Skeleton shown during hydration, mirroring LynxPreview's own boot skeleton. */
.preview-skeleton {
  position: relative;
  overflow: hidden;
  background: color-mix(in srgb, var(--ui-bg-elevated) 70%, var(--ui-bg));
}
.preview-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ui-bg-elevated) 40%, transparent),
    transparent
  );
  animation: preview-shimmer 1.4s ease-in-out infinite;
}
@keyframes preview-shimmer {
  100% { transform: translateX(100%); }
}
@media (prefers-reduced-motion: reduce) {
  .preview-skeleton::after { animation: none; }
}
</style>
