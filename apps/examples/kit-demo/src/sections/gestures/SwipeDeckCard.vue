<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'
import { VyButton } from '@vyui/kit'

// Domain-agnostic swipe-to-decide deck (left = skip, right = keep) — matches
// how lynx-family/lynx-ui actually builds this: their
// `apps/examples/Swiper/CustomTinder` example drives translate + rotateZ +
// scale + opacity from ONE `main-thread:customAnimation` worklet per item,
// per touch frame (no BG round-trip, no separate transform-owning element).
// vyui's ported Swiper never picked up that per-item worklet hook — it only
// has the single-track `translateX` mode (SwiperRoot.vue / useDragGesture.ts
// move one aggregate offset, not a per-item ref map). Porting `mode="custom"`
// properly is a SwiperRoot/SwiperItem change, more surface than a spike
// needs. This hand-rolls the SAME technique for a single top card instead:
// one inline `'main thread'` touch handler computes translate+rotate+opacity
// together, mirroring SwipeAction.vue/ToastSwipe.vue's shape.
//
// NEITHER `runOnMainThread` NOR `runOnBackground` may be aliased — SWC's
// worklet transform only wraps the literal identifier at the call site.

interface SwipeItem {
  id: number
  title: string
  subtitle: string
  color: string
}

const initialItems: SwipeItem[] = [
  { id: 1, title: 'Card 1', subtitle: 'Sample item — swipe or use the buttons below', color: 'bg-rose-400' },
  { id: 2, title: 'Card 2', subtitle: 'Sample item — swipe or use the buttons below', color: 'bg-amber-400' },
  { id: 3, title: 'Card 3', subtitle: 'Sample item — swipe or use the buttons below', color: 'bg-emerald-400' },
  { id: 4, title: 'Card 4', subtitle: 'Sample item — swipe or use the buttons below', color: 'bg-sky-400' },
  { id: 5, title: 'Card 5', subtitle: 'Sample item — swipe or use the buttons below', color: 'bg-violet-400' },
]

const DISMISS_DISTANCE = 100
const DISMISS_VELOCITY = 700
const DURATION = 260

const deck = ref<SwipeItem[]>([...initialItems])
const log = ref('Drag the top card, or tap ✕ / ✓')

// Explicit inline position (not Tailwind's `absolute`/`inset-0` classes) —
// every core component doing this kind of overlay positioning
// (SwipeAction's action panel, FeedList's pull indicator, Slider's thumb)
// sets `position`/`top`/`left`/`right`/`bottom` as an inline `:style` object.
// With `absolute inset-0` as classes here, the card rendered at zero size
// (invisible) — the parent wasn't resolving to a definite box for it to
// anchor `inset: 0` against.
function overlayStyle(index: number) {
  return {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    transform: `translateY(${index * -10}px) scale(${1 - index * 0.04})`,
    zIndex: `${10 - index}`,
    transition: 'transform 200ms ease-out',
  }
}

const topCardStyle = {
  position: 'absolute' as const,
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  zIndex: '20',
}

function badgeStyle(side: 'left' | 'right') {
  return {
    position: 'absolute' as const,
    top: '16px',
    [side]: '16px',
  }
}

// The top card element doubles as the touch target AND the transform target
// (like SwipeAction's row) — no wrapper needed since nothing else writes
// its `transform`. `keep`/`skip` badges get their own refs so the SAME
// worklet can fade them in lockstep with the drag, still with zero BG hops.
const cardRef = useMainThreadRef<any>(null)
const keepRef = useMainThreadRef<any>(null)
const skipRef = useMainThreadRef<any>(null)
const touchStartXRef = useMainThreadRef<number>(0)
const touchStartYRef = useMainThreadRef<number>(0)
const currentXRef = useMainThreadRef<number>(0)
const currentYRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
const positionQueueRef = useMainThreadRef<number[]>([])
const timeQueueRef = useMainThreadRef<number[]>([])

// --- MT worklets. Helpers are defined ABOVE their callers — worklet fns
// become `const`, so a forward reference throws "lexical variable is not
// initialized" at registration (mirrors SwipeAction.vue/ToastSwipe.vue).

function _tiltFor(dx: number): number {
  'main thread'
  return dx / 18
}

function _opacityFor(dx: number, positive: boolean): number {
  'main thread'
  const raw = positive ? dx / 90 : -dx / 90
  if (raw < 0) return 0
  if (raw > 1) return 1
  return raw
}

