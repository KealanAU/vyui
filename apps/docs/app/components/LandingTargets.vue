<script setup lang="ts">
// One example id drives all three phones AND the code panel, so the source
// shown can never drift from the source running.
const EXAMPLE = 'landing-profile'

// `at` is the phone's centre as a percentage of the cluster box. Deliberately
// off-balance rather than an even triangle — an exact triangle reads as a
// diagram, a scatter reads as a constellation.
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

// ~36KB of Shiki HTML behind a closed panel — fetched on the first open, not
// shipped in the landing chunk.
const example = useExample(EXAMPLE, showCode)
const highlighted = computed(() => example.value?.highlighted ?? '')

let observer: IntersectionObserver | undefined

// The reveal also starts the rings. Gating them on one class that lands on all
// three phones in the same style recalc is what keeps them breathing in phase —
// a JS timer would restart each phone's animation at a different moment.
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

      <!-- Cluster and code occupy the same grid cell, so toggling crossfades in
           place instead of collapsing the section's height. Both stay mounted
           and hide via visibility, never v-if or v-show: each phone owns a Lynx
           runtime, and unmounting would tear down and re-boot three Web Workers
           on every toggle. `visibility: hidden` also drops them from tab order. -->
      <!-- mt-24, not mt-10: Android sits high enough in the box that the phone
           overhangs the top edge — and its ping ring reaches ~34px past that
           again at full expansion. The gap has to absorb both. -->
      <div class="reveal reveal-1 stage mx-auto mt-24">
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
                  <!-- pixel-ratio 1: the shell is CSS-scaled to at most half
                       size, so rasterizing at 2 would burn 4x the pixels that
                       ever reach the screen — times three runtimes. -->
                  <LynxPreview :name="EXAMPLE" height="540px" :pixel-ratio="1" />
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

            <!-- The badge carries this visually; keep the name for AT. -->
            <span class="sr-only">{{ item.label }}</span>
          </div>

          <!-- The one source, sitting in the middle of what it produces. -->
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
/* Strong ease-out — the built-in CSS curves are too weak to read as
   deliberate at these durations. */
section {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);

  /* Real handset metrics, kept in the DOM and scaled visually — see .shell. */
  --phone-w: 376px;
  --phone-h: 608px;
  --phone-scale: 0.22;
  --badge-size: calc(var(--phone-w) * var(--phone-scale) * 0.18);
  --node-size: calc(var(--phone-w) * var(--phone-scale) * 0.28);
}

/* Scroll reveal, once, staggered. Transform + opacity only. */
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

/* --- Stage --------------------------------------------------------------
   Both views share one grid cell so the swap is a crossfade in place. */
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
  /* Hold visibility until the fade finishes, so the outgoing view doesn't
     vanish on frame one. */
  transition-delay: 0s, 0s, 220ms;
}

/* The box derives from the phone, not the other way round. Every position in
   here is a percentage while the phones are a fixed pixel size, so an
   `aspect-ratio` box meant the composition changed shape at every breakpoint
   and each one needed its own hand-tuned percentages. Sizing the box in phone
   units instead makes the whole constellation proportional at any scale — one
   number (`--phone-scale`) resizes it and nothing else moves. */
.cluster {
  position: relative;
  width: 100%;
  max-width: calc(var(--phone-w) * var(--phone-scale) * 4.6);
  height: calc(var(--phone-h) * var(--phone-scale) * 2.3);
  margin-inline: auto;
}

/* Dotted texture pooling behind the middle, faded out at the edges. */
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

/* --- Phones -------------------------------------------------------------
   The screen stays a true 360px in the DOM — the Lynx runtime takes its width
   from that host, so shrinking the host would reflow the live page instead of
   just making it smaller. The wrapper reserves the scaled footprint and the
   shell is transform-scaled inside it. */
.phone {
  position: absolute;
  width: calc(var(--phone-w) * var(--phone-scale));
  height: calc(var(--phone-h) * var(--phone-scale));
  translate: -50% -50%;
}

