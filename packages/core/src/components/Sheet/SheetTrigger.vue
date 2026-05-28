<!-- Copyright 2026 The Lynx Authors. All rights reserved. -->
<script lang="ts">
import type { AsTag } from '../Primitive'

export interface SheetTriggerProps {
  as?: AsTag
  asChild?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive'
import { injectSheetRootContext } from './sheetContext'

withDefaults(defineProps<SheetTriggerProps>(), { as: 'view' })

const ctx = injectSheetRootContext()

function onTap() {
  ctx.setOpen(true)
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="ctx.open.value ? 'open' : 'closed'"
    @tap="onTap"
  >
    <slot />
  </Primitive>
</template>
