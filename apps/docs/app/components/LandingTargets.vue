<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const EXAMPLE = 'landing-profile'

// `at` is the phone's centre as a % of the cluster box.
const TARGETS = [
  {
    id: 'android',
    label: 'Android',
    icon: 'i-simple-icons-android',
    at: { left: '50%', top: '14%' },
  },
  {
    id: 'web',
    label: 'Web',
    icon: 'i-lucide-globe',
    at: { left: '24%', top: '76%' },
  },
  {
    id: 'ios',
    label: 'iOS',
    icon: 'i-simple-icons-apple',
    at: { left: '76%', top: '75%' },
  },
] as const

const showCode = ref(false)
const revealed = ref(false)
const root = ref<HTMLElement>()

// Mobile skips the phone cluster entirely (see the `display: none` below) and
// swaps the badge row for the source panel on the same toggle.
const isMobile = useMediaQuery('(max-width: 639px)')

const example = useExample(EXAMPLE, showCode)
const highlighted = computed(() => example.value?.highlighted ?? '')

let observer: IntersectionObserver | undefined

onMounted(() => {
  if (!root.value) return

  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    revealed.value = true
    observer?.disconnect()
    observer = undefined
  }, { rootMargin: '-10% 0px' })

  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = undefined
})
</script>

<template>
  <section ref="root" class="border-t border-default" :class="{ 'is-revealed': revealed }">
    <UContainer class="pb-16 pt-4 sm:pb-24 sm:pt-6">
      <div class="reveal mx-auto max-w-2xl text-center">
        <h2 class="font-display text-3xl tracking-tight text-highlighted sm:text-4xl">
          One source. Every target.
        </h2>
        <p class="mt-4 text-lg text-toned">
          <NuxtLink to="/guides/vue-lynx" class="underline decoration-dotted underline-offset-4 hover:text-highlighted">Vue-Lynx</NuxtLink> is ByteDance's open-source native cross-platform framework — the same one powering parts of TikTok. You write Vue once; Lynx renders it natively.
        </p>
      </div>

      <!-- Hidden via `visibility`, never v-if: each phone owns a Lynx runtime,
           so unmounting re-boots three Web Workers per toggle. -->
      <div class="reveal reveal-1 stage mx-auto mt-10 sm:mt-24">
        <!-- Mobile runs the same constellation with bare badges: the phones are
             ~80px wide there and cost three Lynx runtimes to render. -->
        <div class="cell dot-cluster sm:hidden" :data-hidden="showCode">
          <span class="cluster-dots" aria-hidden="true" />

          <span
            v-for="item in TARGETS"
            :key="item.id"
            class="badge dot"
            :class="`phone-${item.id}`"
            :style="item.at"
          >
            <span class="ring dot-ring ring-1" aria-hidden="true" />
            <span class="ring dot-ring ring-2" aria-hidden="true" />
            <UIcon :name="item.icon" class="badge-glyph" />
            <span class="sr-only">{{ item.label }}</span>
          </span>

          <button
            type="button"
            class="badge dot dot-source"
            :aria-expanded="showCode"
            aria-label="Show the shared source"
            @click="showCode = true"
          >
            <span class="ring dot-ring ring-1" aria-hidden="true" />
            <span class="ring dot-ring ring-2" aria-hidden="true" />
            <span class="mark">&lt;/&gt;</span>
          </button>
        </div>

        <div class="cell cluster" :data-hidden="showCode">
          <span class="cluster-dots" aria-hidden="true" />

          <div
            v-for="item in TARGETS"
            :key="item.id"
            class="phone"
            :class="`phone-${item.id}`"
            :style="item.at"
          >
            <span class="ring ring-1" aria-hidden="true" />
            <span class="ring ring-2" aria-hidden="true" />

            <div class="shell">
              <div class="chrome chrome-top" aria-hidden="true">
                <span v-if="item.id === 'ios'" class="island" />
                <span v-else-if="item.id === 'android'" class="punch-hole" />
                <template v-else>
                  <span class="light light-1" />
                  <span class="light light-2" />
                  <span class="light light-3" />
                  <span class="url">vyui.dev</span>
                </template>
              </div>

              <div class="screen">
                <ClientOnly>
                  <LynxPreview v-if="!isMobile" :name="EXAMPLE" height="540px" :pixel-ratio="1" />
                  <template #fallback>
                    <div class="screen-fallback" aria-hidden="true">
                      <div class="target-skeleton size-16 rounded-full" />
                      <div class="target-skeleton h-3 w-32 rounded-full" />
                      <div class="target-skeleton h-3 w-44 rounded-full" />
                    </div>
                  </template>
                </ClientOnly>
              </div>

              <div class="chrome chrome-bottom" aria-hidden="true">
                <span v-if="item.id === 'ios'" class="home-indicator" />
                <span v-else-if="item.id === 'android'" class="gesture-bar" />
              </div>
            </div>

            <span class="badge" aria-hidden="true">
              <UIcon :name="item.icon" class="badge-glyph" />
            </span>

            <span class="sr-only">{{ item.label }}</span>
          </div>

          <button
            type="button"
            class="node-source"
            :aria-expanded="showCode"
            aria-label="Show the shared source"
            @click="showCode = true"
          >
            <span class="halo">
              <span class="ring node-ring ring-1" aria-hidden="true" />
              <span class="ring node-ring ring-2" aria-hidden="true" />
              <span class="mark">&lt;/&gt;</span>
            </span>
          </button>
        </div>

        <div class="cell code-view" :data-hidden="!showCode">
          <div class="code-panel">
            <div class="code-bar">
              <UIcon name="i-lucide-file-code-2" class="size-3.5 shrink-0 text-dimmed" />
              <span class="flex-1 font-mono text-xs text-muted">Profile.vue</span>
              <span class="hidden text-xs text-dimmed sm:block">Running on all three</span>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Back to the devices"
                @click="showCode = false"
              />
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -- trusted build-time Shiki output -->
            <div v-if="highlighted" class="code-body" v-html="highlighted" />
            <div v-else class="code-body flex flex-col gap-2.5 p-4" aria-hidden="true">
              <div v-for="w in ['w-2/5', 'w-4/5', 'w-3/5', 'w-3/4', 'w-1/3', 'w-2/3', 'w-1/2']" :key="w" class="target-skeleton h-3 rounded" :class="w" />
            </div>
          </div>
        </div>
      </div>

    </UContainer>
  </section>
