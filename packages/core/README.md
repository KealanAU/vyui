# @vyui/core

Headless, accessible UI primitives for [Vue-Lynx](https://vue.lynxjs.org) — the
Radix-style behavior layer of [Vy UI](https://vyui.dev). Ship native apps for
iOS, Android, and web from one Vue codebase.

> ⚠️ **Alpha.** Primitive names, props, and slots have held steady across
> `0.2.x` — the breaking changes were removals of unused exports, plus one move
> of overlay backgrounds out to the styling layer. What can still shift is
> underneath: Vue-Lynx labels itself pre-alpha. Pin your versions.

## What's in it

40+ behavioral primitives — state, focus, keyboard, and gesture handling with
**no styling of their own**. You bring the styles (or use the styled
[`@vyui/kit`](https://www.npmjs.com/package/@vyui/kit) layer on top).

Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Combobox, Select, Tabs,
Accordion, Collapsible, Slider, Swiper, Sortable, Draggable, SwipeAction,
Checkbox, RadioGroup, Switch, Toggle, NumberField, PinInput, Rating, Stepper,
Pagination, Progress, Toast, Avatar, FeedList, Form / Field / Label, and more.

Components expose state attributes (`data-state`, `data-disabled`, …) and
namespaced structural markers (`data-vyui-*`) you can style and select against.

## Install

```sh
npm install @vyui/core
# or: pnpm add @vyui/core
```

Built for Vue-Lynx — `vue` and `@lynx-js/vue` are peer dependencies.

## Usage

Primitives are headless, so they render with your own styling and work without
any further wiring:

```vue
<script setup>
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from '@vyui/core'
import { ref } from 'vue'
const value = ref(50)
</script>

<template>
  <SliderRoot v-model="value" :max="100">
    <SliderTrack><SliderRange /></SliderTrack>
    <SliderThumb />
  </SliderRoot>
</template>
```

## The rest of Vy UI

- **[`@vyui/kit`](https://www.npmjs.com/package/@vyui/kit)** — styled `Vy*`
  components built on these primitives, themeable via Tailwind Variants.
- **[`@vyui/cli`](https://www.npmjs.com/package/@vyui/cli)** — shadcn-style CLI
  that copies styled component source into your project so you own it.

Full docs, API tables, and live examples: **[vyui.dev](https://vyui.dev)**.

## License

MIT © Kealan Clarke and Vy UI contributors
