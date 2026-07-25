export interface Example {
  source: string
  highlighted: string
}

// One chunk per example: all 80 in one module is ~500KB of main-thread parse.
const loaders = import.meta.glob<Example>('../generated/examples/*.json', { import: 'default' })

/** Ref that fills in once `enabled` first turns true. Undefined while it hasn't loaded. */
export function useExample(name: MaybeRefOrGetter<string>, enabled: MaybeRefOrGetter<boolean>) {
  const example = ref<Example>()

  watch(() => [toValue(name), toValue(enabled)] as const, async ([id, on]) => {
    if (!on) return
    example.value = await loaders[`../generated/examples/${id}.json`]?.()
  }, { immediate: true })

  return example
}
