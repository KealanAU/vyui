<script setup lang="ts">
import type { PaginationEllipsisProps, PaginationFirstProps, PaginationLastProps, PaginationListItemProps, PaginationListProps, PaginationNextProps, PaginationPrevProps, PaginationRootProps } from '..'
import { computed } from 'vue'
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '..'

const props = defineProps<{
  root?: PaginationRootProps
  list?: PaginationListProps
  first?: PaginationFirstProps
  prev?: PaginationPrevProps
  listItem?: Partial<PaginationListItemProps>
  ellipsis?: PaginationEllipsisProps
  next?: PaginationNextProps
  last?: PaginationLastProps
  showEdges?: boolean
}>()

const rootProps = computed(() => ({ total: 100, ...props.root }))
</script>

<template>
  <PaginationRoot v-bind="rootProps" :items-per-page="10" :show-edges="showEdges">
    <PaginationList v-slot="{ items }" v-bind="props.list">
      <PaginationFirst v-bind="props.first" />
      <PaginationPrev v-bind="props.prev" />
      <template v-for="(page, index) in items">
        <PaginationListItem
          v-if="page.type === 'page'"
          :key="index"
          :value="page.value"
          v-bind="props.listItem"
        >
          <text>{{ page.value }}</text>
        </PaginationListItem>
        <PaginationEllipsis
          v-else
          :key="page.type"
          :index="index"
          v-bind="props.ellipsis"
        >
          <text>...</text>
        </PaginationEllipsis>
      </template>
      <PaginationNext v-bind="props.next" />
      <PaginationLast v-bind="props.last" />
    </PaginationList>
  </PaginationRoot>
</template>