</template>

<style scoped>
section {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);

  --phone-w: 376px;
  --phone-h: 608px;
  --phone-scale: 0.22;
  --badge-size: calc(var(--phone-w) * var(--phone-scale) * 0.18);
  --node-size: calc(var(--phone-w) * var(--phone-scale) * 0.28);
}

.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 500ms var(--ease-out),
    transform 500ms var(--ease-out);
}

.is-revealed .reveal {
  opacity: 1;
  transform: none;
}

.reveal-1 { transition-delay: 60ms; }

.stage {
  display: grid;
  width: 100%;
  max-width: 56rem;
}

.cell {
  grid-area: 1 / 1;
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out),
    visibility 0s linear 0s;
}

.cell[data-hidden='true'] {
  opacity: 0;
  transform: scale(0.98);
  visibility: hidden;
  /* Delayed so the outgoing view doesn't vanish on frame one. */
  transition-delay: 0s, 0s, 220ms;
}

.cluster {
  position: relative;
  width: 100%;
  max-width: calc(var(--phone-w) * var(--phone-scale) * 4.6);
  height: calc(var(--phone-h) * var(--phone-scale) * 2.3);
  margin-inline: auto;
}

.cluster-dots {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 136%;
  height: 136%;
  translate: -50% -50%;
  background-image: radial-gradient(var(--ui-text-dimmed) 1.25px, transparent 1.25px);
  background-size: 9px 9px;
  -webkit-mask-image: radial-gradient(closest-side, #000, transparent 88%);
  mask-image: radial-gradient(closest-side, #000, transparent 88%);
  opacity: 0.45;
}

/* .screen stays a true 360px: the Lynx runtime sizes off its host, so shrinking
   it reflows the live page instead of scaling it. The wrapper reserves the
   scaled footprint and .shell is transform-scaled inside it. */
.phone {
  position: absolute;
  width: calc(var(--phone-w) * var(--phone-scale));
  height: calc(var(--phone-h) * var(--phone-scale));
  translate: -50% -50%;
}

.shell {
  /* Above the rings explicitly: `will-change` promotes each one to its own
     phone-sized layer, which would otherwise sit over the live screen. */
  position: relative;
  z-index: 1;
  width: var(--phone-w);
  padding: 8px;
  border-radius: 2.75rem;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  box-shadow:
    0 1px 2px rgba(4, 23, 43, 0.04),
    0 24px 48px -24px rgba(4, 23, 43, 0.25);
  transform: scale(var(--phone-scale));
  transform-origin: top left;
}

.phone-android .shell { border-radius: 1.75rem; }
.phone-web .shell { border-radius: 0.875rem; }

.screen {
  width: 360px;
  overflow: hidden;
  border-radius: 2rem;
  background: var(--ui-bg);
}

.phone-android .screen { border-radius: 1.125rem; }
.phone-web .screen { border-radius: 0.25rem; }

.screen-fallback {
  display: flex;
  height: 540px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
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

.phone-web .chrome-top {
  justify-content: flex-start;
  gap: 5px;
  padding: 0 12px;
}

.island {
  width: 76px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-ink-900);
}

.punch-hole {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--color-ink-900);
}

.home-indicator {
  width: 112px;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-text) 55%, transparent);
}

