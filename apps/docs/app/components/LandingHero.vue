<script setup lang="ts">
// Live, interactive demos rendered through the same Lynx web bundle the docs
// use (<LynxPreview> boots a real <lynx-view> per phone). Kept to three so the
// hero only spins up a few Web Workers, and each one lazy-mounts when it
// scrolls into view.
const demos = [
  { name: 'switch-example', label: 'Switch', package: '@vyui/kit' },
  { name: 'tabs-example', label: 'Tabs', package: '@vyui/kit' },
  { name: 'slider-example', label: 'Slider', package: '@vyui/kit' },
]

const words = ['Headless', 'Styled']

// Typewriter timings (ms).
const TYPE_DELAY = 180
const DELETE_DELAY = 110
const WORD_PAUSE = 3000
const CURSOR_BLINK = 530

const display = ref(words[0])
const cursor = ref(true)

let timer: ReturnType<typeof setTimeout> | undefined
let blink: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  let wordIndex = 0
  let charIndex = words[0]!.length
  let deleting = false

  const tick = () => {
    const current = words[wordIndex]!

    if (deleting) {
      charIndex--
      display.value = current.slice(0, charIndex)
      if (charIndex === 0) {
        deleting = false
        wordIndex = (wordIndex + 1) % words.length
      }
    } else {
      charIndex++
      display.value = current.slice(0, charIndex)
      if (charIndex === current.length) {
        deleting = true
        // Pause on the full word before deleting again.
        timer = setTimeout(tick, WORD_PAUSE)
        return
      }
    }

    timer = setTimeout(tick, deleting ? DELETE_DELAY : TYPE_DELAY)
  }

  // Hold the initial word briefly, then start the loop.
  timer = setTimeout(() => {
    deleting = true
    tick()
  }, WORD_PAUSE)

  blink = setInterval(() => {
    cursor.value = !cursor.value
  }, CURSOR_BLINK)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (blink) clearInterval(blink)
})
</script>

<template>
  <UPageHero orientation="vertical">
    <template #headline>
      <div class="inline-flex items-center gap-2 rounded-full badge-aurora text-(--color-ink) px-3 py-1 text-xs font-medium tracking-tight">
        <UIcon name="i-lucide-flask-conical" class="size-3.5" />
        Pre-alpha — expect breaking changes
      </div>
    </template>

    <template #title>
      <span class="text-aurora" aria-hidden="true">{{ display }}</span><span
        class="text-aurora font-light"
        :class="cursor ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      >|</span>
      <span class="sr-only">Headless and styled</span> components for Vue-Lynx.
    </template>

    <template #description>
      The component library for Vue-Lynx. A styled kit on headless, accessible primitives, with native rendering across iOS, Android, and web — all from one Vue codebase. Pre-alpha. Shipping fast.
    </template>

    <template #body>
      <ClientOnly>
        <div class="grid gap-5 sm:grid-cols-3 w-full max-w-4xl mx-auto">
          <div
            v-for="demo in demos"
            :key="demo.name"
            class="rounded-xl border border-default bg-elevated/30 overflow-hidden"
          >
            <div class="flex items-center justify-between px-3 py-2 border-b border-default">
              <span class="text-xs font-semibold text-(--color-ink)">{{ demo.label }}</span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-(--color-vue-100) text-(--color-vue-700)">
                {{ demo.package }}
              </span>
            </div>
            <LynxPreview :name="demo.name" height="220px" />
          </div>
        </div>
      </ClientOnly>
    </template>
  </UPageHero>
</template>
