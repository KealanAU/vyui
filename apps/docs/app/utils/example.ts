export interface Example {
  source: string
  highlighted: string
}

// Each generated example is its own chunk, fetched only when a Code panel is
// actually opened — the Shiki HTML for all 80 is ~500KB of main-thread parse.
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
