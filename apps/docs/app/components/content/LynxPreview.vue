<script setup lang="ts">
import type { LynxViewElement } from '@lynx-js/web-core/client'
import { loadLynxWebRuntime } from '~/utils/loadLynxWebRuntime'

// Renders a live @vyui/core example by loading the docs-playground web bundle
// into a Lynx `<lynx-view>` web-runtime element. The `name` selects which
// example the single shared bundle mounts (via `global-props`). Client-only:
// web-core registers a custom element and spins a Web Worker.
const props = withDefaults(defineProps<{
  name: string
  height?: string
}>(), {
  height: '320px',
})

const host = ref<HTMLElement>()
const loading = ref(true)
const failed = ref(false)
const errorMessage = ref('')
let lynxView: LynxViewElement | undefined
let observer: IntersectionObserver | undefined
// Safety net: if the card neither fires `load` nor `error` (e.g. an older
// bundle), reveal it anyway so the skeleton can't linger forever.
let revealTimer: ReturnType<typeof setTimeout> | undefined

// Each <lynx-view> boots its own Web Worker + WASM runtime, so mounting every
// preview on page load is expensive (a page can embed 6+). Defer the boot until
// the preview scrolls near the viewport; `rootMargin` warms it just before it's
// visible so it's ready by the time the reader reaches it.
onMounted(() => {
  if (!host.value) return
  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    observer?.disconnect()
    observer = undefined
    void mountPreview()
  }, { rootMargin: '200px' })
  observer.observe(host.value)
})

async function mountPreview() {
  try {
    await loadLynxWebRuntime()

    if (!host.value) return
    const el = document.createElement('lynx-view') as LynxViewElement
    lynxView = el
    el.setAttribute('url', '/playground/main.web.bundle')
    el.setAttribute('transform-vw', '')
    el.setAttribute('transform-vh', '')
    el.globalProps = { example: props.name }
    el.browserConfig = {
      pixelRatio: 2,
      pixelWidth: 390,
      pixelHeight: 640,
    }
    el.style.width = '100%'
    el.style.height = props.height
    // web-core dispatches `load` once the card's first screen is painted — that's
    // the cue to drop the skeleton and reveal the live preview.
    el.addEventListener('load', () => {
      loading.value = false
    })
    el.addEventListener('error', (event) => {
      failed.value = true
      loading.value = false
      const detail = (event as unknown as CustomEvent<{ error?: Error }>).detail
      errorMessage.value = detail?.error?.message || 'The Lynx web runtime could not load this example.'
    })
    host.value.appendChild(el)
    revealTimer = setTimeout(() => { loading.value = false }, 8000)
  }
  catch (error) {
    failed.value = true
    loading.value = false
    errorMessage.value = error instanceof Error ? error.message : 'The Lynx web runtime could not start.'
  }
}

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = undefined
  if (revealTimer) clearTimeout(revealTimer)
  lynxView?.remove()
  lynxView = undefined
})
</script>

<template>
  <div class="not-prose relative flex items-center justify-center w-full overflow-hidden">
    <div
      ref="host"
      class="w-full transition-opacity duration-300"
      :class="{ 'opacity-0': loading || failed }"
      :style="{ height }"
    />

    <!-- Placeholder while the Web Worker + WASM runtime boot and the card paints
         its first screen. Overlaid on the (still-empty) host so layout is stable. -->
    <div
      v-if="loading"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
      aria-hidden="true"
    >
      <div class="preview-skeleton h-9 w-40 rounded-full" />
      <div class="preview-skeleton h-3 w-52 rounded-full" />
      <div class="preview-skeleton h-3 w-36 rounded-full" />
    </div>

    <div
      v-if="failed"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 py-8 text-center"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-5 text-warning" />
      <p class="text-sm font-medium text-highlighted">Live preview unavailable</p>
      <p class="max-w-md text-xs text-muted">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Shimmering skeleton bar: a muted surface swept by a soft highlight so the
   deferred boot reads as "loading" rather than broken. */
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
