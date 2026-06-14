<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Wraps Lynx's native virtualized `<list>` with a generic
     item template slot, optional pull-to-refresh, and load-more on
     scroll-to-lower.

     Pull-to-refresh: the supported native pattern wraps `<list>` in a
     `<refresh>` element with `<refresh-header>` as a SIBLING of the list inside
     that wrapper (placing `<refresh-header>` inside `<list>` crashes with
     `LynxCreateUIException: refresh-header ui not found`). The `<refresh>`
     element owns the gesture, the refresh state, and the `finishRefresh` /
     `autoStartRefresh` UI methods.

     IMPORTANT — runtime gating: `<refresh>` / `<refresh-header>` are *legacy*
     built-in UI classes that stock LynxExplorer / the OSS engine do NOT
     register. Mounting `<refresh>` there hard-crashes the create-UI pass with
     `LynxCreateUIException: refresh ui not found when create UI`. So we only
     emit the `<refresh>` wrapper when the runtime is known to support it
     (`isNativeRefreshSupported()` or the `refreshSupported` prop override);
     otherwise we render the bare virtualized `<list>` with PTR disabled. See
     REFRESH-PHYSICS.md for why the element is missing and how to enable it.

     State machine: the native `<refresh>` element owns the gesture and bounce
     physics, so we do NOT reimplement lynx-ui's MT-worklet rubber-band engine.
     Instead we model the refresh *lifecycle* as a small JS state machine over
     the native events so consumers can render pull / release / loading / done
     affordances in the `refreshHeader` slot:

         idle ──drag past threshold──▶ pulling ──release──▶ refreshing
           ▲                                                     │
           └──────── (settle delay) ◀── done ◀── refreshing flips false

     This mirrors lynx-ui's RefreshState (IDLE / OVER_DRAG_RELEASE /
     REFRESHING) without porting its worklet engine, which depends on
     `@lynx-js/gesture-runtime` packages vyui does not ship. -->
<script lang="ts">
/**
 * Refresh lifecycle exposed to the `refreshHeader` slot. Mirrors lynx-ui's
 * `RefreshState` semantics over vyui's native-refresh approach:
 * - `idle`        — at rest, header hidden / collapsed.
 * - `pulling`     — user is dragging but has not crossed the trigger threshold.
 * - `releaseReady`— dragged past the threshold; releasing now starts a refresh.
 * - `refreshing`  — refresh in flight (consumer is loading data).
 * - `done`        — refresh just completed; brief settle before returning to idle.
 */
export type FeedListRefreshState
  = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'

export interface FeedListProps<T = unknown> {
  /** Items to render. Each becomes a `<list-item>` with an `item-key`. */
  items: T[]
  /**
   * Field on `T` to use as the unique key per row. Required by Lynx's `<list>`
   * for diffing — duplicate or unstable keys cause rows to recycle wrong.
   * @defaultValue `'id'`
   */
  itemKeyField?: keyof T & string
  /**
   * Alternative to `itemKeyField`: a function returning the key. Wins when
   * both are provided.
   */
  itemKey?: (item: T, index: number) => string
  /**
   * Layout type. `'flow'` and `'waterfall'` require `spanCount > 1`.
   * @defaultValue `'single'`
   */
  listType?: 'single' | 'flow' | 'waterfall'
  /** Columns / rows for `flow` / `waterfall`. */
  spanCount?: number
  /**
   * @defaultValue `'vertical'`
   */
  scrollOrientation?: 'vertical' | 'horizontal'
  /**
   * @defaultValue `true`
   */
  bounces?: boolean
  /**
   * @defaultValue `true`
   */
  scrollBarEnable?: boolean
  /** Disable scrolling and refresh interactions. */
  disabled?: boolean

