<script setup lang="ts">
import type { VyStyle } from '@vyui/core'
import { ref } from 'vue'
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogClose,
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectItemText,
} from '@vyui/core'
import { ACCENT, ACCENT_LIGHT, DANGER, DemoCard, DemoLabel, DemoHint, DemoSwitcher } from './_shared'

const showComponent = ref(0)
const CARDS = 5

const alertDeleted = ref(false)
const selectedFruit = ref('')
const FRUIT_LABELS: Record<string, string> = { apple: 'Apple 🍎', banana: 'Banana 🍌', cherry: 'Cherry 🍒' }
const dropdownAction = ref('')

// Triggers — standardised on Phase 1's button spec:
// 16px horizontal / 9px vertical padding, 8px border radius,
// comfortable hit area, no drop-shadows.
const BTN_BASE: VyStyle = {
  paddingLeft: '16px', paddingRight: '16px',
  paddingTop: '9px', paddingBottom: '9px',
  minHeight: '38px',
  borderRadius: '8px',
  alignItems: 'center',
  justifyContent: 'center',
  display: 'flex',
  flexDirection: 'row',
  alignSelf: 'flex-start',
}

// Shared label spec for buttons — 13px / 600 weight, never cramped.
// lineHeight gives the glyphs leading so they don't hug the button edges.
const BTN_LABEL: VyStyle = {
  fontSize: '13px',
  fontWeight: '600',
  lineHeight: '18px',
}

const BTN_PRIMARY = {
  ...BTN_BASE,
  backgroundColor: ACCENT,
}

const BTN_SECONDARY = {
  ...BTN_BASE,
  backgroundColor: '#f8fafc',
  borderWidth: '1px',
  borderColor: '#e2e8f0',
}

const BTN_DANGER = {
  ...BTN_BASE,
  backgroundColor: '#fef2f2',
  borderWidth: '1px',
  borderColor: '#fecaca',
}

// Shared overlay styles
const BACKDROP_DARK: VyStyle = { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }
const BACKDROP_DIM = { backgroundColor: 'rgba(0,0,0,0.35)' }
// Bottom-sheet backdrop: dim + docks the panel to the bottom edge.
const SHEET_BACKDROP: VyStyle = {
  ...BACKDROP_DIM,
  alignItems: 'stretch',
  justifyContent: 'flex-end',
}

const MODAL: VyStyle = {
  width: '300px',
  backgroundColor: '#fff',
  borderRadius: '18px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const MODAL_ACTIONS: VyStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: '10px',
  justifyContent: 'flex-end',
}

const MODAL_BTN_CANCEL: VyStyle = {
  paddingLeft: '16px', paddingRight: '16px',
  paddingTop: '9px', paddingBottom: '9px',
  minHeight: '38px',
  borderRadius: '8px',
  borderWidth: '1px',
  borderColor: '#e2e8f0',
  backgroundColor: '#f8fafc',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
}

const MODAL_BTN_CONFIRM: VyStyle = {
  paddingLeft: '16px', paddingRight: '16px',
  paddingTop: '9px', paddingBottom: '9px',
  minHeight: '38px',
  borderRadius: '8px',
  backgroundColor: ACCENT,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
}

const MODAL_BTN_CONFIRM_DANGER: VyStyle = {
  paddingLeft: '16px', paddingRight: '16px',
  paddingTop: '9px', paddingBottom: '9px',
  minHeight: '38px',
  borderRadius: '8px',
  backgroundColor: DANGER,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
}

const SHEET = {
  backgroundColor: '#fff',
  borderTopLeftRadius: '18px',
  borderTopRightRadius: '18px',
  paddingTop: '6px', paddingBottom: '6px',
  maxHeight: '60%',
}

const MENU = {
  backgroundColor: '#fff',
  borderRadius: '14px',
  borderWidth: '1px',
  borderColor: '#e2e8f0',
  overflow: 'hidden',
  minWidth: '200px',
  marginLeft: '16px', marginRight: '16px',
  marginBottom: '40px',
}

const MENU_ITEM: VyStyle = {
  paddingLeft: '16px', paddingRight: '16px',
  paddingTop: '14px', paddingBottom: '14px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '12px',
}

const MENU_LABEL = {
  paddingLeft: '16px', paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '4px',
}