.gesture-bar {
  width: 76px;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-text) 40%, transparent);
}

.light {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.light-1 { background: #f0806c; }
.light-2 { background: #f5bd4f; }
.light-3 { background: #61c454; }

.url {
  margin-left: 10px;
  flex: 1;
  border-radius: 999px;
  background: var(--ui-bg-elevated);
  padding: 3px 10px;
  text-align: center;
  font-size: 10px;
  color: var(--ui-text-dimmed);
}

.dark .island,
.dark .punch-hole {
  background: #000;
}

.badge {
  position: absolute;
  z-index: 2;
  right: calc(var(--badge-size) * -0.29);
  top: calc(var(--badge-size) * -0.29);
  display: flex;
  width: var(--badge-size);
  height: var(--badge-size);
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--node);
  color: var(--node-glyph);
  box-shadow: 0 6px 16px -8px rgba(4, 23, 43, 0.5);
}

.badge-glyph {
  display: block;
  width: 50%;
  height: 50%;
}

/* `.badge` is already absolute; `at` supplies left/top like it does for a phone. */
.dot {
  --badge-size: 2.75rem;
  right: auto;
  translate: -50% -50%;
}

.dot-source {
  left: 50%;
  top: 50%;
  cursor: pointer;
  transition: scale 200ms var(--ease-out);
}

.dot-source:active {
  scale: 0.94;
}

/* `width` is load-bearing: every child is absolute, so without it the auto
   margins shrink-to-fit the box to 0 and the % positions all collapse. */
.dot-cluster {
  position: relative;
  width: 100%;
  height: 15rem;
  max-width: 20rem;
  margin-inline: auto;
}

/* The 136% bleed the desktop cluster uses would overflow the viewport here. */
.dot-cluster .cluster-dots {
  width: 100%;
}

.node-source { --node: var(--color-vue-400); }
.dot-source { --node: var(--color-vue-200); --node-glyph: var(--color-vue-950); }
.phone-ios { --node: #17191c; --node-glyph: #fff; }
.phone-android { --node: #3ddc84; --node-glyph: #fff; }
.phone-web { --node: #3b82f6; --node-glyph: #fff; }

.dark .phone-ios { --node: #f4f4f5; --node-glyph: #17191c; }
.dark .node-source,
.dark .dot-source { --node: var(--color-vue-300); }

.ring {
  position: absolute;
  inset: -10px;
  border-radius: 2.25rem;
  border: 1px solid color-mix(in srgb, var(--node) 20%, transparent);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* On the reveal class, not .ring: every ring then starts in the same style
   recalc and stays in phase for good. */
.is-revealed .ring {
  animation: phone-ping 4200ms linear infinite;
}

.is-revealed .ring-2 {
  animation-delay: 2100ms;
}

@keyframes phone-ping {
  0% { opacity: 0; transform: scale(0.98); }
  12% { opacity: 0.3; }
  100% { opacity: 0; transform: scale(1.16); }
}

/* Ripple finishes by 50% and sits invisible for the rest, so ring-2's 2100ms
   delay makes the two alternate instead of overlapping. */
@keyframes dot-ping {
  0% { opacity: 0; transform: scale(0.98); }
  6% { opacity: 0.3; }
  50%, 100% { opacity: 0; transform: scale(1.3); }
}

.node-source {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  display: flex;
  width: var(--node-size);
  flex-direction: column;
  align-items: center;
  translate: -50% -50%;
  cursor: pointer;
  transition: transform 200ms var(--ease-out);
}

.halo {
  display: flex;
  width: 100%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-vue-200);
  color: var(--color-vue-950);
  box-shadow: 0 8px 20px -12px rgba(4, 23, 43, 0.35);
  transition: transform 200ms var(--ease-out);
}

.dark .halo {
  background: var(--color-vue-300);
}

.node-ring {
  inset: calc(var(--node-size) * -0.475);
  border-radius: 999px;
}

/* Must stay after `.ring` — same specificity, so declaration order decides. */
.dot-ring {
  inset: -0.75rem;
  border-radius: 999px;
  border-width: 2px;
  border-color: var(--ui-text);
}

.is-revealed .dot-ring {
  animation-name: dot-ping;
}

.mark {
  position: relative;
  z-index: 1;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 700;
  font-size: 0.75rem;
  line-height: 1;
}

.node-source:active {
  transform: scale(0.97);
}

@media (hover: hover) and (pointer: fine) {
  .node-source:hover .halo {
    transform: scale(1.08);
  }
}

.code-view {
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-panel {
  width: 100%;
  max-width: 44rem;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid var(--ui-border);
}

.code-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  background: color-mix(in srgb, var(--ui-bg-elevated) 50%, transparent);
  padding: 0.375rem 0.5rem 0.375rem 0.875rem;
}

.code-body {
  max-height: min(30rem, 55vh);
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
}

.target-skeleton {
  background: color-mix(in srgb, var(--ui-bg-elevated) 70%, var(--ui-bg));
}

/* The runtimes are gated by `v-if="!isMobile"`; this just takes the empty
   phone shells out of the layout at the same breakpoint. */
@media (max-width: 639px) {
  .cluster { display: none; }
  /* Neither mobile cell owns a Lynx runtime, so the hidden one can leave the
     layout — otherwise it holds the stage open at its own height. */
  .cell[data-hidden='true'] { display: none; }
}

/* Capped so `--phone-w * scale * 4.6` still fits the container — past that the
   box hits its 100% cap and the constellation squashes sideways. */
@media (min-width: 640px) {
  section { --phone-scale: 0.34; }
}

@media (min-width: 1024px) {
  section { --phone-scale: 0.5; }
}

/* Reduced motion: keep the crossfades that explain a change, drop the rest. */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    transform: none;
    transition: opacity 300ms ease;
  }
  .is-revealed .ring {
    animation: none;
    opacity: 0.22;
  }
  .cell,
  .halo,
  .node-source {
    transition: none;
  }
}
</style>

<style>
/* Shiki emits its own background; clip it to the panel and give it room. */
.code-body pre.shiki {
  margin: 0;
  padding: 1rem 1.25rem;
}

/* Wrap instead of scrolling sideways: a `pre` line here is ~85ch, so on a phone
   the un-wrapped block is what widens the whole stage. */
@media (max-width: 639px) {
  .code-body pre.shiki {
    white-space: pre-wrap;
    padding: 0.875rem 1rem;
  }
}
</style>
