<script setup lang="ts">
import type { VyStyle } from '@vyui/core'
import { ref } from 'vue'
import {
  ComboboxRoot,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxViewport,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxItemIndicator,
} from '@vyui/core'
import { ACCENT, ACCENT_LIGHT, DemoCard, DemoLabel, DemoHint, DemoSwitcher } from './_shared'

const FIELD: VyStyle = {
  paddingLeft: '12px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px',
  borderRadius: '8px', borderWidth: '1px', borderColor: '#e2e8f0',
  backgroundColor: '#f8fafc',
  display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px',
}
const PANEL = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  borderWidth: '1px',
  borderColor: '#e2e8f0',
  overflow: 'hidden',
}
const ITEM: VyStyle = {
  paddingLeft: '14px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px',
  display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
}

const fruit = ref('')
const fruits = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']

const showComponent = ref(0)
const CARDS = 1
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">

    <DemoSwitcher v-model="showComponent" :total="CARDS" />

    <!-- Combobox -->
    <DemoCard v-if="showComponent === 0 || showComponent === 1">
      <DemoLabel>COMBOBOX</DemoLabel>
      <DemoHint>Type to filter, tap to select</DemoHint>
      <ComboboxRoot v-model="fruit">
        <ComboboxAnchor :style="FIELD">
          <ComboboxInput placeholder="Search fruit…" :style="{ flex: '1', fontSize: '14px', color: '#0f172a' }" />
          <ComboboxTrigger accessibility-label="Show options">
            <text :style="{ fontSize: '12px', color: '#94a3b8' }">▾</text>
          </ComboboxTrigger>
        </ComboboxAnchor>
        <ComboboxContent :style="{
          ...PANEL,
          position: 'absolute', left: '0', right: '0', bottom: '0',
          borderTopLeftRadius: '12px', borderTopRightRadius: '12px',
          maxHeight: '60%',
        }">
          <ComboboxViewport>
            <ComboboxEmpty :style="{ padding: '14px' }">
              <text :style="{ fontSize: '14px', color: '#94a3b8' }">No fruit found</text>
            </ComboboxEmpty>
            <ComboboxItem v-for="f in fruits" :key="f" :value="f" :style="ITEM">
              <text :style="{ fontSize: '15px', color: '#0f172a' }">{{ f }}</text>
              <ComboboxItemIndicator>
                <text :style="{ fontSize: '13px', fontWeight: '700', color: ACCENT }">✓</text>
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxRoot>
      <view v-if="fruit" :style="{
        alignSelf: 'flex-start',
        paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px',
        borderRadius: '20px', backgroundColor: ACCENT_LIGHT,
      }">
        <text :style="{ fontSize: '13px', fontWeight: '600', color: ACCENT }">{{ fruit }}</text>
      </view>
    </DemoCard>

  </view>
</template>
