<script setup lang="ts">
import { OverlayRoot } from '@/components/OverlayRoot'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogRoot,
  AlertDialogTrigger,
} from '..'

const props = defineProps<{
  rootProps?: { open?: boolean, defaultOpen?: boolean }
  forceMount?: boolean
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'click': []
}>()
</script>

<template>
  <view>
    <AlertDialogRoot
      v-bind="props.rootProps"
      @update:open="emit('update:open', $event)"
    >
      <AlertDialogTrigger data-testid="trigger">
        <text>Delete</text>
      </AlertDialogTrigger>
      <AlertDialogOverlay data-testid="overlay-impl" />
      <AlertDialogContent
        data-testid="content"
        :force-mount="forceMount"
      >
        <text>Are you sure?</text>
        <AlertDialogAction data-testid="action" @click="emit('click')">
          <text>Confirm</text>
        </AlertDialogAction>
        <AlertDialogCancel data-testid="cancel">
          <text>Cancel</text>
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialogRoot>

    <OverlayRoot />
  </view>
</template>
