<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VyInput, VySelect } from '@vyui/kit'

type PhoneCode = {
  name: string
  code: string
  emoji: string
  dialCode: string
  mask: string
}

const phoneCodes: PhoneCode[] = [
  { name: 'United States', code: 'US', emoji: '\u{1F1FA}\u{1F1F8}', dialCode: '+1', mask: '(###) ###-####' },
  { name: 'United Kingdom', code: 'GB', emoji: '\u{1F1EC}\u{1F1E7}', dialCode: '+44', mask: '#### ### ####' },
  { name: 'Sweden', code: 'SE', emoji: '\u{1F1F8}\u{1F1EA}', dialCode: '+46', mask: '## ### ## ##' },
  { name: 'Australia', code: 'AU', emoji: '\u{1F1E6}\u{1F1FA}', dialCode: '+61', mask: '### ### ###' },
]

const phone = ref('')
const countryCode = ref('US')

const country = computed(() => phoneCodes.find(c => c.code === countryCode.value) ?? phoneCodes[0])
const placeholder = computed(() => country.value.mask.replaceAll('#', '_'))

function formatItem(item: PhoneCode | string | number) {
  if (typeof item !== 'object' || item === null) return String(item)
  return `${item.name} (${item.dialCode})`
}

watch(countryCode, () => {
  phone.value = ''
})
</script>

<template>
  <view class="flex flex-row items-center gap-2 w-[320px]">
    <VySelect
      v-model="countryCode"
      :items="phoneCodes"
      value-key="code"
      label-key="name"
      trailing-icon="i-lucide-chevrons-up-down"
      :snap-points="[0.65]"
      class="w-[86px]"
      :ui="{ value: 'hidden', placeholder: 'hidden', trailingIcon: 'size-4' }"
    >
      <template #default>
        <text class="text-lg">{{ country.emoji }}</text>
      </template>

      <template #item-leading="{ item }">
        <text v-if="typeof item === 'object' && item !== null" class="text-lg">{{ item.emoji }}</text>
      </template>

      <template #item-label="{ item }">
        {{ formatItem(item) }}
      </template>
    </VySelect>

    <VyInput
      v-model="phone"
      type="tel"
      :placeholder="placeholder"
      class="flex-1"
    >
      <template #leading>
        <text class="text-sm text-neutral-500">{{ country.dialCode }}</text>
      </template>
    </VyInput>
  </view>
</template>
