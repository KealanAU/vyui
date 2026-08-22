<script setup lang="ts">
import { ref } from 'vue'
import { OverlayRoot } from '@/components/OverlayRoot'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '..'

const props = defineProps<{
  rootProps?: { open?: boolean, defaultOpen?: boolean, modal?: boolean }
  triggerDisabled?: boolean
  itemDisabled?: boolean
  subTriggerDisabled?: boolean
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'select': []
}>()

const checked = ref(false)
const radio = ref('one')
</script>

<template>
  <view>
    <DropdownMenuRoot
      v-bind="props.rootProps"
      @update:open="emit('update:open', $event)"
    >
      <DropdownMenuTrigger
        data-testid="trigger"
        :disabled="triggerDisabled"
      >
        <text>Menu</text>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-testid="content">
        <DropdownMenuItem
          data-testid="item-1"
          @select="emit('select')"
        >
          <text>Item 1</text>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="item-disabled"
          :disabled="itemDisabled"
        >
          <text>Disabled</text>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="item-icon"
          accessibility-label="Settings"
        >
          <text>⚙</text>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          v-model:checked="checked"
          data-testid="checkbox-item"
        >
          <DropdownMenuItemIndicator data-testid="checkbox-indicator-root">
            <text data-testid="checkbox-indicator">x</text>
          </DropdownMenuItemIndicator>
          <text>Toggle</text>
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup v-model="radio">
          <DropdownMenuRadioItem
            value="one"
            data-testid="radio-one"
          >
            <text>One</text>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="two"
            data-testid="radio-two"
          >
            <text>Two</text>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            data-testid="sub-trigger"
            :disabled="subTriggerDisabled"
          >
            <text>More</text>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent data-testid="sub-content">
            <DropdownMenuItem data-testid="sub-item">
              <text>Sub Item</text>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuRoot>

    <OverlayRoot />
  </view>
</template>
