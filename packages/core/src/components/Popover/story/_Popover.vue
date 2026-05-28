<script setup lang="ts">
import { OverlayRoot } from '@/components/OverlayRoot'
import {
  PopoverClose,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
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
</script>

<template>
  <view>
    <PopoverRoot
      v-bind="props.rootProps"
      @update:open="emit('update:open', $event)"
    >
      <PopoverTrigger data-testid="trigger">
        <text>Open</text>
      </PopoverTrigger>
      <PopoverContent
        data-testid="content"
        :force-mount="forceMount"
        @interact-outside="(e: any) => emit('interactOutside', e)"
        @pointer-down-outside="(e: any) => emit('pointerDownOutside', e)"
      >
        <text>Popover body</text>
        <PopoverClose data-testid="close">
          <text>Close</text>
        </PopoverClose>
      </PopoverContent>
    </PopoverRoot>

    <OverlayRoot />
  </view>
</template>
