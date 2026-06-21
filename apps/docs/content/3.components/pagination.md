---
title: Pagination
description: Headless pagination primitive — page list, edges, and prev/next controls computed from total and page size.
navigation:
  icon: i-lucide-ellipsis
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Pagination
    target: _blank
---

## Overview

`Pagination` is a headless `@vyui/core` primitive that derives a page range from `total` and `itemsPerPage` and exposes the controls to move through it. It ships behavior only — you supply the markup and styling for each page item, ellipsis, and edge control.

::callout{icon="i-lucide-box"}
This is a layer of `@vyui/core` — behavior only, no styles.
::

## Anatomy

```vue
<PaginationRoot>
  <PaginationList v-slot="{ items }">
    <PaginationFirst />
    <PaginationPrev />
    <template v-for="(item, i) in items" :key="i">
      <PaginationListItem v-if="item.type === 'page'" :value="item.value" />
      <PaginationEllipsis v-else />
    </template>
    <PaginationNext />
    <PaginationLast />
  </PaginationList>
</PaginationRoot>
```

## Usage

```vue
<script setup lang="ts">
import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from '@vyui/core'

const page = ref(1)
</script>

<template>
  <PaginationRoot
    v-model:page="page"
    :total="120"
    :items-per-page="10"
    :sibling-count="1"
    show-edges
  >
    <PaginationList v-slot="{ items }">
      <PaginationPrev>
        <text>Prev</text>
      </PaginationPrev>
      <template v-for="(item, i) in items" :key="i">
        <PaginationListItem v-if="item.type === 'page'" :value="item.value">
          <text>{{ item.value }}</text>
        </PaginationListItem>
        <PaginationEllipsis v-else>
          <text>…</text>
        </PaginationEllipsis>
      </template>
      <PaginationNext>
        <text>Next</text>
      </PaginationNext>
    </PaginationList>
  </PaginationRoot>
</template>
```

## Features and behavior

- `page` / `v-model:page` controls the active page; `defaultPage` seeds uncontrolled state.
- `itemsPerPage` is required; combined with `total` it computes the number of pages.
- `siblingCount` sets how many page items show on each side of the current page.
- `showEdges` always renders the first page, last page, and ellipses.
- `disabled` blocks interaction with all controls.

## API

### `PaginationRoot`

::component-props{name="PaginationRoot"}
::

::component-emits{name="PaginationRoot"}
::

### `PaginationList`

::component-props{name="PaginationList"}
::

### `PaginationListItem`

::component-props{name="PaginationListItem"}
::

### `PaginationPrev` / `PaginationNext`

::component-props{name="PaginationPrev"}
::

::component-props{name="PaginationNext"}
::

### `PaginationFirst` / `PaginationLast`

::component-props{name="PaginationFirst"}
::

::component-props{name="PaginationLast"}
::

## Accessibility

- Each control exposes native button semantics; give prev/next/first/last descriptive labels.
- The current page item is marked selected so assistive tech announces position.

## Related components

- [`Tabs`](/components/tabs) — switch between a small fixed set of panels.
- [`FeedList`](/components/feedlist) — infinite/virtualized lists instead of discrete pages.
