<script setup lang="ts">
import { ref } from 'vue'
// Imported from the CLI-installed copies (alias `~`), not `@vyui/kit`.
import VyAccordion from '@/components/vyui/Accordion.vue'
import VyAvatar from '@/components/vyui/Avatar.vue'
import VyButton from '@/components/vyui/Button.vue'
import VyChip from '@/components/vyui/Chip.vue'
// The one raw @vyui/core primitive on the page: Sortable is driven by
// main-thread gesture worklets that ship inside the node_modules `@vyui/core`
// dist. It's the worklet smoke-test canary — see lynx.config's
// `includeWorkletPackages`.
import { SortableRoot, SortableItem } from '@vyui/core'

const tasks = ref([
  { id: 'design', label: 'Design the screen' },
  { id: 'build', label: 'Build the interaction' },
  { id: 'ship', label: 'Ship the release' },
])

const accordionOpen = ref<string | number>('q1')
const accordionItems = [
  { value: 'q1', label: 'What is this demo?', content: 'Real @vyui/kit components copied into this app by the vyui CLI.' },
  { value: 'q2', label: 'Where do the files live?', content: 'src/components/vyui and src/lib/vyui — written by `vyui init` + `vyui add`.' },
  { value: 'q3', label: 'Does it depend on @vyui/kit?', content: 'No — only @vyui/core. The styled components were copied in, not imported.' },
]
</script>

<template>
  <scroll-view scroll-orientation="vertical" class="w-full h-full min-h-0 bg-neutral-50">
    <view class="flex flex-col gap-4 p-4">
      <view class="flex flex-col gap-1">
        <text class="text-neutral-900 text-2xl font-bold">vyui CLI demo</text>
        <text class="text-neutral-500 text-sm">Components installed via `vyui add` · default style (green primary)</text>
      </view>

      <!-- Buttons -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Button</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton label="Button" />
          <VyButton leading-icon="i-lucide-heart" label="With icon" />
          <VyButton :loading="true" label="Loading" />
        </view>
        <text class="text-neutral-500 text-xs pt-1">Variants</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton variant="solid" label="Solid" />
          <VyButton variant="outline" label="Outline" />
          <VyButton variant="soft" label="Soft" />
          <VyButton variant="ghost" label="Ghost" />
        </view>
        <text class="text-neutral-500 text-xs pt-1">Sizes</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton size="xs" label="xs" />
          <VyButton size="sm" label="sm" />
          <VyButton size="md" label="md" />
          <VyButton size="lg" label="lg" />
          <VyButton size="xl" label="xl" />
        </view>
      </view>

      <!-- Avatar + Chip -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Avatar &amp; Chip</text>
        <view class="flex flex-row flex-wrap items-center gap-3">
          <VyAvatar alt="Kealan Clarke" />
          <VyAvatar icon="i-lucide-user" />
          <VyAvatar size="lg" alt="Ada Lovelace" />
          <VyChip color="success">
            <VyAvatar alt="Vy" />
          </VyChip>
          <VyChip color="error" :text="3">
            <VyAvatar icon="i-lucide-bell" />
          </VyChip>
        </view>
      </view>

      <!-- Accordion -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
        <text class="text-neutral-900 text-base font-semibold">Accordion</text>
        <VyAccordion v-model="accordionOpen" :items="accordionItems" />
      </view>

      <!-- Sortable — main-thread worklet canary (see lynx.config). Rows are a
           flat 52px pitch (no gap) so SortableItem's MT swap math lines up. -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
        <text class="text-neutral-900 text-base font-semibold">Sortable</text>
        <text class="text-neutral-500 text-xs">Long-press a row and drag to reorder — exercises @vyui/core gesture worklets.</text>
        <SortableRoot v-model="tasks" :item-height="52" class="flex flex-col">
          <SortableItem v-for="(task, index) in tasks" :key="task.id" :index="index">
            <view class="h-[52px] flex flex-row items-center gap-2 px-3 border-b border-solid border-neutral-200">
              <text class="text-neutral-400 text-sm">≡</text>
              <text class="text-neutral-900 text-sm">{{ index + 1 }}. {{ task.label }}</text>
            </view>
          </SortableItem>
        </SortableRoot>
      </view>

      <view class="flex flex-col items-center pt-2 pb-6">
        <text class="text-neutral-400 text-xs">@vyui/cli-demo · Vue-Lynx · Tailwind v3</text>
      </view>
    </view>
  </scroll-view>
</template>