  // Pull-to-refresh
  /** Controlled refreshing state. Bind with `v-model:refreshing`. */
  refreshing?: boolean
  /** Initial refreshing state when uncontrolled. */
  defaultRefreshing?: boolean
  /** Enable pull-to-refresh. Renders a `<refresh>` wrapper around the list. */
  enableRefresh?: boolean
  /**
   * Whether the host Lynx runtime registers the native `<refresh>` /
   * `<refresh-header>` UI elements.
   *
   * These are legacy built-in elements absent from stock LynxExplorer / the
   * OSS engine: mounting `<refresh>` there hard-crashes the create-UI pass
   * (`LynxCreateUIException: refresh ui not found when create UI`). There is no
   * runtime API to feature-detect element registration, so:
   * - `undefined` (default) — auto-detect via `isNativeRefreshSupported()`,
   *   which is conservative and returns `false` unless the host advertises
   *   `SystemInfo.supportRefreshUI`. PTR then degrades to a plain `<list>`.
   * - `true` — force-render `<refresh>` (only set this if you *know* your host
   *   registers the elements; otherwise it will crash on load).
   * - `false` — never render `<refresh>`, even if detection would allow it.
   *
   * When refresh is unsupported the component still mounts cleanly with
   * `enableRefresh` set; pull-to-refresh is simply disabled and the bare
   * virtualized `<list>` is rendered.
   */
  refreshSupported?: boolean
  /**
   * How long (ms) to keep the header in the `done` state after `refreshing`
   * flips back to false before returning to `idle` and rebounding the header.
   * Gives consumers a window to show a "Updated" affordance.
   * @defaultValue `400`
   */
  refreshDoneDuration?: number

  // Load-more
  /** Enable load-more on scroll-to-lower. */
  enableLoadMore?: boolean
  /**
   * Number of items from the bottom that triggers `load-more`.
   * @defaultValue `2`
   */
  loadMoreThresholdItemCount?: number
  /**
   * Number of items from the top that triggers `scrollToUpper`.
   * @defaultValue `0`
   */
  upperThresholdItemCount?: number
  /**
   * Controlled "load-more in flight" flag. While true, repeated
   * scroll-to-lower events are suppressed so `loadMore` cannot double-fire.
   * Bind with `v-model:loadingMore` or set imperatively around your fetch.
   */
  loadingMore?: boolean
  /** Initial loadingMore state when uncontrolled. */
  defaultLoadingMore?: boolean
  /**
   * No more data to load. When true, `loadMore` will not fire and the
   * `loadMoreFooter`/`noMoreDataFooter` slots can render an end-of-list state.
   */
  noMoreData?: boolean
  /**
   * Minimum gap (ms) between consecutive `loadMore` emissions, even if the
   * list keeps reporting scroll-to-lower. Belt-and-braces against rapid
   * native re-fires while a fetch is still being kicked off.
   * @defaultValue `400`
   */
  loadMoreDebounceMs?: number
}

