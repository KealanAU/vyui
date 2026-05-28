<script setup lang="ts">
import { VyDropdownMenu, VyIslandButton, type DropdownMenuItem } from '@vyui/kit'
import vyuiIcon from '../assets/vyui-icon.png'

// Grouped so the menu renders visible separators between sections.
const items: DropdownMenuItem[][] = [
  [
    { label: 'vyui', description: 'kealanau', avatar: { src: vyuiIcon, alt: 'vyui' } },
  ],
  [
    { label: 'Profile',          icon: 'icon-park-outline:user' },
    { label: 'Preferences',      icon: 'icon-park-outline:setting-two' },
    { label: 'Switch workspace', icon: 'icon-park-outline:switch' },
  ],
  [
    { label: 'Help & docs', icon: 'icon-park-outline:help' },
  ],
  [
    { label: 'Sign out', icon: 'icon-park-outline:logout', color: 'error' },
  ],
]

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <VyDropdownMenu
    v-model:open="open"
    :items="items"
    :content="{ side: 'bottom', align: 'end', sideOffset: 8, alignOffset: 12 }"
  >
    <VyIslandButton icon="icon-park-outline:more" />
  </VyDropdownMenu>
</template>
