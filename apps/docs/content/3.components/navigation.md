---
title: Navigation
description: Headless stack-navigation primitive for pushing and popping pages with iOS/Material-style slide transitions.
navigation:
  icon: i-lucide-route
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Navigation
    target: _blank
category: Navigation
---

## Overview

`Navigation` is a headless `@vyui/core` primitive for in-app stack navigation: a stack of pages where the top entry is visible, with push/pop slide transitions. State is driven by the `useNavigationStack()` composable; `NavigationStack` renders the active `NavigationPage` and animates between them.

::callout{icon="i-lucide-box"}
This is a layer of `@vyui/core`, behavior only and no styles.
::

## Anatomy

```vue
<NavigationStack>
  <NavigationPage />
  <!-- one NavigationPage per registered key -->
</NavigationStack>
```

## Usage

```vue
<script setup lang="ts">
import {
  NavigationPage,
  NavigationStack,
  useNavigationStack,
} from '@vyui/core'

const stack = useNavigationStack({ key: 'home' })

function openDetail() {
  stack.push({ key: 'detail' })
}
</script>

<template>
  <NavigationStack
    :entries="stack.entries"
    :direction="stack.direction"
    transition="slide"
  >
    <NavigationPage page-key="home">
      <view class="p-4" bindtap="openDetail">
        <text>Home — tap to open detail</text>
      </view>
    </NavigationPage>
    <NavigationPage page-key="detail">
      <view class="p-4" bindtap="stack.pop">
        <text>Detail — tap to go back</text>
      </view>
    </NavigationPage>
  </NavigationStack>
</template>
```

## Features and behavior

- `useNavigationStack()` owns the stack; `push`, `pop`, `replace`, and `reset` update `entries` and `direction`.
- `entries` drives which `NavigationPage` is visible, and the top entry's `key` wins.
- `direction` (`forward` / `back` / `replace` / `reset`) picks the enter/leave animation.
- `transition="slide"` mirrors the iOS / Material push-pop slide; `'none'` swaps instantly.

## API

### `NavigationStack`

::component-props{name="NavigationStack"}
::

### `NavigationPage`

::component-props{name="NavigationPage"}
::

### `useNavigationStack()`

Returns the stack controller: `entries`, `direction`, and the `push` / `pop` / `replace` / `reset` methods. Pass an initial entry to seed the stack.

## Accessibility

- Slide transitions are CSS-driven; respect reduced-motion preferences in your page content where appropriate.
- Ensure each page sets a clear heading so context is announced after a push or pop.

## Platform notes

- Transitions are CSS-driven (see `NavigationPage`); apps can override per-page via slot content.

## Related components

- [`Tabs`](/components/tabs) does flat switching between peers rather than a push/pop stack.
- [`Sheet`](/components/sheet) presents a page modally from the bottom edge.
