---
title: Collapsible
description: Headless disclosure primitive for a single region that expands and collapses.
navigation:
  icon: i-lucide-chevrons-down-up
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Collapsible
    target: _blank
---

## Overview

`Collapsible` is a headless `@vyui/core` primitive for a single show/hide region toggled by a trigger. It is the one-region building block that the [`Accordion`](/components/accordion) composes for multiple coordinated sections.

::callout{icon="i-lucide-box"}
This is a layer of `@vyui/core`, behavior only. For a styled multi-section disclosure, use `VyAccordion` from `@vyui/kit`.
::

## Anatomy

```vue
<CollapsibleRoot>
  <CollapsibleTrigger />
  <CollapsibleContent />
</CollapsibleRoot>
```

## Usage

```vue
<script setup lang="ts">
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from '@vyui/core'

const open = ref(false)
</script>

<template>
  <CollapsibleRoot v-model:open="open">
    <CollapsibleTrigger>
      <text>{{ open ? 'Hide details' : 'Show details' }}</text>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <view class="p-4">
        <text>Collapsible body content.</text>
      </view>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
```

## Features and behavior

- `open` / `v-model:open` controls the state; `defaultOpen` seeds uncontrolled state.
- `disabled` prevents the trigger from toggling.
- `unmountOnHide` (default `true`) removes the content from the rendered tree when closed.
- `CollapsibleTrigger` reflects the open state through a data/ui state hook for styling.

## API

### `CollapsibleRoot`

::component-props{name="CollapsibleRoot"}
::

::component-emits{name="CollapsibleRoot"}
::

### `CollapsibleTrigger`

::component-props{name="CollapsibleTrigger"}
::

### `CollapsibleContent`

::component-props{name="CollapsibleContent"}
::

## Accessibility

- The trigger exposes native button semantics and announces `collapsed` / `expanded`.
- A disabled trigger is announced as disabled.
- Keep the trigger label descriptive of the region it controls.

## Related components

- [`Accordion`](/components/accordion) gives multiple collapsible sections with single or multiple selection.
- [`Tabs`](/components/tabs) switches between persistent peer panels instead of toggling one.
