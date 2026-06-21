<script setup lang="ts">
import type { LynxViewElement } from '@lynx-js/web-core/client'

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
const failed = ref(false)
const errorMessage = ref('')
let lynxView: LynxViewElement | undefined

onMounted(async () => {
  try {
    await import('@lynx-js/web-core/client')

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
    el.addEventListener('error', (event) => {
      failed.value = true
      errorMessage.value = (event as CustomEvent<{ error?: Error }>).detail?.error?.message || 'The Lynx web runtime could not load this example.'
    })
    host.value.appendChild(el)
  }
  catch (error) {
    failed.value = true
    errorMessage.value = error instanceof Error ? error.message : 'The Lynx web runtime could not start.'
  }
})

onBeforeUnmount(() => {
  lynxView?.remove()
  lynxView = undefined
})
</script>

<template>
  <div class="not-prose flex items-center justify-center w-full overflow-hidden">
    <div
      v-if="failed"
      class="flex min-h-48 w-full flex-col items-center justify-center gap-2 px-6 py-8 text-center"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-5 text-warning" />
      <p class="text-sm font-medium text-highlighted">Live preview unavailable</p>
      <p class="max-w-md text-xs text-muted">{{ errorMessage }}</p>
    </div>
    <div
      ref="host"
      class="w-full"
      :style="{ height }"
    />
  </div>
</template>
