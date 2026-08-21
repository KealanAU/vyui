// Copyright 2026 The Lynx Authors. All rights reserved. Licensed under the Apache License Version 2.0. Adapted from lynx-family/lynx-ui (Apache 2.0).

import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { fireEvent, q, render, waitForUpdate } from '@vyui/testing-utils'

import {
  FormField,
  FormRoot,
  type FormRootExposed,
  FormSubmitButton,
  useFormField,
} from '.'
import FormStory from './story/_Form.vue'

describe('Form — exports', () => {
  it('exports the orchestration primitives', () => {
    expect(FormRoot).toBeTruthy()
    expect(FormField).toBeTruthy()
    expect(FormSubmitButton).toBeTruthy()
    expect(typeof useFormField).toBe('function')
  })
})

describe('Form — story', () => {
  it('mounts and exposes initial values via the scoped slot', () => {
    const { container } = render(FormStory)
    // `FormRoot` is a render-less slot wrapper — there's no root host to
    // attach `data-testid` to. Instead probe the scoped-slot output.
    expect(q(container, 'values')!.textContent).toContain('"name"')
    expect(q(container, 'field-value')!.textContent).toBe('')
  })

  it('updates field value through setValue', async () => {
    const { container } = render(FormStory)
    fireEvent.tap(q(container, 'set-foo')!)
    await waitForUpdate()
    expect(q(container, 'field-value')!.textContent).toBe('foo')
    expect(q(container, 'values')!.textContent).toContain('"foo"')
  })

  it('shows the validator error on submit when the field is empty', async () => {
    const { container } = render(FormStory)
    fireEvent.tap(q(container, 'submit')!)
    await waitForUpdate()
    expect(q(container, 'field-error')!.textContent).toBe('Required')
    // No `submitted` payload was published because validation failed.
    expect(q(container, 'submitted')!.textContent).toBe('')
  })

  it('emits submit with values once the field is filled', async () => {
    const { container } = render(FormStory)
    fireEvent.tap(q(container, 'set-foo')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'submit')!)
    await waitForUpdate()
    expect(q(container, 'field-error')!.textContent).toBe('')
    expect(q(container, 'submitted')!.textContent).toContain('"foo"')
  })

  it('disables the submit button once errors are present', async () => {
    const { container } = render(FormStory)
    // Trigger a validation pass so the error map populates.
    fireEvent.tap(q(container, 'submit')!)
    await waitForUpdate()
    expect(q(container, 'submit')!.getAttribute('data-disabled')).toBe('')
  })
})

