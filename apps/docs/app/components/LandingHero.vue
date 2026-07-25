<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const install = 'npm i @vyui/kit'
const { copy, copied } = useClipboard({ source: install })

// Dots mirror what each accent maps to in `@vyui/kit`'s style.css.
const COLORS = [
  { name: 'primary', dot: 'bg-green-500' },
  { name: 'secondary', dot: 'bg-blue-500' },
  { name: 'success', dot: 'bg-emerald-500' },
  { name: 'info', dot: 'bg-sky-500' },
  { name: 'warning', dot: 'bg-amber-500' },
  { name: 'error', dot: 'bg-red-500' },
  { name: 'neutral', dot: 'bg-slate-900 dark:bg-white' },
]

const active = ref(0)
const preview = useTemplateRef<{ send: (event: string, ...params: string[]) => void }>('preview')

const FIRST_MS = 1400
const ROTATE_MS = 3200
let rotate: ReturnType<typeof setTimeout> | undefined

// The card can only receive once it has booted, so push again on `ready`.
function push() {
  preview.value?.send('vyui:color', COLORS[active.value]!.name)
}

function cycle(wait: number) {
  rotate = setTimeout(() => {
    active.value = (active.value + 1) % COLORS.length
    cycle(ROTATE_MS)
  }, wait)
}

function pick(index: number) {
  if (rotate) clearTimeout(rotate)
  rotate = undefined
  active.value = index
}

watch(active, push)

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  cycle(FIRST_MS)
})

onBeforeUnmount(() => {
  if (rotate) clearTimeout(rotate)
})
</script>

<template>
  <section class="hero-beams relative overflow-hidden">
    <UContainer class="relative z-[1] py-16 sm:py-24">
      <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div class="max-w-xl">
          <div class="badge-aurora text-(--color-ink) inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-tight">
            <UIcon name="i-lucide-flask-conical" class="size-3.5" />
            Alpha — expect breaking changes
          </div>

          <h1 class="font-display mt-6 text-5xl leading-[1.05] tracking-tight text-highlighted sm:text-6xl">
            Headless &amp; styled<br>
            components for<br>
            <span class="text-aurora">Vue-Lynx.</span>
          </h1>

          <p class="mt-6 text-lg text-toned">
            A styled kit built on headless, accessible primitives — rendering natively to iOS, Android, and web from a single Vue codebase.
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <UButton
              label="Get started"
              to="/getting-started"
              size="lg"
              trailing-icon="i-lucide-arrow-right"
            />
            <UButton
              label="Browse components"
              to="/components"
              size="lg"
              color="neutral"
              variant="outline"
            />
          </div>

          <div class="mt-6 inline-flex items-center gap-3 rounded-full border border-default bg-default/70 py-1.5 pl-4 pr-1.5 backdrop-blur-sm">
            <code class="font-mono text-sm text-toned">
              <span class="text-dimmed select-none">$ </span>{{ install }}
            </code>
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="copied ? 'Copied' : 'Copy install command'"
              @click="copy(install)"
            />
          </div>
        </div>

        <div class="justify-self-center lg:justify-self-end">
          <div class="mb-5 flex items-center justify-center gap-2.5" role="group" aria-label="Accent color">
            <button
              v-for="(item, index) in COLORS"
              :key="item.name"
              type="button"
              class="swatch"
              :class="item.dot"
              :data-active="index === active"
              :aria-pressed="index === active"
              :aria-label="item.name"
              @click="pick(index)"
            />
          </div>

          <div class="device-frame">
            <div class="chrome" aria-hidden="true">
              <span class="island" />
            </div>

            <div class="device-screen">
              <ClientOnly>
                <LynxPreview ref="preview" name="landing-showcase" height="640px" @ready="push" />
                <template #fallback>
                  <div class="flex h-[640px] flex-col items-center justify-center gap-3" aria-hidden="true">
                    <div class="hero-skeleton h-10 w-40 rounded-full" />
                    <div class="hero-skeleton h-3 w-52 rounded-full" />
                    <div class="hero-skeleton h-3 w-36 rounded-full" />
                  </div>
                </template>
              </ClientOnly>
            </div>

            <div class="chrome chrome-bottom" aria-hidden="true">
              <span class="home-indicator" />
            </div>
          </div>

          <p class="mt-4 text-center text-xs text-dimmed">
            Live — the Lynx web runtime, running @vyui/kit
          </p>
        </div>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.hero-beams::before {
  content: '';
  position: absolute;
  left: -50%;
  right: -50%;
  bottom: 0;
  height: 70%;
  pointer-events: none;
  transform: perspective(520px) rotateX(72deg);
  transform-origin: bottom center;
  background-image:
    repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--color-vue-500) 36%, transparent) 0 1px,
      transparent 1px 88px
    ),
    repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--color-vue-500) 30%, transparent) 0 1px,
      transparent 1px 88px
    );
  -webkit-mask-image: linear-gradient(to top, #000, transparent 82%);
  mask-image: linear-gradient(to top, #000, transparent 82%);
  /* One 88px cell per cycle — matches the pitch, so the loop is seamless. */
  animation: hero-warp 90s linear infinite;
}

.hero-beams::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 45% 60% at 78% 45%,
    color-mix(in srgb, var(--color-vue-200) 45%, transparent),
    transparent 70%
  );
}