const SEPARATOR = { height: '1px', backgroundColor: '#f1f5f9' }
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">

    <DemoSwitcher v-model="showComponent" :total="CARDS" />

    <!-- Dialog -->
    <DemoCard v-if="showComponent === 0 || showComponent === 1">
      <DemoLabel>DIALOG</DemoLabel>
      <DemoHint>Tap to open a modal dialog</DemoHint>
      <DialogRoot>
        <DialogTrigger :style="BTN_PRIMARY">
          <text :style="{ ...BTN_LABEL, color: '#fff' }">Open Dialog</text>
        </DialogTrigger>
        <DialogContent :backdropStyle="BACKDROP_DARK" :style="MODAL">
          <view :style="{ display: 'flex', flexDirection: 'column', gap: '4px' }">
            <text :style="{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }">Edit Profile</text>
            <text :style="{ fontSize: '14px', color: '#64748b' }">Make changes to your profile here.</text>
          </view>
          <view :style="{ height: '1px', backgroundColor: '#f1f5f9' }" />
          <view :style="MODAL_ACTIONS">
            <DialogClose :style="MODAL_BTN_CANCEL">
              <text :style="{ ...BTN_LABEL, color: '#64748b' }">Cancel</text>
            </DialogClose>
            <DialogClose :style="MODAL_BTN_CONFIRM">
              <text :style="{ ...BTN_LABEL, color: '#fff' }">Save</text>
            </DialogClose>
          </view>
        </DialogContent>
      </DialogRoot>
    </DemoCard>

    <!-- AlertDialog -->
    <DemoCard v-if="showComponent === 0 || showComponent === 2">
      <DemoLabel>ALERT DIALOG</DemoLabel>
      <DemoHint>Confirm a destructive action</DemoHint>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
        <AlertDialogRoot>
          <AlertDialogTrigger :style="BTN_DANGER">
            <text :style="{ ...BTN_LABEL, color: DANGER }">Delete Item</text>
          </AlertDialogTrigger>
          <AlertDialogContent :backdropStyle="BACKDROP_DARK" :style="MODAL">
            <view :style="{ display: 'flex', flexDirection: 'column', gap: '4px' }">
              <text :style="{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }">Are you sure?</text>
              <text :style="{ fontSize: '14px', color: '#64748b' }">This action cannot be undone. The item will be permanently deleted.</text>
            </view>
            <view :style="{ height: '1px', backgroundColor: '#f1f5f9' }" />
            <view :style="MODAL_ACTIONS">
              <AlertDialogCancel :style="MODAL_BTN_CANCEL">
                <text :style="{ ...BTN_LABEL, color: '#64748b' }">Cancel</text>
              </AlertDialogCancel>
              <AlertDialogAction @click="alertDeleted = true" :style="MODAL_BTN_CONFIRM_DANGER">
                <text :style="{ ...BTN_LABEL, color: '#fff' }">Delete</text>
              </AlertDialogAction>
            </view>
          </AlertDialogContent>
        </AlertDialogRoot>
        <view v-if="alertDeleted" :style="{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '20px', backgroundColor: '#f0fdf4', borderWidth: '1px', borderColor: '#bbf7d0' }">
          <text :style="{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }">Deleted ✓</text>
        </view>
      </view>
    </DemoCard>

    <!-- Popover -->
    <DemoCard v-if="showComponent === 0 || showComponent === 3">
      <DemoLabel>POPOVER</DemoLabel>
      <DemoHint>Tap to open a floating panel</DemoHint>
      <PopoverRoot>
        <PopoverTrigger :style="BTN_SECONDARY">
          <text :style="{ ...BTN_LABEL, color: '#0f172a' }">Open Popover</text>
        </PopoverTrigger>
        <PopoverContent :style="{
          width: '240px', backgroundColor: '#fff', borderRadius: '14px', padding: '16px',
          borderWidth: '1px', borderColor: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px',
        }">
          <text :style="{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }">Dimensions</text>
          <view :style="{ display: 'flex', flexDirection: 'column', gap: '0px' }">
            <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingTop: '9px', paddingBottom: '9px', borderBottomWidth: '1px', borderBottomColor: '#f1f5f9' }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">Width</text>
              <text :style="{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }">100%</text>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingTop: '9px', paddingBottom: '9px', borderBottomWidth: '1px', borderBottomColor: '#f1f5f9' }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">Height</text>
              <text :style="{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }">auto</text>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingTop: '9px', paddingBottom: '9px' }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">Max Width</text>
              <text :style="{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }">300px</text>
            </view>
          </view>
          <PopoverClose :style="{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', minHeight: '38px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ ...BTN_LABEL, color: '#64748b' }">Close</text>
          </PopoverClose>
        </PopoverContent>
      </PopoverRoot>
    </DemoCard>

    <!-- DropdownMenu -->
    <DemoCard v-if="showComponent === 0 || showComponent === 4">
      <DemoLabel>DROPDOWN MENU</DemoLabel>
      <DemoHint>Tap to open an action sheet</DemoHint>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
        <DropdownMenuRoot>
          <DropdownMenuTrigger :style="{
            ...BTN_BASE,
            backgroundColor: '#fff',
            borderWidth: '1px', borderColor: '#e2e8f0',
            gap: '8px',
          }">
            <text :style="{ ...BTN_LABEL, color: '#0f172a' }">Options</text>
            <text :style="{ fontSize: '12px', color: '#94a3b8' }">▾</text>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            :backdrop-style="{
              alignItems: 'stretch',
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }"
            :style="MENU"
          >
            <DropdownMenuLabel :style="MENU_LABEL">
              <text :style="{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.6px' }">MY ACCOUNT</text>
            </DropdownMenuLabel>
            <DropdownMenuItem @select="dropdownAction = 'Profile'" :style="MENU_ITEM">
              <text :style="{ fontSize: '16px' }">👤</text>
              <text :style="{ fontSize: '15px', color: '#0f172a' }">Profile</text>
            </DropdownMenuItem>
            <DropdownMenuItem @select="dropdownAction = 'Settings'" :style="MENU_ITEM">
              <text :style="{ fontSize: '16px' }">⚙</text>
              <text :style="{ fontSize: '15px', color: '#0f172a' }">Settings</text>
            </DropdownMenuItem>
            <view :style="SEPARATOR" />
            <DropdownMenuItem @select="dropdownAction = 'Logout'" :style="MENU_ITEM">
              <text :style="{ fontSize: '16px' }">🚪</text>
              <text :style="{ fontSize: '15px', color: DANGER, fontWeight: '600' }">Log out</text>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
        <view v-if="dropdownAction" :style="{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '20px', backgroundColor: '#f1f5f9' }">
          <text :style="{ fontSize: '13px', fontWeight: '600', color: '#64748b' }">{{ dropdownAction }}</text>
        </view>
      </view>
    </DemoCard>

    <!-- Select -->
    <DemoCard v-if="showComponent === 0 || showComponent === 5">
      <DemoLabel>SELECT</DemoLabel>
      <DemoHint>Tap to pick an option from a sheet</DemoHint>
      <SelectRoot v-model="selectedFruit">
        <SelectTrigger :style="{
          ...BTN_BASE,
          alignSelf: 'stretch',
          backgroundColor: selectedFruit ? ACCENT_LIGHT : '#f8fafc',
          borderWidth: '1px', borderColor: selectedFruit ? ACCENT : '#e2e8f0',
          gap: '8px',
        }">
          <text :style="{ ...BTN_LABEL, color: selectedFruit ? ACCENT : '#94a3b8', fontWeight: selectedFruit ? '600' : '400', flex: 1 }">
            {{ selectedFruit ? FRUIT_LABELS[selectedFruit] : 'Select fruit…' }}
          </text>
          <text :style="{ fontSize: '12px', color: selectedFruit ? ACCENT : '#94a3b8' }">▾</text>
        </SelectTrigger>
        <SelectContent :backdropStyle="SHEET_BACKDROP" :style="SHEET">
          <SelectItem
            v-for="{ value, label } in [{ value: 'apple', label: 'Apple 🍎' }, { value: 'banana', label: 'Banana 🍌' }, { value: 'cherry', label: 'Cherry 🍒' }]"
            :key="value"
            :value="value"
            :style="{
              paddingLeft: '20px', paddingRight: '20px', paddingTop: '15px', paddingBottom: '15px',
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: selectedFruit === value ? ACCENT_LIGHT : 'transparent',
              borderBottomWidth: '1px', borderBottomColor: '#f8fafc',
            }"
          >
            <SelectItemText :style="{ fontSize: '16px', color: selectedFruit === value ? ACCENT : '#0f172a', fontWeight: selectedFruit === value ? '600' : '400' }">
              {{ label }}
            </SelectItemText>
            <view v-if="selectedFruit === value" :style="{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ color: '#fff', fontSize: '11px', fontWeight: '700' }">✓</text>
            </view>
          </SelectItem>
        </SelectContent>
      </SelectRoot>
    </DemoCard>

  </view>
</template>
