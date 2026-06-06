import type { Ref } from 'vue'
import type { ElementHandle } from '@/shared/types'
import { computed, defineComponent, h, inject, markRaw, provide, ref, watch, watchEffect } from 'vue'
import { Slot, usePrimitiveElement } from '@/components/Primitive'

interface CollectionContext<ItemData = {}> {
  collectionRef: Ref<ElementHandle | undefined>
  itemMap: Ref<Map<ElementHandle, { ref: ElementHandle, value?: any } & ItemData>>
}

const ITEM_DATA_ATTR = 'data-vyui-collection-item'

export function useCollection<ItemData = {}>(options: { key?: string, isProvider?: boolean } = {}) {
  const { key = '', isProvider = false } = options
  const injectionKey = `${key}CollectionProvider`
  let context: CollectionContext<ItemData>

  if (isProvider) {
    const itemMap = ref<Map<ElementHandle, { ref: ElementHandle } & ItemData>>(new Map())
    const collectionRef = ref<any>()

    context = {
      collectionRef,
      itemMap,
    } as CollectionContext<ItemData>
    provide(injectionKey, context)
  }
  else {
    context = inject(injectionKey) as CollectionContext<ItemData>
  }

  const getItems = (includeDisabledItem = false) => {
    if (!context.collectionRef.value)
      return []
    // Map preserves insertion order which matches mount order
    const items = Array.from(context.itemMap.value.values())
    if (includeDisabledItem)
      return items
    return items.filter(i => i.ref.dataset?.disabled !== '')
  }

  const CollectionSlot = defineComponent({
    name: 'CollectionSlot',
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      const { primitiveElement, currentElement } = usePrimitiveElement()
      watch(currentElement, () => {
        context.collectionRef.value = currentElement.value
      })
      return () => h(Slot, { ref: primitiveElement, ...attrs }, slots)
    },
  })

  const CollectionItem = defineComponent({
    name: 'CollectionItem',
    inheritAttrs: false,
    props: {
      value: {
        // It accepts any value
        validator: () => true,
      },
    },
    setup(props, { slots, attrs }) {
      const { primitiveElement, currentElement } = usePrimitiveElement()

      watchEffect((cleanupFn) => {
        if (currentElement.value) {
          const key = markRaw(currentElement.value)
          // @ts-expect-error ignore assignment of unknown to any
          context.itemMap.value.set(key, { ref: currentElement.value!, value: props.value })
          cleanupFn(() => context.itemMap.value.delete(key))
        }
      })

      return () => h(Slot, { ...attrs, [ITEM_DATA_ATTR]: '', ref: primitiveElement }, slots)
    },
  })

  const reactiveItems = computed(() => Array.from(context.itemMap.value.values()))
  const itemMapSize = computed(() => context.itemMap.value.size)

  return { getItems, reactiveItems, itemMapSize, CollectionSlot, CollectionItem }
}
