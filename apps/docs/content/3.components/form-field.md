---
title: Form Field
description: Label, description, hint, help, and error scaffold around a single form control.
navigation:
  icon: i-lucide-form-input
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/FormField.vue
    target: _blank
category: Form
---

## Overview

`VyFormField` wraps the headless `@vyui/core` `FormField` with the text scaffold around a control: label, description, hint, help, and error. Inside a [`VyForm`](/components/form) it registers itself under `name`, runs its `validators`, and renders the resulting error; on its own it still renders the scaffold, but the value and error are yours to supply.

## Usage

The default slot receives the field's live `value`, `error`, `setValue`, and `disabled`. Kit controls do not read the field context on their own, so bind them through the slot.

```vue
<script setup lang="ts">
import { VyForm } from '@vyui/kit/form'
import { VyFormField } from '@vyui/kit/form-field'
import { VyInput } from '@vyui/kit/input'

const required = (value: unknown) => (value ? null : 'Email is required')
</script>

<template>
  <VyForm :default-values="{ email: '' }">
    <VyFormField
      name="email"
      label="Email"
      description="We only use this to send receipts."
      help="Work addresses are fine."
      required
      :validators="[required]"
    >
      <template #default="{ value, setValue }">
        <VyInput
          :model-value="value as string"
          placeholder="you@example.com"
          @update:model-value="setValue"
        />
      </template>
    </VyFormField>
  </VyForm>
</template>
```

Passing only `name` to the control forwards the name to the native input; it does not connect the control to the form. Use `setValue` from the slot.

### Manual error

`error` overrides whatever the surrounding form derived, for server-side validation or a control that validates itself.

```vue
<template>
  <VyFormField name="code" label="Invite code" :error="serverError">
    <template #default="{ value, setValue }">
      <VyPinInput :model-value="value as string" @update:model-value="setValue" />
    </template>
  </VyFormField>
</template>
```

### Slot overrides

`label`, `description`, `hint`, `help`, and `error` each take a slot when text alone is not enough. The `error` slot receives the resolved message.

## Features and behavior

- `name` must be unique inside the parent form and is treated as static — swapping it at runtime orphans the registration.
- `validators` run synchronously on submit and stop at the first non-null message.
- `defaultValue` seeds the field only when the form's `defaultValues` has no entry for `name`.
- The error text replaces `help` while it is showing; the two never render together.
- `required` appends a red asterisk to the label, and is presentational — pair it with a validator to actually enforce the field.
- Label and hint share one row; description sits under them, and both blocks are omitted when their props and slots are empty.
- Outside a `VyForm` the component throws, because the core primitive injects the form root context.

## API

### Props

::component-props{name="FormField"}
::

### Slots

::component-slots{name="FormField"}
::

## Styling and theming

Override globally through `appConfig.ui.formField` or per instance with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Vertical stack for the whole field. |
| `wrapper` | Label, hint, and description block. |
| `labelWrapper` | Row holding the label and the right-aligned hint. |
| `label` | Label text, plus the required asterisk. |
| `description` | Text between the label and the control. |
| `container` | Wrapper around the control slot. |
| `error` | Error message under the control. |
| `hint` | Auxiliary text next to the label. |
| `help` | Helper text under the control. |

`size` scales the label, description, hint, help, and error text from `sm` through `xl`; it does not size the control itself.

## Accessibility

The scaffold is text next to a control, not a native label association — Lynx has no `for`/`id` pairing. Screen readers announce the control by its own `accessibility-label`, so give icon-only or ambiguous controls one that matches the visible label, and repeat the error message there when a field is invalid.

## Related components

- [`Form`](/components/form) collects the values these fields register.
- [`Label`](/components/label) for a standalone label with no validation scaffold.
- [`Input`](/components/input), [`Textarea`](/components/textarea), and [`Select`](/components/select) for controls to place inside a field.
