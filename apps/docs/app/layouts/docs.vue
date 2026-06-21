<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { ComponentLayer } from '~/composables/useNavigation'
import { useFilter } from '@nuxt/ui/composables'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const route = useRoute()
const { scoreItem } = useFilter()
const { navigationByCategory, isComponents, layer } = useNavigation(navigation!)

// The Core/Kit layer filter + search input only appear inside Components.
const isSearchActive = isComponents
const searchTerm = ref('')

const layerOptions: { label: string, value: ComponentLayer }[] = [
  { label: 'All', value: 'all' },
  { label: 'Core', value: 'core' },
  { label: 'Kit', value: 'kit' },
]

const filteredNavigation = computed<ContentNavigationItem[]>(() => {
  const nav = navigationByCategory.value
  const term = searchTerm.value.trim()
  if (!isSearchActive.value || !term)
    return nav

  // Components nav is grouped (category -> children); filter within each group.
  return nav
    .map(group => ({
      ...group,
      children: group.children?.filter(child => scoreItem(child, term, ['title', 'description']) !== null),
    }))
    .filter(group => group.children && group.children.length > 0)
})

// Re-key so UContentNavigation re-renders (and re-applies highlight) on filter.
const navigationKey = computed(() => `${route.path}-${layer.value}-${searchTerm.value ? 'filtered' : 'unfiltered'}`)

watch(() => route.path, () => {
  if (!isSearchActive.value)
    searchTerm.value = ''
})

const input = useTemplateRef('input')

defineShortcuts({
  '/': {
    usingInput: false,
    handler: () => {
      input.value?.inputRef?.focus()
    },
  },
})
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <template
            v-if="isSearchActive"
            #top
          >
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center gap-1 rounded-lg bg-elevated/60 p-0.5">
                <button
                  v-for="option in layerOptions"
                  :key="option.value"
                  type="button"
                  class="flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
                  :class="layer === option.value
                    ? 'bg-default text-highlighted shadow-sm'
                    : 'text-muted hover:text-default'"
                  @click="layer = option.value"
                >
                  {{ option.label }}
                </button>
              </div>

              <UInput
                ref="input"
                v-model="searchTerm"
                variant="soft"
                placeholder="Filter components..."
                class="group"
              >
                <template #trailing>
                  <UKbd
                    value="/"
                    variant="subtle"
                    class="ring-muted bg-transparent text-muted"
                  />
                </template>
              </UInput>
            </div>
          </template>

          <UContentNavigation
            :key="navigationKey"
            highlight
            :collapsible="false"
            :navigation="filteredNavigation"
          />
        </UPageAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
