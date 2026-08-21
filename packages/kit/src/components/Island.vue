<script lang="ts">
import theme from '../theme/island'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'
// NB: `IslandSize` is intentionally NOT imported here. Vue SFC compiles
// the two `<script>` blocks into one module, and importing the same name
// in both blocks raises TS2300 "Duplicate identifier". We inline the union
// in the prop interface below and keep the canonical `IslandSize` import
// in the setup block (which uses it at runtime via a cast).

type IslandTV = ThemeTV<typeof theme>
type IslandVariants = VariantProps<IslandTV>

/**
 * Linear-inspired island container. A floating (or inline) pill that hosts a
 * horizontal row of items and (optionally) an expandable panel underneath.
 *
 * Three independent state axes — drive whichever the caller needs:
 *
 *  1. **`open` (v-model:open)** — panel expansion. Render extra rows in the
 *     `#expanded` slot; they appear when `open === true`. Caller toggles via
 *     a `<VyIslandButton expand>` (declarative) or `setOpen` (imperative).
 *  2. **`mode` (v-model:mode)** — which "row mode" is active. Mode names are
 *     **free-form strings** — pick whatever describes your layout pattern
 *     (`'fullisland'`, `'compose'`, `'filter'`, `'reply'`, …). `'default'`
 *     renders the default slot; any other value renders the matching
 *     `<template #[modeName]>` slot, so the row morphs to whatever content
 *     the caller defines. Switch with `<VyIslandButton mode="x">` (writes
 *     the ref) or imperatively via `setMode('x')`. Falls back to the default
 *     slot if no slot exists for the current mode name.
 *  3. **`value` (v-model:value)** — currently-selected "tab" value. Buttons
 *     with `<VyIslandButton value="inbox">` auto-highlight + auto-update the
 *     parent's value on tap. Removes the need for caller-side
 *     `:active="x === 'inbox'"` plumbing.
 *
 * Sizing flows from the wrapper down: set `size` once on `<VyIsland>` and
 * child `<VyIslandButton>`s pick it up via context. Override per-button by
 * passing an explicit `size` prop on the child.
 *
 * Placement: `position` covers `top` / `bottom` centered + `inline`. For
 * fine-grained placement (corners, offsets, side-by-side islands), use
 * `inline` and a surrounding flex layout, or pass `class` overrides.
 */
export interface IslandProps {
  /** Controlled expanded state — bind with `v-model:open`. */
  open?: boolean
  /** Initial expanded state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * Active row mode — bind with `v-model:mode`. Free-form string. `'default'`
   * renders the default slot; any other value renders the matching
   * `<template #[mode]>` slot. Caller invents the names — common patterns:
   * `'fullisland'` (takeover), `'compose'`, `'filter'`, `'reply'`, …
   */
  mode?: string
  /** Initial mode when uncontrolled. @defaultValue `'default'` */
  defaultMode?: string
  /**
   * Selected tab value — bind with `v-model:value`. Children with a `value`
   * prop auto-highlight when this matches them.
   */
  value?: string | number | null
  /** Initial value when uncontrolled. */
  defaultValue?: string | number | null
  /**
   * Which viewport edge to float against — only relevant when the island is
   * floating (`layer !== 'inline'`). Works on Lynx via an inline `style`, so a
   * lone `<VyIsland>` hovers with no wrapper. Also sets the panel growth
   * direction (panel grows away from the edge).
   * @defaultValue `'bottom'`
   */
  position?: IslandVariants['position']
  /**
   * How the island participates in layout / stacking — the primary axis.
   *  - `overlay` — floats over page content (z-50).
   *  - `base` — floats at the viewport edge but on a low layer, so
   *    higher-tier surfaces (drawers, modals) render over it.
   *  - `inline` — sits in normal flow; a parent layout (or `<VyIslandGroup>`)
   *    owns placement. `position` is ignored.
   * @defaultValue `'overlay'`
   */
  layer?: 'overlay' | 'base' | 'inline'
  /**
   * How the expanded panel relates visually to the row:
   *  - `floating` — panel and row are independent surfaces with a gap
   *    between them (default; reads as a menu popping in front of the dock).
   *  - `attached` — when open, panel + row merge into one continuous
   *    rounded-rectangle surface (reads as the dock growing upward).
   * @defaultValue `'floating'`
   */
  expandStyle?: IslandVariants['expandStyle']
  /**
   * Sizing variant — inherited by children via context.
   * @defaultValue `'md'`
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Element this container renders as.
   * @defaultValue `'view'`
   */
  as?: string
  class?: ClassValue
  ui?: Partial<Record<keyof IslandTV['slots'], ClassValue>>
}

export interface IslandEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:mode', value: string): void
  (e: 'update:value', value: string | number | null): void
}

export interface IslandSlotProps {
  open: boolean
  mode: string
  value: string | number | null
  setOpen: (v: boolean) => void
  toggle: () => void
  close: () => void
  setMode: (m: string) => void
  resetMode: () => void
  setValue: (v: string | number | null) => void
}

export interface IslandSlots {
  /** Default row content — rendered when `mode === 'default'`. */
  default(props: IslandSlotProps): any
  /** Expandable panel content — rendered when `open === true`. */
  expanded(props: IslandSlotProps): any
  /**
   * Custom mode slots — any other slot name matches a `mode` value.
   * Example: `<template #search>…</template>` shows when `mode === 'search'`.
   */
  [key: string]: (props: IslandSlotProps) => any
}
</script>

<script setup lang="ts">
import { Comment, computed, Fragment, ref, Text, type VNode } from 'vue'
import { useStyledComponent } from '../composables/useStyledComponent'
import { provideIslandContext, type IslandSize } from './islandContext'

