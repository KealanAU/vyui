---
title: Form
description: A form container that tracks values, runs validators, and emits submit.
navigation:
  icon: i-lucide-clipboard-list
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Form.vue
    target: _blank
---

## Overview

`VyForm` wraps the headless `@vyui/core` FormRoot. It tracks field values keyed by name, runs synchronous validators, and emits `submit` with the collected values when the form is clean. Pair it with [`VyFormField`](/components/form-field) for per-field labels, errors, and validation.

## Usage

Provide `defaultValues`, read live state from the default slot, and call the exposed `submit()` / `reset()` via a template ref.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyForm } from '@vyui/kit/form'
import { VyFormField } from '@vyui/kit/form-field'
import { VyInput } from '@vyui/kit/input'
import { VyButton } from '@vyui/kit/button'

const form = ref()

function onSubmit(values: Record<string, unknown>) {
  // send values ...
}
</script>

<template>
  <VyForm
    ref="form"
    :default-values="{ email: '' }"
    @submit="onSubmit"
  >
    <template #default="{ submitting }">
      <VyFormField name="email" label="Email">
        <VyInput name="email" />
      </VyFormField>

      <VyButton :loading="submitting" label="Submit" @tap="form.submit()" />
    </template>
  </VyForm>
</template>
```

## Features and behavior

- `defaultValues` seeds the initial field values and is what `reset()` restores.
- The default slot exposes live `values`, `errors`, and `submitting` state.
- `submit()` runs synchronous validators and emits `submit` only when there are no errors.
- `reset()` clears errors and restores `defaultValues`.
- `disabled` disables every nested field.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultValues` | `Record<string, unknown>` | `undefined` | Initial values keyed by field name; used by `reset()`. |
| `disabled` | `boolean` | `undefined` | Disable every nested field. |
| `class` | `any` | `undefined` | Classes applied to the form wrapper. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `submit` | `Record<string, unknown>` | Emitted on a clean submit with the collected values. |
| `update:values` | `Record<string, unknown>` | Emitted whenever a field value changes. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ values, errors, submitting }` | Form content, with live state. |

## Exposed methods

Access these through a template ref on the component.

| Method | Description |
| --- | --- |
| `submit()` | Run sync validators and emit `submit` when clean. |
| `reset()` | Clear errors and restore `defaultValues`. |

## Accessibility

`VyForm` is a structural container and adds no styling of its own beyond the wrapper `class`. Label each control through [`VyFormField`](/components/form-field) or [`VyLabel`](/components/label) so fields and their errors are announced.

## Related components

- [`FormField`](/components/form-field) for per-field label, error, and validation wiring.
- [`Input`](/components/input), [`Textarea`](/components/textarea), and [`Checkbox`](/components/checkbox) for form controls.
- [`Button`](/components/button) for the submit control.