.shell {
  /* Above the rings explicitly. `will-change` promotes each ring to its own
     layer, which would otherwise let a full-phone-sized (mostly transparent)
     layer sit over the live screen. */
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

/* Platform mark, pinned to the phone it belongs to. */
.badge {
  position: absolute;
  /* Above the shell, which carries z-index 1 to stay clear of the ring layers. */
  z-index: 2;
  /* Phone-relative like everything else in the cluster — a fixed 34px badge
     was the one piece that didn't shrink, so its overhang clipped the box at
     the smallest scale. */
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

/* Brand colours per target, flipped where the mark would vanish into the
   surface behind it (Apple's black on a dark canvas). The source node uses the
   project's own Vue-green ramp rather than a one-off hex. */
/* Only the pulse rings read --node here — the circle and glyph are set on
   .halo. vue-400, not the 500 step: 500 is the one hand-set Vue brand hex in an
   otherwise emerald ramp, and read greyer than the page's other greens. */
.node-source { --node: var(--color-vue-400); }
.phone-ios { --node: #17191c; --node-glyph: #fff; }
.phone-android { --node: #3ddc84; --node-glyph: #fff; }
.phone-web { --node: #3b82f6; --node-glyph: #fff; }

.dark .phone-ios { --node: #f4f4f5; --node-glyph: #17191c; }
.dark .node-source { --node: var(--color-vue-300); }

/* Rings echo the phone's silhouette rather than circling it — a circle around
   a tall rounded rectangle reads as a halo, not as a signal leaving the device.
   The tint is knocked most of the way out: at this size the colour is carried
   by the badge, and the ring only has to suggest a direction. */
.ring {
  position: absolute;
  inset: -10px;
  border-radius: 2.25rem;
  border: 1px solid color-mix(in srgb, var(--node) 20%, transparent);
  opacity: 0;
  pointer-events: none;
  /* Promote to its own layer. Without it the browser re-rasterizes this 1px
     border every frame and snaps it to whole pixels — over a travel this small
     and this slow, that reads as stepping rather than motion. Promoted, the GPU
     scales one cached texture and the animation also stops caring that three
     Lynx runtimes are busy on the main thread. */
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* All three breathe together. The animation is applied by the reveal class, so
   every ring on the page starts its cycle in the same style recalc and stays in
   phase for good — nothing restarts them individually. The offset between a
   phone's own two rings is identical everywhere, so it reads as one ripple
   rather than three phones doing their own thing. */
.is-revealed .ring {
  /* linear, not a bezier. A ripple leaving a device travels at one speed; any
     ease makes it crawl at one end of its life and dart at the other, and the
     eye reads the crawl as hitching. The previous curve was worse than that —
     `cubic-bezier(0.37, 0, 0.28, 1)` has an ease-IN front half, so the ring
     barely moved during the stretch where it was brightest. */
  animation: phone-ping 4200ms linear infinite;
}

/* Half a cycle apart, so the two rings are evenly spaced forever instead of
   arriving in a clump and leaving a gap. Delay only — giving ring 2 a different
   rest size as well made the travel ranges overlap, so the trailing ring
   launched from where the leading one already was and the two crossed instead
   of chasing. */
.is-revealed .ring-2 {
  animation-delay: 2100ms;
}

/* The old version snapped opacity 0 -> 0.28 in a single frame at every loop
   boundary, then held invisible for the last third. That pop was most of the
   "stutter" — a ripple has to fade in as well as out. */
@keyframes phone-ping {
  0% { opacity: 0; transform: scale(0.98); }
  12% { opacity: 0.3; }
  100% { opacity: 0; transform: scale(1.16); }
}

/* --- Source node -------------------------------------------------------- */
.node-source {
  position: absolute;
  left: 50%;
  /* Centre of the triangle the three phones leave. */
  top: 50%;
  z-index: 1;
  display: flex;
  /* Phone-relative, like the box — so it holds its place at every scale. */
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
  /* One circle, in what used to be the outer disc's green. A tinted disc with a
     second, deeper green dot inside it read as two nested nodes. */
  background: var(--color-vue-200);
  color: var(--color-vue-950);
  box-shadow: 0 8px 20px -12px rgba(4, 23, 43, 0.35);
  transition: transform 200ms var(--ease-out);
}

.dark .halo {
  background: var(--color-vue-300);
}

/* ~2x the circle at rest, in circle units rather than pixels — a fixed inset
   made the ring a different proportion at every breakpoint. */
.node-ring {
  inset: calc(var(--node-size) * -0.475);
  border-radius: 999px;
}

.mark {
  /* Above the rings. */
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

/* --- Code view ---------------------------------------------------------- */
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
  max-height: 30rem;
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
}

.target-skeleton {
  background: color-mix(in srgb, var(--ui-bg-elevated) 70%, var(--ui-bg));
}

/* Chosen so `--phone-w * scale * 4.6` still fits the container at each step —
   past that the box hits its 100% cap and the constellation squashes sideways. */
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
</style>
