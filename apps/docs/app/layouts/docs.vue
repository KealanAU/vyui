<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { useFilter } from '@nuxt/ui/composables'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const route = useRoute()
const { scoreItem } = useFilter()
const { navigationByCategory, isComponents, layer } = useNavigation(navigation!)

// The filter input only appears inside the Components category.
const isSearchActive = isComponents
const searchTerm = ref('')

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