.dark .hero-beams::after {
  background: radial-gradient(
    ellipse 45% 60% at 78% 45%,
    color-mix(in srgb, var(--color-vue-300) 12%, transparent),
    transparent 70%
  );
}

@keyframes hero-warp {
  to {
    background-position: 0 88px, 0 88px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-beams::before {
    animation: none;
  }
}

/* .device-screen stays a fixed 360px: the Lynx runtime sizes off its host, so
   the page inside lays out at a real handset width. */
.device-frame {
  position: relative;
  width: 376px;
  padding: 8px;
  border-radius: 2.75rem;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  box-shadow:
    0 1px 2px rgba(4, 23, 43, 0.04),
    0 24px 48px -24px rgba(4, 23, 43, 0.25);
}

.device-frame::before,
.device-frame::after {
  content: '';
  position: absolute;
  width: 3px;
  border-radius: 999px;
  background: var(--ui-border-accented);
}

.device-frame::before {
  left: -3px;
  top: 120px;
  height: 122px;
}

.device-frame::after {
  right: -3px;
  top: 150px;
  height: 76px;
}

.device-screen {
  width: 360px;
  border-radius: 2rem;
  overflow: hidden;
  background: var(--ui-bg);
}

.chrome {
  display: flex;
  height: 30px;
  align-items: center;
  justify-content: center;
}

.chrome-bottom {
  height: 22px;
}

.island {
  width: 76px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-ink-900);
}

.home-indicator {
  width: 112px;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-text) 55%, transparent);
}

.dark .island {
  background: #000;
}

@media (max-width: 420px) {
  .device-frame {
    width: 100%;
    padding: 6px;
  }
  .device-screen {
    width: 100%;
  }
}

/* Outline, not a border, so the row can't reflow as the rotation moves through it. */
.swatch {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  outline: 2px solid transparent;
  outline-offset: 3px;
  transition:
    outline-color 200ms ease,
    transform 160ms ease;
}

.swatch[data-active='true'] {
  outline-color: color-mix(in srgb, var(--ui-text) 45%, transparent);
}

.swatch:active {
  transform: scale(0.88);
}

@media (hover: hover) and (pointer: fine) {
  .swatch:hover {
    outline-color: color-mix(in srgb, var(--ui-text) 25%, transparent);
  }
}

.hero-skeleton {
  background: color-mix(in srgb, var(--ui-bg-elevated) 70%, var(--ui-bg));
}
</style>