// External refs aren't propagated through `render()`'s root mount, so each
// programmatic test mounts an inline harness that captures the refs in a
// module-scoped closure.
describe('Form — programmatic API', () => {
  it('FormField registers with the form on mount', async () => {
    const captured = { values: null as Record<string, unknown> | null }
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            FormRoot as any,
            { defaultValues: { name: 'seed' } },
            {
              default: ({ values }: any) => {
                captured.values = values
                return h(
                  FormField as any,
                  { name: 'name' },
                  { default: () => h('view', { 'data-testid': 'reg' }) },
                )
              },
            },
          )
      },
    })
    const { container } = render(Harness)
    await waitForUpdate()
    expect(q(container, 'reg')).not.toBeNull()
    // The form's `defaultValues` should seed the field.
    expect(captured.values?.name).toBe('seed')
  })

  it('FormField unregisters on unmount — value drops out of `values`', async () => {
    const show = ref(true)
    const captured = { values: null as Record<string, unknown> | null }
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            FormRoot as any,
            { defaultValues: {} },
            {
              default: ({ values }: any) => {
                captured.values = values
                return show.value
                  ? h(
                      FormField as any,
                      { name: 'temp', defaultValue: 'x' },
                      { default: () => h('text', {}, '') },
                    )
                  : h('text', {}, '')
              },
            },
          )
      },
    })
    render(Harness)
    await waitForUpdate()
    expect(captured.values).toMatchObject({ temp: 'x' })
    show.value = false
    await waitForUpdate()
    expect(captured.values).not.toHaveProperty('temp')
  })

  it('submit() emits values when validators pass', async () => {
    const submitted: Array<Record<string, unknown>> = []
    const rootRef = ref<FormRootExposed | null>(null)
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            FormRoot as any,
            {
              ref: rootRef,
              defaultValues: { name: 'seed' },
              onSubmit: (values: Record<string, unknown>) => submitted.push(values),
            },
            {
              default: () =>
                h(
                  FormField as any,
                  {
                    name: 'name',
                    validators: [
                      (v: unknown) => (typeof v === 'string' && v.length > 0 ? null : 'Required'),
                    ],
                  },
                  { default: () => h('text', {}, '') },
                ),
            },
          )
      },
    })
    render(Harness)
    await waitForUpdate()
    expect(rootRef.value).not.toBeNull()
    rootRef.value!.submit()
    await waitForUpdate()
    expect(submitted).toHaveLength(1)
    expect(submitted[0]).toMatchObject({ name: 'seed' })
  })

  it('sync validators block submit and surface errors', async () => {
    const submitted: Array<Record<string, unknown>> = []
    const rootRef = ref<FormRootExposed | null>(null)
    const captured = { error: null as string | null }
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            FormRoot as any,
            {
              ref: rootRef,
              onSubmit: (values: Record<string, unknown>) => submitted.push(values),
            },
            {
              default: () =>
                h(
                  FormField as any,
                  {
                    name: 'name',
                    defaultValue: '',
                    validators: [
                      (v: unknown) => (typeof v === 'string' && v.length > 0 ? null : 'Required'),
                    ],
                  },
                  {
                    default: ({ error }: any) => {
                      captured.error = error
                      return h('text', { 'data-testid': 'err' }, String(error ?? ''))
                    },
                  },
                ),
            },
          )
      },
    })
    const { container } = render(Harness)
    await waitForUpdate()
    rootRef.value!.submit()
    await waitForUpdate()
    expect(submitted).toHaveLength(0)
    expect(captured.error).toBe('Required')
    expect(q(container, 'err')!.textContent).toBe('Required')
  })

  it('reset() restores defaultValues and clears errors', async () => {
    const rootRef = ref<FormRootExposed | null>(null)
    const captured = { values: null as Record<string, unknown> | null, error: null as string | null }
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            FormRoot as any,
            {
              ref: rootRef,
              defaultValues: { name: 'seed' },
            },
            {
              default: ({ values }: any) => {
                captured.values = values
                return h(
                  FormField as any,
                  {
                    name: 'name',
                    validators: [
                      (v: unknown) => (typeof v === 'string' && v.length > 0 ? null : 'Required'),
                    ],
                  },
                  {
                    default: ({ error, setValue }: any) => {
                      captured.error = error
                      return h(
                        'view',
                        {
                          'data-testid': 'clear-field',
                          // Tap to clear the value, forcing a validation error
                          // on the next submit.
                          'onTap': () => setValue(''),
                        },
                        '',
                      )
                    },
                  },
                )
              },
            },
          )
      },
    })
    const { container } = render(Harness)
    await waitForUpdate()
    // Empty the field, submit → error populated.
    fireEvent.tap(q(container, 'clear-field')!)
    await waitForUpdate()
    rootRef.value!.submit()
    await waitForUpdate()
    expect(captured.error).toBe('Required')
    // Reset → defaultValues restored, errors cleared.
    rootRef.value!.reset()
    await waitForUpdate()
    await nextTick()
    expect(captured.values).toMatchObject({ name: 'seed' })
    expect(captured.error).toBeNull()
  })

  it('useFormField returns the nearest FormField context', async () => {
    const captured = { name: '', value: undefined as unknown }
    const Probe = defineComponent({
      setup() {
        const ctx = useFormField()
        captured.name = ctx.name.value
        captured.value = ctx.value.value
        return () => h('text', { 'data-testid': 'probe' }, ctx.name.value)
      },
    })
    const Harness = defineComponent({
      setup() {
        return () =>
          h(
            FormRoot as any,
            { defaultValues: { hello: 'world' } },
            {
              default: () =>
                h(
                  FormField as any,
                  { name: 'hello' },
                  { default: () => h(Probe) },
                ),
            },
          )
      },
    })
    const { container } = render(Harness)
    await waitForUpdate()
    expect(captured.name).toBe('hello')
    expect(captured.value).toBe('world')
    expect(q(container, 'probe')!.textContent).toBe('hello')
  })
})