function _setCardTransform(x: number, y: number) {
  'main thread'
  const el = cardRef as unknown as { current?: { setStyleProperty?(k: string, v: string): void } }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translate(${x}px, ${y}px) rotate(${_tiltFor(x)}deg)`)
  }
}

function _setBadgeOpacity(dx: number) {
  'main thread'
  const keep = keepRef as unknown as { current?: { setStyleProperty?(k: string, v: string): void } }
  if (keep.current?.setStyleProperty) keep.current.setStyleProperty('opacity', `${_opacityFor(dx, true)}`)
  const skip = skipRef as unknown as { current?: { setStyleProperty?(k: string, v: string): void } }
  if (skip.current?.setStyleProperty) skip.current.setStyleProperty('opacity', `${_opacityFor(dx, false)}`)
}

// Snap the (possibly reused) card element back to identity. Needed because
// `setStyleProperty` writes go straight to the native style object, bypassing
// Vue's `:style` diffing — a promoted card would otherwise inherit its flung
// predecessor's leftover transform/opacity (same element gets patched, not
// remounted, across the v-if branch).
function _resetPosition() {
  'main thread'
  currentXRef.current = 0
  currentYRef.current = 0
  _setCardTransform(0, 0)
  _setBadgeOpacity(0)
}

function _animateTo(targetX: number, targetY: number, targetOpacity: number) {
  'main thread'
  const fromX = currentXRef.current
  const fromY = currentYRef.current
  const el = cardRef as unknown as {
    current?: { animate?(keyframes: any[], options: any): any, setStyleProperty?(k: string, v: string): void }
  }
  currentXRef.current = targetX
  currentYRef.current = targetY
  if (typeof el.current?.animate === 'function') {
    el.current.animate(
      [
        { transform: `translate(${fromX}px, ${fromY}px) rotate(${_tiltFor(fromX)}deg)`, opacity: '1' },
        { transform: `translate(${targetX}px, ${targetY}px) rotate(${_tiltFor(targetX)}deg)`, opacity: `${targetOpacity}` },
      ],
      { duration: DURATION, fill: 'forwards', easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    )
  }
  else {
    _setCardTransform(targetX, targetY)
  }
  _setBadgeOpacity(0)
}

function _flingFromButton(dir: number) {
  'main thread'
  _animateTo(dir * 480, 0, 0)
  runOnBackground(_emitDismiss as any)(dir)
}

function _pruneQueue(ms: number, minLength: number) {
  'main thread'
  const t = timeQueueRef.current
  const p = positionQueueRef.current
  const now = Date.now()
  while (t.length > minLength && t[0] < now - ms) {
    t.shift()
    p.shift()
  }
}

function _getVelocity() {
  'main thread'
  _pruneQueue(500, 0)
  const t = timeQueueRef.current
  const p = positionQueueRef.current
  const { length } = t
  if (length < 2) return 0
  const dt = (t[length - 1] - t[0]) / 1000
  if (dt <= 0) return 0
  return (p[length - 1] - p[0]) / dt
}

function _onTouchStart(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  isDraggingRef.current = true
  const x = e.touches[0].clientX
  const y = e.touches[0].clientY
  touchStartXRef.current = x
  touchStartYRef.current = y
  timeQueueRef.current = [Date.now()]
  positionQueueRef.current = [x]
}

function _onTouchMove(e: { touches: Array<{ clientX: number, clientY: number }> }) {
  'main thread'
  if (!isDraggingRef.current) return
  const x = e.touches[0].clientX
  const y = e.touches[0].clientY
  const nextX = x - touchStartXRef.current
  const nextY = y - touchStartYRef.current
  currentXRef.current = nextX
  currentYRef.current = nextY
  _setCardTransform(nextX, nextY)
  _setBadgeOpacity(nextX)
  positionQueueRef.current.push(x)
  timeQueueRef.current.push(Date.now())
  _pruneQueue(50, 2)
}

function _onTouchEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  const endX = currentXRef.current
  const endY = currentYRef.current
  const velocity = _getVelocity()

  let dir = 0
  if (Math.abs(velocity) >= DISMISS_VELOCITY) dir = velocity < 0 ? -1 : 1
  else if (Math.abs(endX) >= DISMISS_DISTANCE) dir = endX < 0 ? -1 : 1

  if (dir !== 0) {
    _animateTo(dir * 480, endY, 0)
    runOnBackground(_emitDismiss as any)(dir)
  }
  else {
    _animateTo(0, 0, 1)
  }
}

// --- BG callbacks ----------------------------------------------------------

function _emitDismiss(dir: number) {
  const top = deck.value[0]
  if (!top) return
  log.value = dir > 0 ? `Kept ${top.title}` : `Skipped ${top.title}`
  setTimeout(() => {
    deck.value = deck.value.filter(c => c.id !== top.id)
    runOnMainThread(_resetPosition as any)()
  }, DURATION)
}

function tapSkip(): void {
  if (deck.value.length === 0) return
  runOnMainThread(_flingFromButton as any)(-1)
}
function tapKeep(): void {
  if (deck.value.length === 0) return
  runOnMainThread(_flingFromButton as any)(1)
}
function resetDeck(): void {
  deck.value = [...initialItems]
  log.value = 'Deck reset'
  runOnMainThread(_resetPosition as any)()
}

onMounted(() => {
  // Deferred past the post-flush op batch — a dispatch fired synchronously in
  // `onMounted` can reach the main thread before the refs above are
  // registered (mirrors useDragGesture.ts's mount-time note; nextTick narrows
  // but does not fully close the race).
  void nextTick().then(() => {
    runOnMainThread(_resetPosition as any)()
  })
})
</script>

<template>
  <view class="bg-default border border-default rounded-lg p-3 flex flex-col flex-1 min-w-[280px] gap-2">
    <view class="flex flex-row items-center justify-between">
      <text class="text-highlighted text-base font-semibold">SwipeDeck</text>
      <text class="text-dimmed text-xs">{{ log }}</text>
    </view>
    <text class="text-muted text-xs">Swipe the top card left (skip) or right (keep) — or use the buttons below.</text>

    <view :style="{ position: 'relative', width: '260px', height: '300px' }" class="self-center">
      <template v-for="(card, index) in deck.slice(0, 3)" :key="card.id">
        <!-- Top card: touch target and transform target are the same element. -->
        <view
          v-if="index === 0"
          :main-thread-ref="cardRef"
          :main-thread-bindtouchstart="_onTouchStart"
          :main-thread-bindtouchmove="_onTouchMove"
          :main-thread-bindtouchend="_onTouchEnd"
          :main-thread-bindtouchcancel="_onTouchEnd"
          class="rounded-2xl flex flex-col items-center justify-center gap-2"
          :class="card.color"
          :style="topCardStyle"
        >
          <text class="text-white text-lg font-semibold">{{ card.title }}</text>
          <text class="text-white/80 text-xs">{{ card.subtitle }}</text>
          <!-- `main-thread-ref` only ever targets `<view>` elsewhere in this
               repo — wrap the badge text so the ref binds to a view, not a
               `<text>` (untested and likely to fail registration). -->
          <view
            :main-thread-ref="skipRef"
            :style="badgeStyle('left')"
            class="border-2 border-rose-50 rounded px-2 py-0.5 -rotate-12"
          >
            <text class="text-rose-50 text-sm font-bold">SKIP</text>
          </view>
          <view
            :main-thread-ref="keepRef"
            :style="badgeStyle('right')"
            class="border-2 border-emerald-50 rounded px-2 py-0.5 rotate-12"
          >
            <text class="text-emerald-50 text-sm font-bold">KEEP</text>
          </view>
        </view>

        <!-- Cards behind the top one: static stack, no interaction. -->
        <view
          v-else
          class="rounded-2xl flex flex-col items-center justify-center gap-2"
          :class="card.color"
          :style="overlayStyle(index)"
        >
          <text class="text-white text-lg font-semibold">{{ card.title }}</text>
          <text class="text-white/80 text-xs">{{ card.subtitle }}</text>
        </view>
      </template>

      <view v-if="deck.length === 0" :style="topCardStyle" class="flex flex-col items-center justify-center gap-2">
        <text class="text-muted text-sm">Deck empty</text>
        <VyButton size="xs" color="neutral" variant="soft" label="Reset deck" @tap="resetDeck" />
      </view>
    </view>

    <view class="flex flex-row justify-center gap-3 pt-1">
      <VyButton size="sm" color="error" variant="soft" label="✕ Skip" :disabled="deck.length === 0" @tap="tapSkip" />
      <VyButton size="sm" color="success" variant="soft" label="✓ Keep" :disabled="deck.length === 0" @tap="tapKeep" />
    </view>
  </view>
</template>
