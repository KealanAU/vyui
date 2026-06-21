<script setup lang="ts">
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

onMounted(async () => {
  try {
    await import('@lynx-js/web-core/client')
    await import('@lynx-js/web-elements/all')
    await import('@lynx-js/web-elements/index.css')

    if (!host.value) return
    const el = document.createElement('lynx-view') as HTMLElement & {
      globalProps?: Record<string, unknown>
    }
    el.setAttribute('url', '/playground/main.web.bundle')
    el.globalProps = { example: props.name }
    el.style.width = '100%'
    el.style.height = props.height
    el.addEventListener('error', () => { failed.value = true })
    host.value.appendChild(el)
  }
  catch {
    failed.value = true
  }
})
</script>

<template>
  <div class="not-prose flex items-center justify-center w-full overflow-hidden">
    <div
      v-if="failed"
      class="text-sm text-error w-full text-center py-8"
    >
      Failed to load live preview.
    </div>
    <div
      ref="host"
      class="w-full"
      :style="{ height }"
    />
  </div>
</template>
