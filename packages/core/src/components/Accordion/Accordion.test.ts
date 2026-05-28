import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Accordion from './story/_Accordion.vue'

function triggers(container: Element) {
  return container.querySelectorAll('[accessibility-traits="button"]')
}

function stateOf(el: Element | undefined) {
  return el?.getAttribute('data-state')
}

async function tap(el: Element) {
  fireEvent.tap(el)
  await waitForUpdate()
}

describe('Accordion — single (default)', () => {
  it('renders all triggers closed initially', () => {
    const { container } = render(Accordion)
    const all = triggers(container)
    expect(all.length).toBeGreaterThan(1)
    all.forEach(t => expect(stateOf(t)).toBe('closed'))
    expect(container.innerHTML).not.toContain('Content One')
  })

  it('tapping a trigger opens it and mounts its content', async () => {
    const { container } = render(Accordion)
    await tap(triggers(container)[0]!)
    expect(stateOf(triggers(container)[0])).toBe('open')
    expect(container.innerHTML).toContain('Content One')
  })

  it('emits update:modelValue with the opened value', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { 'onUpdate:modelValue': onUpdate })
    await tap(triggers(container)[0]!)
    expect(onUpdate).toHaveBeenCalledWith('One')
  })

  it('tapping the active trigger does not close it (single is collapsible=false)', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { 'onUpdate:modelValue': onUpdate })
    const first = triggers(container)[0]!
    await tap(first)
    await tap(first)
    expect(stateOf(triggers(container)[0])).toBe('open')
    expect(container.innerHTML).toContain('Content One')
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('opening another trigger closes the previous one', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { 'onUpdate:modelValue': onUpdate })
    await tap(triggers(container)[0]!)
    await tap(triggers(container)[1]!)
    const all = triggers(container)
    expect(stateOf(all[0])).toBe('closed')
    expect(stateOf(all[1])).toBe('open')
    expect(container.innerHTML).not.toContain('Content One')
    expect(container.innerHTML).toContain('Content Two')
    expect(onUpdate).toHaveBeenLastCalledWith('Two')
  })
})

describe('Accordion — single, collapsible', () => {
  it('tapping the active trigger closes it', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { collapsible: true, 'onUpdate:modelValue': onUpdate })
    const first = triggers(container)[0]!
    await tap(first)
    await tap(first)
    expect(stateOf(triggers(container)[0])).toBe('closed')
    expect(container.innerHTML).not.toContain('Content One')
    expect(onUpdate).toHaveBeenLastCalledWith(undefined)
  })
})

describe('Accordion — multiple', () => {
  it('emits update:modelValue with an array on open', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { type: 'multiple', 'onUpdate:modelValue': onUpdate })
    await tap(triggers(container)[0]!)
    expect(onUpdate).toHaveBeenCalledWith(['One'])
    expect(container.innerHTML).toContain('Content One')
  })

  it('tapping the active trigger closes it and emits an empty array', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { type: 'multiple', 'onUpdate:modelValue': onUpdate })
    const first = triggers(container)[0]!
    await tap(first)
    await tap(first)
    expect(stateOf(triggers(container)[0])).toBe('closed')
    expect(container.innerHTML).not.toContain('Content One')
    expect(onUpdate).toHaveBeenLastCalledWith([])
  })

  it('opens multiple items simultaneously', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { type: 'multiple', 'onUpdate:modelValue': onUpdate })
    await tap(triggers(container)[0]!)
    await tap(triggers(container)[1]!)
    const all = triggers(container)
    expect(stateOf(all[0])).toBe('open')
    expect(stateOf(all[1])).toBe('open')
    expect(container.innerHTML).toContain('Content One')
    expect(container.innerHTML).toContain('Content Two')
    expect(onUpdate).toHaveBeenLastCalledWith(['One', 'Two'])
  })
})

describe('Accordion — disabled', () => {
  it('a disabled root marks triggers disabled and ignores taps', async () => {
    const onUpdate = vi.fn()
    const { container } = render(Accordion, { disabled: true, 'onUpdate:modelValue': onUpdate })
    const first = triggers(container)[0]!
    expect(first.getAttribute('data-disabled')).toBe('')
    await tap(first)
    expect(stateOf(triggers(container)[0])).toBe('closed')
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
