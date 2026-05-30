<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'
import { PresenceState } from '@/components/Presence'

export interface DialogRootProps {
  /** The controlled open state of the dialog. Can be bound as `v-model:open`. */
  open?: boolean
  /** The open state of the dialog when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * The modality of the dialog. When set to `true`,
   * interaction with outside elements will be disabled.
   */
  modal?: boolean
}

export type DialogRootEmits = {
  /** Event handler called when the open state of the dialog changes. */
  'update:open': [value: boolean]
}

export interface DialogRootContext {
  open: Readonly<Ref<boolean>>
  modal: Ref<boolean>
  openModal: () => void
  onOpenChange: (value: boolean) => void
  onOpenToggle: () => void
  /**
   * Reference to the painted content node. `unknown`, not `HTMLElement` —
   * there is no DOM on Lynx. Consumed by `DialogContentImpl`.
   */
  contentElement: Ref<unknown>
  /** Deterministic ids, mirroring reka-ui. Assigned lazily by the impl. */
  contentId: string
  titleId: string
  descriptionId: string
  /**
   * Combined Presence state across the backdrop + content layers. Updated by
   * `DialogContent`'s `usePresenceGroup`; consumed by `DialogTrigger` /
   * `DialogClose` to ignore taps mid-animation (see `resolveBusyState` in
   * `./utils`) and by any descendant that wants the live group state.
   *
   * Defaults to `Left` until the first `setGroupState` lands. Lives on the
   * root context so triggers (which mount outside the `<Presence>` subtree
   * and therefore can't `inject(PresenceContextKey)`) can still observe the
   * animating state.
   */
  groupState: Ref<PresenceState>
  setGroupState: (state: PresenceState) => void
}

export const [injectDialogRootContext, provideDialogRootContext]
  = createContext<DialogRootContext>('DialogRoot')
</script>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { useStandardVModelOf } from '@/shared/composables'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DialogRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
})
const emit = defineEmits<DialogRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** Close the dialog */
    close: () => void
  }) => any
}>()

const open = useStandardVModelOf<boolean>(props, 'open', emit)

const { modal } = toRefs(props)

const contentElement = ref<unknown>()

// `groupState` is the parent-owned mirror of the `usePresenceGroup` combined
// state used by `DialogContent`. We seed with the open-aware Entering /
// Left so a `defaultOpen: true` mount renders the trigger in the
// matching "busy entering" state until the group has settled.
const groupState = ref<PresenceState>(
  open.value ? PresenceState.Entering : PresenceState.Left,
)

provideDialogRootContext({
  open,
  modal,
  openModal: () => {
    open.value = true
  },
  onOpenChange: (value) => {
    open.value = value
  },
  onOpenToggle: () => {
    open.value = !open.value
  },
  contentElement,
  contentId: '',
  titleId: '',
  descriptionId: '',
  groupState,
  setGroupState: (s) => {
    groupState.value = s
  },
})
</script>

<template>
  <slot
    :open="open"
    :close="() => open = false"
  />
</template>
