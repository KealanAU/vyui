/**
 * `DateFormatter` — the formatter vyui's date/time components construct instead
 * of `@internationalized/date`'s, whose `Intl.DateTimeFormat` wrapper assumes a
 * complete host `Intl` and so crashes on PrimJS.
 *
 * On first construction it picks an implementation once: a genuinely working
 * host `Intl.DateTimeFormat` (browsers, Lynx web — and native too, once
 * `installIntlPolyfill()` has swapped it for `BasicDateFormatter`), else
 * `BasicDateFormatter` directly. The probe runs lazily, so it sees the polyfill
 * the app entry installed.
 */

import { BasicDateFormatter } from './basic-date-formatter'

type Ctor = new (locale?: string | string[], options?: any) => any

let cachedCtor: Ctor | undefined

/** Picks the host `Intl.DateTimeFormat` if it formats correctly, else the shim. */
function resolveCtor(): Ctor {
  if (cachedCtor)
    return cachedCtor

  try {
    const hostCtor = (globalThis as any)?.Intl?.DateTimeFormat
    if (typeof hostCtor === 'function') {
      const probe = new hostCtor('en', { month: 'long' }).format(new Date(2025, 0, 6))
      if (probe === 'January') {
        cachedCtor = hostCtor as Ctor
        return cachedCtor
      }
    }
  }
  catch {
    // host Intl is broken — fall through to the shim
  }

  cachedCtor = BasicDateFormatter as unknown as Ctor
  return cachedCtor
}

function DateFormatterImpl(this: any, locale?: string | string[], options?: any) {
  // Constructors may return an object, which replaces `this` — so
  // `new DateFormatter()` yields a real formatter instance directly.
  // eslint-disable-next-line no-constructor-return
  return new (resolveCtor())(locale, options)
}

/**
 * Drop-in for `@internationalized/date`'s `DateFormatter` — same surface, typed
 * as {@link BasicDateFormatter}.
 */
export const DateFormatter = DateFormatterImpl as unknown as typeof BasicDateFormatter
