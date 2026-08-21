/**
 * Minimal `Intl` polyfill for Lynx's PrimJS engine.
 *
 * `Intl` is ECMA-402, optional for an engine to implement, and a complete one
 * needs megabytes of CLDR data — so size-optimized mobile engines routinely drop
 * it. PrimJS does: `Intl.DateTimeFormat`, `NumberFormat`, `Collator` and
 * `Locale` are missing or non-functional.
 *
 * This shim fills the gaps with English-only data, reusing
 * {@link BasicDateFormatter} so dates format identically through either path.
 * Self-contained on purpose (no project imports), so this folder can be lifted
 * into a standalone package. Install once at app entry, before any component
 * constructs a formatter.
 *
 * Limitations: `en` only; no real time-zone conversion (dates format in the
 * host's local time); `String.prototype.normalize` is NOT polyfilled — call
 * sites guard for its absence instead (see `useFilter`).
 */

import { BasicDateFormatter } from './basic-date-formatter'
import { getLanguage, getRegion } from './locale'

type AnyOptions = Record<string, any>
interface Part { type: string, value: string }

class PolyNumberFormat {
  private opts: AnyOptions

  constructor(_locale?: string | string[], options: AnyOptions = {}) {
    this.opts = options
  }

  format(value: number): string {
    const o = this.opts
    const num = o.style === 'percent' ? value * 100 : value

    const minFrac = o.minimumFractionDigits ?? (o.style === 'currency' ? 2 : 0)
    const maxFrac = Math.max(minFrac, o.maximumFractionDigits ?? (o.style === 'currency' ? 2 : o.style === 'percent' ? 0 : 3))

    let str = num.toFixed(maxFrac)
    if (str.includes('.')) {
      let [int, frac] = str.split('.')
      while (frac.length > minFrac && frac.endsWith('0'))
        frac = frac.slice(0, -1)
      str = frac.length ? `${int}.${frac}` : int
    }

    const negative = str.startsWith('-')
    const [intPart, fracPart] = (negative ? str.slice(1) : str).split('.')
    const grouped = o.useGrouping === false
      ? intPart
      : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    let out = `${negative ? '-' : ''}${grouped}${fracPart ? `.${fracPart}` : ''}`
    if (o.style === 'percent')
      out += '%'
    if (o.style === 'currency')
      out = `${o.currency === 'USD' ? '$' : `${o.currency} `}${out}`
    return out
  }

  formatToParts(value: number): Part[] {
    return [{ type: 'literal', value: this.format(value) }]
  }

  resolvedOptions(): AnyOptions {
    return { locale: 'en-US', numberingSystem: 'latn', style: 'decimal', ...this.opts }
  }

  static supportedLocalesOf(locales?: string | string[]): string[] {
    if (!locales)
      return []
    return Array.isArray(locales) ? locales : [locales]
  }
}

class PolyCollator {
  private opts: AnyOptions

  constructor(_locale?: string | string[], options: AnyOptions = {}) {
    this.opts = options
  }

  compare(a: string, b: string): number {
    // `base` / `accent` sensitivity and `search` usage are case-insensitive;
    // without Unicode tables this is the best `en` approximation.
    const caseSensitive = this.opts.sensitivity === 'case' || this.opts.sensitivity === 'variant'
    const x = caseSensitive ? a : a.toLowerCase()
    const y = caseSensitive ? b : b.toLowerCase()
    if (x === y)
      return 0
    return x < y ? -1 : 1
  }

  resolvedOptions(): AnyOptions {
    return {
      locale: 'en-US',
      usage: this.opts.usage ?? 'sort',
      sensitivity: this.opts.sensitivity ?? 'variant',
      ...this.opts,
    }
  }

  static supportedLocalesOf(locales?: string | string[]): string[] {
    if (!locales)
      return []
    return Array.isArray(locales) ? locales : [locales]
  }
}

class PolyLocale {
  language: string
  region?: string
  baseName: string

  constructor(tag: string) {
    this.baseName = String(tag)
    this.language = getLanguage(tag)
    this.region = getRegion(tag)
  }
}

/** Returns false when calling `probe` throws or yields an empty/nullish value. */
function isWorking(probe: () => unknown): boolean {
  try {
    const result = probe()
    return result !== undefined && result !== null && result !== ''
  }
  catch {
    return false
  }
}

/**
 * Installs the polyfill onto `globalThis.Intl`, filling only the missing or
 * broken pieces. Idempotent, and a no-op where `Intl` works (browsers, Lynx web).
 */
export function installIntlPolyfill(): void {
  const globalObject = globalThis as any
  if (!globalObject.Intl)
    globalObject.Intl = {}
  const intl = globalObject.Intl

  if (!isWorking(() => new intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2025, 0, 6))))
    intl.DateTimeFormat = BasicDateFormatter

  if (!isWorking(() => new intl.NumberFormat('en').format(1234.5)))
    intl.NumberFormat = PolyNumberFormat

  if (!isWorking(() => new intl.Collator('en').compare('a', 'b') !== 0 || true))
    intl.Collator = PolyCollator

  if (!isWorking(() => new intl.Locale('en-US').language))
    intl.Locale = PolyLocale
}
