<script setup lang="ts">
import { OverlayRoot } from '@/components/OverlayRoot'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '..'

const props = defineProps<{
  rootProps?: { open?: boolean, defaultOpen?: boolean, modal?: boolean }
  forceMount?: boolean
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'interactOutside': [event: any]
  'pointerDownOutside': [event: any]
}>()

function onInteractOutside(e: any) { emit('interactOutside', e) }
function onPointerDownOutside(e: any) { emit('pointerDownOutside', e) }
</script>

<template>
  <view>
    <DialogRoot
      v-bind="props.rootProps"
      @update:open="emit('update:open', $event)"
    >
      <DialogTrigger data-testid="trigger">
        <text>Open</text>
      </DialogTrigger>
      <DialogOverlay data-testid="overlay-impl" />
      <DialogContent
        data-testid="content"
        :force-mount="forceMount"
        @interact-outside="onInteractOutside"
        @pointer-down-outside="onPointerDownOutside"
      >
        <DialogTitle data-testid="title">
          <text>Dialog title</text>
        </DialogTitle>
        <text>Dialog body</text>
        <DialogClose data-testid="close">
          <text>Close</text>
        </DialogClose>
      </DialogContent>
    </DialogRoot>

    <OverlayRoot />
  </view>
</template>
