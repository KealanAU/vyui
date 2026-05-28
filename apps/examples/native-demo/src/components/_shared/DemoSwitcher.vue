<script setup lang="ts">
// Component isolation switcher.
//   v-model = 0 → show all cards; v-model = N → show only N-th.
// Use inside a phase to bisect which card breaks the build.
import { ACCENT, ACCENT_LIGHT } from './tokens'

const props = defineProps<{ modelValue: number; total: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

function set(n: number) {
  emit('update:modelValue', n)
}
</script>

<template>
  <view :style="{
    display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: '6px',
    paddingTop: '10px', paddingBottom: '10px', paddingLeft: '12px', paddingRight: '12px',
    borderRadius: '10px', backgroundColor: '#f8fafc',
    borderWidth: '1px', borderColor: '#e2e8f0',
  }">
    <text :style="{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginRight: '4px' }">SHOW</text>
    <view @tap="set(0)" :style="{
      paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px',
      borderRadius: '6px',
      backgroundColor: props.modelValue === 0 ? ACCENT : ACCENT_LIGHT,
    }">
      <text :style="{
        fontSize: '11px', fontWeight: '700',
        color: props.modelValue === 0 ? '#fff' : ACCENT,
      }">ALL</text>
    </view>
    <view
      v-for="n in props.total"
      :key="n"
      @tap="set(n)"
      :style="{
        paddingLeft: '9px', paddingRight: '9px', paddingTop: '4px', paddingBottom: '4px',
        borderRadius: '6px',
        backgroundColor: props.modelValue === n ? ACCENT : '#ffffff',
        borderWidth: '1px',
        borderColor: props.modelValue === n ? ACCENT : '#e2e8f0',
      }"
    >
      <text :style="{
        fontSize: '11px', fontWeight: '700',
        color: props.modelValue === n ? '#fff' : '#64748b',
      }">{{ n }}</text>
    </view>
  </view>
</template>
