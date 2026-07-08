import type { ElementHandle } from './types'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSelectionBehavior } from './useSelectionBehavior'

interface Item { id: number }

function byId(id: number) {
  return (existing: Item | undefined) => existing?.id === id
}

describe('useSelectionBehavior', () => {
  describe('single selection (multiple: false)', () => {
    it('selects a value when nothing matches the condition', () => {
      const modelValue = ref<Item | Item[]>(undefined as any)
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: false })

      const result = onSelectItem({ id: 1 }, byId(-1))

      expect(modelValue.value).toEqual({ id: 1 })
      expect(result).toEqual({ id: 1 })
    })

    it('toggles the value off when the condition matches the current selection', () => {
      const modelValue = ref<Item | Item[]>({ id: 1 })
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: false })

      onSelectItem({ id: 1 }, byId(1))

      expect(modelValue.value).toBeUndefined()
    })

    it('switches selection to a new value when the condition does not match the current one', () => {
      // Realistic condition: "does the existing selection already equal the
      // value being selected?" — comparing against the *new* id (2), not the
      // id already in place.
      const modelValue = ref<Item | Item[]>({ id: 1 })
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: false })

      onSelectItem({ id: 2 }, byId(2))

      expect(modelValue.value).toEqual({ id: 2 })
    })

    it('stores a shallow copy, not the original reference', () => {
      const modelValue = ref<Item | Item[]>(undefined as any)
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: false })
      const val = { id: 1 }

      onSelectItem(val, byId(-1))

      expect(modelValue.value).toEqual(val)
      expect(modelValue.value).not.toBe(val)
    })

    it('with selectionBehavior "replace", always overwrites — never toggles off', () => {
      const modelValue = ref<Item | Item[]>({ id: 1 })
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, {
        multiple: false,
        selectionBehavior: 'replace',
      })

      onSelectItem({ id: 1 }, byId(1))

      expect(modelValue.value).toEqual({ id: 1 })
    })
  })

  describe('multiple selection (multiple: true)', () => {
    it('appends a value not already present', () => {
      const modelValue = ref<Item | Item[]>([{ id: 1 }])
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: true })

      onSelectItem({ id: 2 }, existing => existing.id === 2)

      expect(modelValue.value).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('removes a value already present (toggle behavior)', () => {
      const modelValue = ref<Item | Item[]>([{ id: 1 }, { id: 2 }])
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: true })

      onSelectItem({ id: 1 }, existing => existing.id === 1)

      expect(modelValue.value).toEqual([{ id: 2 }])
    })

    it('starts from an empty array and accumulates selections', () => {
      const modelValue = ref<Item | Item[]>([])
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: true })

      onSelectItem({ id: 1 }, existing => existing.id === 1)
      onSelectItem({ id: 2 }, existing => existing.id === 2)

      expect(modelValue.value).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('does nothing to array membership when modelValue is not (yet) an array', () => {
      // multiple:true but modelValue isn't an array — falls through to the
      // single-selection branch instead of the multi-select toggle branch.
      const modelValue = ref<Item | Item[]>(undefined as any)
      const { onSelectItem } = useSelectionBehavior<Item>(modelValue, { multiple: true })

      onSelectItem({ id: 1 }, byId(-1))

      expect(modelValue.value).toEqual({ id: 1 })
    })

    it('with selectionBehavior "replace", collapses the selection to just the new value and records firstValue', () => {
      const modelValue = ref<Item | Item[]>([{ id: 1 }, { id: 2 }])
      const { onSelectItem, firstValue } = useSelectionBehavior<Item>(modelValue, {
        multiple: true,
        selectionBehavior: 'replace',
      })

      onSelectItem({ id: 3 }, () => false)

      expect(modelValue.value).toEqual([{ id: 3 }])
      expect(firstValue.value).toEqual({ id: 3 })
    })
  })

  describe('handleMultipleReplace', () => {
    function makeCollection(disabledIds: number[] = []) {
      const options = [1, 2, 3, 4, 5]
      const items = options.map(id => ({
        ref: { dataset: { disabled: disabledIds.includes(id) ? '' : undefined } } as unknown as ElementHandle,
        value: id,
      }))
      return { options, items }
    }

    it('is a no-op when firstValue has not been set', () => {
      const modelValue = ref<number[]>([1])
      const { handleMultipleReplace } = useSelectionBehavior<number>(modelValue, { multiple: true })
      const { options, items } = makeCollection()

      handleMultipleReplace('next', items[3].ref, () => items, options)

      expect(modelValue.value).toEqual([1])
    })

    it('is a no-op when multiple is false, even with a firstValue', () => {
      const modelValue = ref<number[]>([1])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: false })
      firstValue.value = 2
      const { options, items } = makeCollection()

      handleMultipleReplace('next', items[3].ref, () => items, options)

      expect(modelValue.value).toEqual([1])
    })

    it('is a no-op when modelValue is not an array', () => {
      const modelValue = ref<any>({ id: 1 })
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 2
      const { options, items } = makeCollection()

      handleMultipleReplace('next', items[3].ref, () => items, options)

      expect(modelValue.value).toEqual({ id: 1 })
    })

    it('is a no-op when currentElement is not found among the enabled items', () => {
      const modelValue = ref<number[]>([1])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 2
      const { options, items } = makeCollection()

      handleMultipleReplace('next', { dataset: {} } as unknown as ElementHandle, () => items, options)

      expect(modelValue.value).toEqual([1])
    })

    it('excludes disabled items from the collection used to resolve currentElement', () => {
      const modelValue = ref<number[]>([])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 2
      // item id=3 is marked disabled, so its ref can never resolve as lastValue.
      const { options, items } = makeCollection([3])

      handleMultipleReplace('next', items[2].ref, () => items, options)

      expect(modelValue.value).toEqual([])
    })

    it('"next"/"prev" selects the inclusive range between firstValue and the current element', () => {
      const modelValue = ref<number[]>([])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 2
      const { options, items } = makeCollection()

      // current element resolves to value 4 → range [2..4]
      handleMultipleReplace('next', items[3].ref, () => items, options)

      expect(modelValue.value).toEqual([2, 3, 4])
    })

    it('"prev" resolves the same inclusive range regardless of direction of travel', () => {
      const modelValue = ref<number[]>([])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 4
      const { options, items } = makeCollection()

      // current element resolves to value 2 → range [2..4]
      handleMultipleReplace('prev', items[1].ref, () => items, options)

      expect(modelValue.value).toEqual([2, 3, 4])
    })

    it('"first" selects from firstValue to the first option', () => {
      const modelValue = ref<number[]>([])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 3
      const { options, items } = makeCollection()

      handleMultipleReplace('first', items[3].ref, () => items, options)

      expect(modelValue.value).toEqual([1, 2, 3])
    })

    it('"last" selects from firstValue to the last option', () => {
      const modelValue = ref<number[]>([])
      const { handleMultipleReplace, firstValue } = useSelectionBehavior<number>(modelValue, { multiple: true })
      firstValue.value = 3
      const { options, items } = makeCollection()

      handleMultipleReplace('last', items[3].ref, () => items, options)

      expect(modelValue.value).toEqual([3, 4, 5])
    })
  })
})
