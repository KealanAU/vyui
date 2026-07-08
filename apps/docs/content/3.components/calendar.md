---
title: Calendar
description: Calendar and date-picker status for Vy UI, including the current Lynx date-runtime blocker.
navigation:
  icon: i-lucide-calendar-days
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Calendar.vue
    target: _blank
---

## Overview

::callout{icon="i-lucide-triangle-alert" color="warning"}
`VyCalendar` is experimental. It intentionally uses ISO date strings at the public boundary because Lynx-native date objects, timezone behavior, locale formatting, and calendar accessibility text still need target verification.
::

`VyCalendar` renders a single-month, single-date picker. It supports controlled ISO date selection, month navigation, fixed weeks, disabled dates, a custom day slot, and a built-in caveat banner that is visible by default.

::component-code
---
name: calendar-example
height: 560px
---
::

This first component is deliberately small until native Lynx date behavior is proven.

## Usage

Use `v-model` with a `YYYY-MM-DD` string. Use `default-month` to choose the initially visible month when the selected value does not define it.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyCalendar } from '@vyui/kit'

const date = ref('2026-07-05')
</script>

<template>
  <VyCalendar
    v-model="date"
    default-month="2026-07"
    :disabled-dates="['2026-07-10', '2026-07-11']"
  />
</template>
```

### Caveat banner

The date-runtime warning is shown by default. Hide it only when the parent surface already explains the limitation.

```vue
<VyCalendar v-model="date" :caveat="false" />
```

You can also replace the banner with the `caveat` slot.

```vue
<VyCalendar v-model="date">
  <template #caveat>
    <VyAlert
      color="warning"
      variant="soft"
      title="Date picker is experimental"
      description="This app stores UTC-normalized ISO dates."
    />
  </template>
</VyCalendar>
```

### Custom day content

Use the `day` slot for badges, pricing, availability, or event markers. Slot props include `iso`, `day`, `month`, `year`, `inMonth`, `selected`, `today`, and `disabled`.

```vue
<VyCalendar v-model="date">
  <template #day="{ day }">
    <VyChip :show="day.iso === '2026-07-05'" color="success">
      <text>{{ day.day }}</text>
    </VyChip>
  </template>
</VyCalendar>
```

## Features and behavior

- `modelValue` and `update:modelValue` use `YYYY-MM-DD`.
- `month` and `update:month` use `YYYY-MM`.
- Selecting an outside-month day moves the visible month to that date's month.
- `fixedWeeks` defaults to `true` and renders six weeks to avoid height changes.
- `disabledDates` accepts exact ISO dates that cannot be selected.
- The component intentionally does not accept or emit host `Date` objects.

## Current Blocker

The remaining blocker is not visual styling. It is correctness across runtimes:

- Native Lynx/PrimJS can have incomplete or inconsistent `Intl` date formatting support.
- Host `Date` objects carry timezone behavior that can shift calendar days when serialized or converted.
- `@internationalized/date` values need target verification before a public component relies on them.
- Accessibility text for selected dates, ranges, disabled dates, and month/year navigation needs locale-safe formatting.

Until those are resolved, a documented app-owned picker is safer than a package component that looks complete but stores or announces dates incorrectly.

## Roadmap

Future calendar work is focused on closing the date-runtime gaps first, then expanding the API. We are aiming for parity with [Nuxt UI's `UCalendar`](https://ui.nuxt.com/components/calendar) once those pieces are safe to support on Lynx:

- `multiple` for selecting more than one date.
- `range` for start/end selection.
- Month and year views.
- Disabled date predicates.
- Week numbers.
- Locale-aware month, weekday, and announcement text that works consistently on native Lynx and web.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `undefined` | Controlled selected date as `YYYY-MM-DD`. |
| `defaultValue` | `string` | `undefined` | Initial selected date for uncontrolled usage. |
| `month` | `string` | `undefined` | Controlled visible month as `YYYY-MM`. |
| `defaultMonth` | `string` | selected/current month | Initial visible month as `YYYY-MM`. |
| `weekStartsOn` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | `0` | First day of the week, Sunday through Saturday. |
| `fixedWeeks` | `boolean` | `true` | Always render six weeks. |
| `disabled` | `boolean` | `false` | Prevent all date selection. |
| `disabledDates` | `string[]` | `[]` | Exact ISO dates that cannot be selected. |
| `caveat` | `boolean` | `true` | Show the built-in Lynx date-runtime warning. |
| `caveatTitle` | `string` | see source | Built-in warning title. |
| `caveatDescription` | `string` | see source | Built-in warning description. |
| `color` | `Color` | `'primary'` | Selected-day color. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Calendar scale. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<CalendarSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Selected date changed. |
| `update:month` | `string` | Visible month changed. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `day` | `{ day: CalendarDay }` | Replaces the day cell content. |
| `caveat` | — | Replaces the built-in warning banner. |

## Related

- [`Input`](/components/input) for composing a date field with a custom picker trigger.
- [`Select`](/components/select) for simple month/year picker prototypes.
- [`i18n`](/i18n) for the current `Intl` formatter stopgaps.
- [`Roadmap`](/getting-started/roadmap) for planned date and internationalization work.