const props = withDefaults(defineProps<IslandProps>(), {
  defaultOpen: false,
  defaultMode: 'default',
  defaultValue: null,
  layer: 'overlay',
  as: 'view',
})
const emit = defineEmits<IslandEmits>()
const slots = defineSlots<IslandSlots>()

// Local uncontrolled state — used as a fallback when the caller didn't bind
// the matching `v-model:*`. Without these, an uncontrolled island would emit
// `update:open` etc. into the void and `resolvedX` would never change.
// Cannot use Vue's `defineModel` here because vue-lynx 0.4.0 lacks the
// `mergeModels` runtime export, so we hand-roll the controlled/uncontrolled
// split. See [[feedback_vue_lynx_mergemodels]].
const localOpen = ref(props.defaultOpen)
const localMode = ref(props.defaultMode)
const localValue = ref<string | number | null>(props.defaultValue)

// Resolved state — controlled prop wins (caller bound a v-model), else the
// local ref tracks state for uncontrolled mode. Writers update both the
// local ref AND emit so either binding style stays in sync.
const resolvedOpen = computed(() => props.open ?? localOpen.value)
const resolvedMode = computed(() => props.mode ?? localMode.value)
const resolvedValue = computed(() => (props.value !== undefined ? props.value : localValue.value))
const resolvedSize = computed<IslandSize>(() => (props.size ?? 'md') as IslandSize)

function setOpen(v: boolean) {
  localOpen.value = v
  emit('update:open', v)
}
function toggle() { setOpen(!resolvedOpen.value) }
function close() { setOpen(false) }

function setMode(m: string) {
  localMode.value = m
  emit('update:mode', m)
}
function resetMode() { setMode('default') }

function setValue(v: string | number | null) {
  localValue.value = v
  emit('update:value', v)
}

// Buttons + slot consumers read state via this single object.
provideIslandContext({
  open: resolvedOpen,
  mode: resolvedMode,
  value: resolvedValue,
  size: resolvedSize,
  setOpen, toggle, close,
  setMode, resetMode,
  setValue,
})

// Row slot routing — `mode` selects which slot renders for the row.
// Falls back to `default` if the named slot doesn't exist so a mode flip
// never produces empty content.
const activeRowSlot = computed(() => {
  const name = resolvedMode.value
  if (name === 'default' || !slots[name]) return 'default'
  return name
})

// Count the *renderable* children of a slot — skips comment nodes (e.g. a
// `v-if` that's false) and whitespace-only text so a single real button still
// counts as one. Recurses into fragments (a `v-for` or grouped children).
function countRenderable(nodes: VNode[] | undefined): number {
  let n = 0
  for (const node of nodes ?? []) {
    if (node.type === Comment) continue
    if (node.type === Text && (typeof node.children !== 'string' || !node.children.trim())) continue
    if (node.type === Fragment) { n += countRenderable(node.children as VNode[]); continue }
    n++
  }
  return n
}

// `solo` → the active row renders a single child. Drives the tight symmetric
// padding (theme `solo` variant) so a lone icon button reads as one circle.
const isSolo = computed(() => {
  const fn = slots[activeRowSlot.value]
  return fn ? countRenderable(fn(slotProps.value)) === 1 : false
})

const hasExpanded = computed(() => !!slots.expanded)
const isOpen = computed(() => hasExpanded.value && resolvedOpen.value)

// Panel renders ABOVE the row by default (Linear-style growth pattern); only
// `position="top"` flips it to grow downward.
const panelAbove = computed(() => props.position !== 'top')

// Lynx ignores tailwind `fixed`, so floating islands are pinned via an inline
// `style` (which Lynx respects) — a lone island floats with no wrapper. The
// strip spans full-width; inline `alignItems` centers the pill within it.
// `layer="inline"` returns no style so a parent layout owns placement; `base`
// drops the island to a low z so modals/drawers cover it. Any caller-passed
// `style` merges over this via attr fallthrough.
const positionStyle = computed(() => {
  if (props.layer === 'inline') return undefined
  const zIndex = props.layer === 'base' ? 10 : 50
  if (props.position === 'top') {
    return { position: 'fixed', top: '16px', left: '0', right: '0', zIndex, alignItems: 'center' } as const
  }
  return { position: 'fixed', bottom: '16px', left: '0', right: '0', zIndex, alignItems: 'center' } as const
})

const slotProps = computed(() => ({
  open: isOpen.value,
  mode: resolvedMode.value,
  value: resolvedValue.value,
  setOpen, toggle, close,
  setMode, resetMode,
  setValue,
}))

// `open` and `expandStyle` are theme variants so the `attached` mode can
// collapse the panel + row into a single chromed surface only while the
// panel is visible (closed islands always keep the rounded-full row pill).
const { ui } = useStyledComponent('island', theme, () => ({
  position: props.position,
  size: resolvedSize.value,
  expandStyle: props.expandStyle,
  open: isOpen.value,
  solo: isSolo.value,
}))
</script>

<template>
  <component
    :is="as"
    :data-state="isOpen ? 'open' : 'closed'"
    :data-mode="resolvedMode"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    :style="positionStyle"
  >
    <view
      v-if="isOpen && panelAbove"
      :class="ui.panel({ class: props.ui?.panel })"
    >
      <slot name="expanded" v-bind="slotProps" />
    </view>

    <view :class="ui.row({ class: props.ui?.row })">
      <slot :name="activeRowSlot" v-bind="slotProps" />
    </view>

    <view
      v-if="isOpen && !panelAbove"
      :class="ui.panel({ class: props.ui?.panel })"
    >
      <slot name="expanded" v-bind="slotProps" />
    </view>
  </component>
</template>
