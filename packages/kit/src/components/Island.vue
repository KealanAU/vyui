<script lang="ts">
import theme from '../theme/island'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'
// `IslandSize` is intentionally NOT imported here: the two `<script>` blocks
// compile into one module, so importing the same name in both raises TS2300.
// The union is inlined below; the canonical import lives in the setup block.

type IslandTV = ThemeTV<typeof theme>
type IslandVariants = VariantProps<IslandTV>

/**
 * Linear-inspired island container. A floating (or inline) pill hosting a
 * horizontal row of items and, optionally, an expandable panel underneath.
 *
 * Three independent state axes, each with a v-model:
 *  1. `open` — panel expansion; extra rows go in the `#expanded` slot.
 *  2. `mode` — which row mode is active. Free-form strings: `'default'`
 *     renders the default slot, any other value renders `<template #[mode]>`,
 *     falling back to the default slot when no such slot exists.
 *  3. `value` — selected "tab" value; `<VyIslandButton value="inbox">`
 *     auto-highlights and updates the parent on tap.
 *
 * `size` set once on `<VyIsland>` flows to child buttons via context. For
 * placement beyond `top` / `bottom` / `inline`, use `inline` inside your own
 * layout.
 */
export interface IslandProps {
  /** Controlled expanded state — bind with `v-model:open`. */
  open?: boolean
  /** Initial expanded state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * Active row mode — bind with `v-model:mode`. Free-form string: `'default'`
   * renders the default slot, any other value the matching `<template #[mode]>`.
   */
  mode?: string
  /** Initial mode when uncontrolled. @defaultValue `'default'` */
  defaultMode?: string
  /** Selected tab value — bind with `v-model:value`. Children with a `value`
   *  prop auto-highlight when this matches them. */
  value?: string | number | null
  /** Initial value when uncontrolled. */
  defaultValue?: string | number | null
  /**
   * Which viewport edge to float against, when `layer !== 'inline'`. Works via
   * an inline `style`, so a lone `<VyIsland>` hovers with no wrapper. Also sets
   * the panel growth direction. @defaultValue `'bottom'`
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
  /** Sizing variant — inherited by children via context. @defaultValue `'md'` */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Element this container renders as. @defaultValue `'view'` */
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

// Local uncontrolled state, used when the caller didn't bind the matching
// `v-model:*`. Hand-rolled rather than `defineModel` because vue-lynx 0.4.0
// lacks the `mergeModels` runtime export.
const localOpen = ref(props.defaultOpen)
const localMode = ref(props.defaultMode)
const localValue = ref<string | number | null>(props.defaultValue)

// Resolved state — controlled prop wins, else the local ref. Writers update
// both the local ref AND emit so either binding style stays in sync.
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

provideIslandContext({
  open: resolvedOpen,
  mode: resolvedMode,
  value: resolvedValue,
  size: resolvedSize,
  setOpen, toggle, close,
  setMode, resetMode,
  setValue,
})

// Row slot routing — falls back to `default` if the named slot doesn't exist,
// so a mode flip never produces empty content.
const activeRowSlot = computed(() => {
  const name = resolvedMode.value
  if (name === 'default' || !slots[name]) return 'default'
  return name
})

// Count the *renderable* children of a slot — skips comment nodes (a false
// `v-if`) and whitespace text, recursing into fragments.
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
// `style` — a lone island floats with no wrapper. `layer="inline"` returns no
// style so a parent layout owns placement; `base` drops to a low z. A
// caller-passed `style` merges over this via attr fallthrough.
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

// `open` and `expandStyle` are theme variants so `attached` collapses panel +
// row into one chromed surface only while the panel is visible.
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