export type FeedListEmits = {
  'update:refreshing': [value: boolean]
  'update:loadingMore': [value: boolean]
  /** Fires when the user pulls past the refresh threshold and releases. */
  refresh: []
  /** Fires whenever the refresh lifecycle state changes. */
  refreshStateChange: [state: FeedListRefreshState]
  /** Fires when scroll nears the lower edge (within `loadMoreThresholdItemCount`). */
  loadMore: []
  /** Native `bindscrolltolower`. */
  scrollToLower: [event: unknown]
  /** Native `bindscrolltoupper`. */
  scrollToUpper: [event: unknown]
  /** Native `bindscroll`. */
  scroll: [event: unknown]
  /** Native `bindscrollstatechange`. */
  scrollStateChange: [event: unknown]
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { useStandardVModelOf } from '@/shared/composables'
import { isNativeRefreshSupported } from '@/shared/utils'

const props = withDefaults(defineProps<FeedListProps<T>>(), {
  itemKeyField: 'id' as never,
  listType: 'single',
  spanCount: 1,
  scrollOrientation: 'vertical',
  bounces: true,
  scrollBarEnable: true,
  disabled: false,
  defaultRefreshing: false,
  enableRefresh: false,
  refreshDoneDuration: 400,
  enableLoadMore: false,
  loadMoreThresholdItemCount: 2,
  upperThresholdItemCount: 0,
  defaultLoadingMore: false,
  noMoreData: false,
  loadMoreDebounceMs: 400,
})

// Mobile-first guidance — see ScrollView.vue for the same note.
if (__DEV__ && props.scrollOrientation === 'horizontal') {
  console.warn(
    '[vyui/FeedList] `scrollOrientation="horizontal"` is a non-default mobile affordance. '
    + 'Touch UX prefers single-axis vertical scroll; consider VyTabs / VySwiper / a paged layout for horizontal flows.',
  )
}

const emits = defineEmits<FeedListEmits>()

defineSlots<{
  /** Row template. Receives the item and its current index. */
  item?: (props: { item: T, index: number }) => any
  /**
   * Custom refresh-header content (only used when `enableRefresh`). Receives
   * the current lifecycle `state` plus boolean convenience flags so consumers
   * can swap pull / release / loading / done indicators.
   */
  refreshHeader?: (props: {
    state: FeedListRefreshState
    pulling: boolean
    releaseReady: boolean
    refreshing: boolean
    done: boolean
  }) => any
  /** Rendered in place of the list when `items` is empty. */
  empty?: () => any
  /** Footer shown at the bottom while more data can be loaded. */
  loadMoreFooter?: (props: { loading: boolean }) => any
  /** Footer shown at the bottom once `noMoreData` is true. */
  noMoreDataFooter?: () => any
}>()

const refreshing = useStandardVModelOf<boolean>(props, 'refreshing', emits)
const loadingMore = useStandardVModelOf<boolean>(props, 'loadingMore', emits)

// Native element handles. Refresh UI methods live on the `<refresh>` element;
// list UI methods (scrollToPosition) live on `<list>`.
const refreshEl = ref<any>(null)
const listEl = ref<any>(null)

// --- Refresh lifecycle state machine ----------------------------------------
// The native `<refresh>` element owns the gesture; we layer a JS state machine
// on top so the header slot can render pull/release/loading/done affordances
// and so we can prevent double-fires + reset cleanly.
const refreshState = ref<FeedListRefreshState>('idle')
// Set once we emit `refresh`/flip `refreshing`; cleared on full reset. Guards
// against the native element firing `startrefresh` twice for one gesture.
const refreshInFlight = ref(false)
let doneTimer: ReturnType<typeof setTimeout> | null = null

function clearDoneTimer(): void {
  if (doneTimer != null) {
    clearTimeout(doneTimer)
    doneTimer = null
  }
}

function setRefreshState(next: FeedListRefreshState): void {
  if (refreshState.value === next) return
  refreshState.value = next
  emits('refreshStateChange', next)
}

function keyFor(item: T, index: number): string {
  if (typeof props.itemKey === 'function') return props.itemKey(item, index)
  const field = (props.itemKeyField ?? 'id') as string
  const v = (item as Record<string, unknown>)[field]
  if (v == null) return String(index)
  return String(v)
}

function invoke(el: any, method: string, params: Record<string, unknown> = {}): void {
  if (el == null || typeof el.invoke !== 'function') return
  try {
    const op = el.invoke({ method, params })
    if (op && typeof op.exec === 'function') op.exec()
  }
  catch {
    // Best-effort — UI method may not be available on every platform.
  }
}

function startRefresh(): void {
  if (props.disabled || refreshInFlight.value) return
  // Native auto-start fully exposes the header and fires `startrefresh`.
  invoke(refreshEl.value, 'autoStartRefresh')
}

function finishRefresh(): void {
  invoke(refreshEl.value, 'finishRefresh')
}

/**
 * Scroll the list to a specific index, optionally smooth.
 *
 * Lynx's `scrollToPosition` accepts `itemKey` directly — if both `index` and
 * `itemKey` are passed, `itemKey` wins.
 */
function scrollToIndex(index: number, opts: {
  alignTo?: 'top' | 'bottom' | 'middle'
  offset?: number
  smooth?: boolean
} = {}): void {
  invoke(listEl.value, 'scrollToPosition', { index, ...opts })
}

// Drive the lifecycle off the controlled `refreshing` flag so the state stays
// correct whether the refresh was started by drag or imperatively. When the
// consumer flips `refreshing` back to false, move to `done`, rebound the
// native header, then settle back to `idle` after `refreshDoneDuration`.
watch(refreshing, (next, prev) => {
  if (next && !prev) {
    clearDoneTimer()
    refreshInFlight.value = true
    setRefreshState('refreshing')
  }
  else if (prev && !next) {
    clearDoneTimer()
    finishRefresh()
    setRefreshState('done')
    doneTimer = setTimeout(() => {
      refreshInFlight.value = false
      setRefreshState('idle')
      doneTimer = null
    }, Math.max(0, props.refreshDoneDuration))
  }
}, { immediate: true })

// Native pull-progress hooks (best-effort — not every Lynx version emits
// these). They let the header reflect pulling vs release-ready before the
// gesture is released. Absent these events the header still works: it just
// jumps straight to `refreshing` on `startrefresh`.
function onHeaderOffset(event: any): void {
  if (props.disabled || refreshInFlight.value) return
  if (refreshState.value === 'refreshing' || refreshState.value === 'done') return
  const detail = (event && (event.detail ?? event)) ?? {}
  const offset = Number(detail.offset ?? detail.dy ?? 0)
  const headerSize = Number(detail.headerSize ?? detail.threshold ?? 0)
  if (offset <= 0) {
    setRefreshState('idle')
    return
  }
  // Past the header size == past the trigger threshold (matches lynx-ui's
  // `releasedOverHeader` semantics). Fall back to `pulling` when we can't
  // read a header size.
  setRefreshState(headerSize > 0 && offset >= headerSize ? 'releaseReady' : 'pulling')
}

function onStartRefresh(): void {
  if (props.disabled) return
  // Double-fire guard: the native element can emit `startrefresh` more than
  // once for a single release on some platforms.
  if (refreshInFlight.value || refreshing.value) return
  refreshInFlight.value = true
  setRefreshState('refreshing')
  refreshing.value = true
  emits('refresh')
}

// --- Load-more debouncing ----------------------------------------------------
let lastLoadMoreAt = 0

function onScrollToLower(event: unknown): void {
  emits('scrollToLower', event)
  if (!props.enableLoadMore || props.disabled) return
  // Suppress while a fetch is in flight, when there's nothing left to load,
  // and within the debounce window — native `scrolltolower` can re-fire
  // rapidly as the user rests at the bottom.
  if (loadingMore.value || props.noMoreData) return
  const now = Date.now()
  if (now - lastLoadMoreAt < Math.max(0, props.loadMoreDebounceMs)) return
  lastLoadMoreAt = now
  loadingMore.value = true
  emits('loadMore')
}

function onScrollToUpper(event: unknown): void {
  emits('scrollToUpper', event)
}

function onScroll(event: unknown): void {
  emits('scroll', event)
}

function onScrollStateChange(event: unknown): void {
  emits('scrollStateChange', event)
}

const isEmpty = computed(() => props.items.length === 0)
const showLoadMoreFooter = computed(
  () => props.enableLoadMore && !props.noMoreData,
)

// Whether the native `<refresh>` element is actually safe to mount on this
// host. Detection (`isNativeRefreshSupported`) is conservative and crash-safe:
// it returns `false` on stock LynxExplorer / OSS engines that don't register
// the legacy refresh UI, so we never emit a `<refresh>` that would hard-crash
// the create-UI pass. The `refreshSupported` prop is the explicit override.
const refreshSupported = computed(() => {
  if (props.refreshSupported != null) return props.refreshSupported
  return isNativeRefreshSupported()
})
// Render the `<refresh>` wrapper only when refresh is both requested AND the
// runtime can mount it. Otherwise fall through to the bare `<list>` so the
// component mounts cleanly with PTR gracefully disabled.
const usePtrWrapper = computed(() => props.enableRefresh && refreshSupported.value)

// Dev-time signal so consumers aren't surprised when PTR silently no-ops on a
// runtime that lacks the native refresh UI.
if (__DEV__ && props.enableRefresh && !refreshSupported.value) {
  console.warn(
    '[vyui/FeedList] `enableRefresh` is set but the native `<refresh>` UI is '
    + 'not registered on this Lynx runtime (e.g. stock LynxExplorer). '
    + 'Pull-to-refresh is disabled to avoid a create-UI crash. If your host '
    + 'does register the refresh element, set `:refresh-supported="true"`.',
  )
}

onBeforeUnmount(clearDoneTimer)

defineExpose({
  startRefresh,
  finishRefresh,
  scrollToIndex,
  refreshState,
  refreshSupported,
})
</script>

<template>
  <!-- Empty state — render the dedicated slot in place of the list. -->
  <view
    v-if="isEmpty"
    class="vyui-feed-list vyui-feed-list--empty"
    data-vyui-feed-list-empty
    :style="{ flex: 1 }"
  >
    <slot name="empty" />
  </view>
  <!-- PTR-on: wrap list in `<refresh>` so iOS registers the refresh UI. The
       `<refresh-header>` belongs as a sibling of `<list>` inside this
       wrapper — placing it inside `<list>` crashes the create-UI pass.

       Gated on `usePtrWrapper` (= `enableRefresh` AND the runtime registers the
       native `<refresh>` element). On runtimes lacking it we fall through to
       the bare `<list>` below so we never emit a `<refresh>` that hard-crashes
       the create-UI pass (`refresh ui not found when create UI`). -->
  <refresh
    v-else-if="usePtrWrapper"
    ref="refreshEl"
    class="vyui-feed-list__refresh"
    :data-vyui-refresh-state="refreshState"
    :enable-refresh="!disabled"
    @startrefresh="onStartRefresh"
    @headeroffset="onHeaderOffset"
    @dropdown="onHeaderOffset"
  >
    <refresh-header
      class="vyui-feed-list__refresh-header"
      :data-vyui-refresh-state="refreshState"
    >
      <slot
        name="refreshHeader"
        :state="refreshState"
        :pulling="refreshState === 'pulling'"
        :release-ready="refreshState === 'releaseReady'"
        :refreshing="refreshState === 'refreshing'"
        :done="refreshState === 'done'"
      />
    </refresh-header>
    <list
      ref="listEl"
      class="vyui-feed-list"
      data-vyui-feed-list
      :scroll-orientation="scrollOrientation"
      :list-type="listType"
      :span-count="spanCount"
      :bounces="bounces"
      :enable-scroll="!disabled"
      :scroll-bar-enable="scrollBarEnable"
      :lower-threshold-item-count="loadMoreThresholdItemCount"
      :upper-threshold-item-count="upperThresholdItemCount"
      @scroll="onScroll"
      @scrolltolower="onScrollToLower"
      @scrolltoupper="onScrollToUpper"
      @scrollstatechange="onScrollStateChange"
    >
      <!-- `item-key` must stay kebab-cased; bind via `v-bind` to avoid
           Vue's template compiler camelizing the attribute. -->
      <list-item
        v-for="(item, index) in items"
        :key="keyFor(item, index)"
        v-bind="{ 'item-key': keyFor(item, index) }"
      >
        <slot name="item" :item="item" :index="index" />
      </list-item>
      <!-- Load-more / end-of-list footer. Sticky-bottom affordances that
           mirror lynx-ui's loadMoreFooter / noMoreDataFooter swap. -->
      <list-item
        v-if="showLoadMoreFooter && $slots.loadMoreFooter"
        v-bind="{ 'item-key': '__vyui_load_more_footer' }"
        data-vyui-feed-list-footer
      >
        <slot name="loadMoreFooter" :loading="loadingMore" />
      </list-item>
      <list-item
        v-else-if="enableLoadMore && noMoreData && $slots.noMoreDataFooter"
        v-bind="{ 'item-key': '__vyui_no_more_footer' }"
        data-vyui-feed-list-footer
      >
        <slot name="noMoreDataFooter" />
      </list-item>
    </list>
  </refresh>
  <!-- PTR-off: bare list, no refresh wrapper. -->
  <list
    v-else
    ref="listEl"
    class="vyui-feed-list"
    data-vyui-feed-list
    :scroll-orientation="scrollOrientation"
    :list-type="listType"
    :span-count="spanCount"
    :bounces="bounces"
    :enable-scroll="!disabled"
    :scroll-bar-enable="scrollBarEnable"
    :lower-threshold-item-count="loadMoreThresholdItemCount"
    :upper-threshold-item-count="upperThresholdItemCount"
    @scroll="onScroll"
    @scrolltolower="onScrollToLower"
    @scrolltoupper="onScrollToUpper"
    @scrollstatechange="onScrollStateChange"
  >
    <list-item
      v-for="(item, index) in items"
      :key="keyFor(item, index)"
      v-bind="{ 'item-key': keyFor(item, index) }"
    >
      <slot name="item" :item="item" :index="index" />
    </list-item>
    <list-item
      v-if="showLoadMoreFooter && $slots.loadMoreFooter"
      v-bind="{ 'item-key': '__vyui_load_more_footer' }"
      data-vyui-feed-list-footer
    >
      <slot name="loadMoreFooter" :loading="loadingMore" />
    </list-item>
    <list-item
      v-else-if="enableLoadMore && noMoreData && $slots.noMoreDataFooter"
      v-bind="{ 'item-key': '__vyui_no_more_footer' }"
      data-vyui-feed-list-footer
    >
      <slot name="noMoreDataFooter" />
    </list-item>
  </list>
</template>
