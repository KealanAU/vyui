import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'

/**
 * Safely applies Unicode NFC normalization.
 *
 * Lynx's JS engine (PrimJS) does not implement `String.prototype.normalize`,
 * so we fall back to returning the string unchanged when it is unavailable.
 */
function normalizeNFC(value: string): string {
  return typeof value.normalize === 'function' ? value.normalize('NFC') : value
}

type Compare = (a: string, b: string) => number

/**
 * Builds a comparison function. Prefers `Intl.Collator`, but Lynx's PrimJS
 * engine does not ship a working `Intl`, so we fall back to a plain
 * case-insensitive comparison when constructing the collator throws.
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
 * Provides locale-aware string filtering functions.
 * Uses `Intl.Collator` for comparison when available to ensure proper Unicode
 * handling, and falls back to a case-insensitive comparison otherwise.
 *
 * @param options - Optional collator options to customize comparison behavior.
 *   See [Intl.CollatorOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options) for details.
 * @returns An object with methods to check if a string starts with, ends with, or contains a substring.
 *
 * @example
 * const { startsWith, endsWith, contains } = useFilter();
 *
 * startsWith('hello', 'he'); // true
 * endsWith('hello', 'lo'); // true
 * contains('hello', 'ell'); // true
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
