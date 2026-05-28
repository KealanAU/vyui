/**
 * `DateFormatter` — the formatter vyui's date/time components construct
 * instead of `@internationalized/date`'s `DateFormatter`.
 *
 * `@internationalized/date`'s `DateFormatter` wraps `Intl.DateTimeFormat` and
 * performs extra locale / hour-cycle negotiation that assumes a complete host
 * `Intl`. Lynx's PrimJS engine ships an incomplete `Intl`, so that wrapper
 * crashes the date/time components on native.
 *
 * This is the stopgap wrapper. On first construction it picks an
 * implementation once:
 * - a genuinely working host `Intl.DateTimeFormat` (browsers, Lynx web — and
 *   Lynx native too once `installIntlPolyfill()` has swapped it for
 *   `BasicDateFormatter`), or
 * - `BasicDateFormatter` directly, as a fallback if the host `Intl` is still
 *   broken at that point.
 *
 * The probe runs lazily — the first `new DateFormatter()` happens at
 * component setup, after the app entry has called `installIntlPolyfill()`.
 *
 * Swap the whole `shared/intl/` folder for a real i18n library later.
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
 * Drop-in for `@internationalized/date`'s `DateFormatter` — same surface
 * (`format`, `formatToParts`, `formatRange`, `formatRangeToParts`,
 * `resolvedOptions`), typed as {@link BasicDateFormatter}.
 */
export const DateFormatter = DateFormatterImpl as unknown as typeof BasicDateFormatter
