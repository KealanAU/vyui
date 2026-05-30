<!-- Copyright 2026 The Lynx Authors. All rights reserved. -->
<script lang="ts">
import type { AsTag } from '../Primitive'

export interface SheetTriggerProps {
  as?: AsTag
  asChild?: boolean
}
</script>

<script setup lang="ts">
import { useA11y } from '@/shared/composables'
import { Primitive } from '../Primitive'
import { injectSheetRootContext } from './sheetContext'

withDefaults(defineProps<SheetTriggerProps>(), { as: 'view' })

const ctx = injectSheetRootContext()

function onTap() {
  ctx.setOpen(true)
}

const a11y = useA11y(() => ({
  role: 'button',
  state: ctx.open.value ? 'expanded' : 'collapsed',
}))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="a11y"
    :data-state="ctx.open.value ? 'open' : 'closed'"
    @tap="onTap"
  >
    <slot />
  </Primitive>
</template>
