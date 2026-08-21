import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'

/**
 * Safely applies Unicode NFC normalization — Lynx's PrimJS engine has no
 * `String.prototype.normalize`, so the string comes back unchanged there.
 */
function normalizeNFC(value: string): string {
  return typeof value.normalize === 'function' ? value.normalize('NFC') : value
}

type Compare = (a: string, b: string) => number

/**
 * Builds a comparison function. Prefers `Intl.Collator`, falling back to a plain
 * case-insensitive comparison when constructing it throws (PrimJS ships no
 * working `Intl`).
 */
function createCompare(options: Intl.CollatorOptions | undefined): Compare {
  try {
    const collator = new Intl.Collator('en', { usage: 'search', ...options })
    return (a, b) => collator.compare(a, b)
  }
  catch {
    return (a, b) => {
      const x = a.toLowerCase()
      const y = b.toLowerCase()
      if (x === y)
        return 0
      return x < y ? -1 : 1
    }
  }
}

/**
 * Provides locale-aware string filtering functions, using `Intl.Collator` when
 * available and a case-insensitive comparison otherwise.
 *
 * @param options - Optional collator options.
 * @returns Methods to check if a string starts with, ends with, or contains a
 *   substring.
 */
export function useFilter(options?: MaybeRef<Intl.CollatorOptions>) {
  const computedOptions = computed(() => unref(options))
  const compare = computed(() => createCompare(computedOptions.value))

  const startsWith = (string: string, substring: string) => {
    if (substring.length === 0)
      return true

    string = normalizeNFC(string)
    substring = normalizeNFC(substring)
    return compare.value(string.slice(0, substring.length), substring) === 0
  }

  const endsWith = (string: string, substring: string) => {
    if (substring.length === 0)
      return true

    string = normalizeNFC(string)
    substring = normalizeNFC(substring)
    return compare.value(string.slice(-substring.length), substring) === 0
  }

  const contains = (string: string, substring: string) => {
    if (substring.length === 0)
      return true

    string = normalizeNFC(string)
    substring = normalizeNFC(substring)

    let scan = 0
    const sliceLen = substring.length
    for (; scan + sliceLen <= string.length; scan++) {
      const slice = string.slice(scan, scan + sliceLen)
      if (compare.value(substring, slice) === 0)
        return true
    }

    return false
  }

  return {
    startsWith,
    endsWith,
    contains,
  }
}
