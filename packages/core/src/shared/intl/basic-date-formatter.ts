/**
 * `BasicDateFormatter` — a minimal, English-only stand-in for
 * `Intl.DateTimeFormat`.
 *
 * Lynx's PrimJS engine ships an incomplete `Intl` (ECMA-402), and
 * `@internationalized/date`'s `DateFormatter` wraps `Intl.DateTimeFormat` with
 * extra locale / hour-cycle negotiation the partial PrimJS `Intl` doesn't
 * satisfy — which crashes the date/time components. vyui's `useDateFormatter`
 * and date helpers format through this class instead, never touching the host
 * `Intl`. Self-contained on purpose (no `@/` imports), so `shared/intl/` can be
 * lifted into a standalone package.
 *
 * Limitations: `en` only; no real time-zone conversion (dates format in the
 * host's local time); `timeZoneName` is approximated from the host offset.
 */

export type AnyOptions = Record<string, any>
export interface DateTimePart { type: Intl.DateTimeFormatPartTypes, value: string }

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_NARROW = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** Expands `dateStyle` / `timeStyle` presets into explicit field options. */
function expandStyles(options: AnyOptions): AnyOptions {
  const o: AnyOptions = { ...options }

  switch (options.dateStyle) {
    case 'full': Object.assign(o, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); break
    case 'long': Object.assign(o, { year: 'numeric', month: 'long', day: 'numeric' }); break
    case 'medium': Object.assign(o, { year: 'numeric', month: 'short', day: 'numeric' }); break
    case 'short': Object.assign(o, { year: '2-digit', month: 'numeric', day: 'numeric' }); break
  }
  delete o.dateStyle

  switch (options.timeStyle) {
    case 'full':
    case 'long': Object.assign(o, { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' }); break
    case 'medium': Object.assign(o, { hour: 'numeric', minute: 'numeric', second: 'numeric' }); break
    case 'short': Object.assign(o, { hour: 'numeric', minute: 'numeric' }); break
  }
  delete o.timeStyle

  return o
}

export type HourCycle = 'h11' | 'h12' | 'h23' | 'h24'

function resolveHourCycle(o: AnyOptions): HourCycle {
  if (o.hourCycle === 'h11' || o.hourCycle === 'h12' || o.hourCycle === 'h23' || o.hourCycle === 'h24')
    return o.hourCycle
  if (o.hour12 === true)
    return 'h12'
  if (o.hour12 === false)
    return 'h23'
  return 'h12' // `en` default
}

function hourValue(h24: number, cycle: HourCycle, twoDigit: boolean): string {
  let h: number
  if (cycle === 'h23')
    h = h24
  else if (cycle === 'h24')
    h = h24 === 0 ? 24 : h24
  else if (cycle === 'h11')
    h = h24 % 12
  else // h12
    h = h24 % 12 === 0 ? 12 : h24 % 12
  return twoDigit ? pad2(h) : `${h}`
}

function tzName(): string {
  const offsetHours = -new Date().getTimezoneOffset() / 60
  return `GMT${offsetHours >= 0 ? '+' : '-'}${Math.abs(offsetHours)}`
}

function dateFieldValue(type: string, o: AnyOptions, d: Date): string {
  switch (type) {
    case 'weekday': {
      const names = o.weekday === 'long' ? WEEKDAYS_LONG : o.weekday === 'short' ? WEEKDAYS_SHORT : WEEKDAYS_NARROW
      return names[d.getDay()]
    }
    case 'year': {
      const y = d.getFullYear()
      return o.year === '2-digit' ? pad2(y % 100) : `${y}`
    }
    case 'month': {
      const m = d.getMonth()
      if (o.month === 'long')
        return MONTHS_LONG[m]
      if (o.month === 'short')
        return MONTHS_SHORT[m]
      if (o.month === 'narrow')
        return MONTHS_NARROW[m]
      return o.month === '2-digit' ? pad2(m + 1) : `${m + 1}`
    }
    case 'day':
      return o.day === '2-digit' ? pad2(d.getDate()) : `${d.getDate()}`
    case 'era':
      return d.getFullYear() < 1 ? 'BC' : 'AD'
    default:
      return ''
  }
}

/** Separator between two adjacent spelled-out date fields, `en` order. */
function dateSeparator(prev: string, next: string): string {
  if (prev === 'weekday')
    return ', '
  if (next === 'year')
    return prev === 'day' ? ', ' : ' '
  return ' '
}

function buildParts(d: Date, o: AnyOptions): DateTimePart[] {
  const parts: DateTimePart[] = []
  const hasDate = o.weekday || o.year || o.month || o.day || o.era
  const hasTime = o.hour || o.minute || o.second || o.dayPeriod

  if (hasDate) {
    const monthNumeric = o.month === 'numeric' || o.month === '2-digit'
    const spelled = o.weekday || o.era || (o.month && !monthNumeric)
    if (!spelled) {
      // Numeric M/D/Y form, e.g. "1/6/2025".
      const fields = (['month', 'day', 'year'] as const).filter(f => o[f])
      fields.forEach((f, i) => {
        if (i)
          parts.push({ type: 'literal', value: '/' })
        parts.push({ type: f, value: dateFieldValue(f, o, d) })
      })
    }
    else {
      // Spelled form, e.g. "Monday, January 6, 2025".
      const fields = (['weekday', 'month', 'day', 'year', 'era'] as const).filter(f => o[f])
      fields.forEach((f, i) => {
        if (i)
          parts.push({ type: 'literal', value: dateSeparator(fields[i - 1], f) })
        parts.push({ type: f, value: dateFieldValue(f, o, d) })
      })
    }
  }

  if (hasTime) {
    if (parts.length)
      parts.push({ type: 'literal', value: ', ' })

    const cycle = resolveHourCycle(o)
    const timeFields: DateTimePart[] = []
    if (o.hour)
      timeFields.push({ type: 'hour', value: hourValue(d.getHours(), cycle, o.hour === '2-digit') })
    if (o.minute)
      timeFields.push({ type: 'minute', value: o.minute === '2-digit' ? pad2(d.getMinutes()) : `${d.getMinutes()}` })
    if (o.second)
      timeFields.push({ type: 'second', value: o.second === '2-digit' ? pad2(d.getSeconds()) : `${d.getSeconds()}` })
    timeFields.forEach((p, i) => {
      if (i)
        parts.push({ type: 'literal', value: ':' })
      parts.push(p)
    })

    if (o.dayPeriod || ((cycle === 'h11' || cycle === 'h12') && o.hour)) {
      if (parts.length)
        parts.push({ type: 'literal', value: ' ' })
      parts.push({ type: 'dayPeriod', value: d.getHours() < 12 ? 'AM' : 'PM' })
    }

    if (o.timeZoneName) {
      parts.push({ type: 'literal', value: ' ' })
      parts.push({ type: 'timeZoneName', value: tzName() })
    }
  }

  if (!parts.length) {
    // No recognized options — fall back to a numeric date, matching `Intl`.
    parts.push(
      { type: 'month', value: `${d.getMonth() + 1}` },
      { type: 'literal', value: '/' },
      { type: 'day', value: `${d.getDate()}` },
      { type: 'literal', value: '/' },
      { type: 'year', value: `${d.getFullYear()}` },
    )
  }

  return parts
}

function toJsDate(input?: Date | number): Date {
  if (input instanceof Date)
    return input
  return input == null ? new Date() : new Date(input)
}

/**
 * Drop-in replacement for the subset of `Intl.DateTimeFormat` /
 * `@internationalized/date`'s `DateFormatter` that vyui uses: `format`,
 * `formatToParts`, `formatRange`, `formatRangeToParts`, `resolvedOptions`.
 */
export class BasicDateFormatter {
  private opts: AnyOptions

  constructor(_locale?: string | string[], options: AnyOptions = {}) {
    this.opts = expandStyles(options ?? {})
  }

  format(date?: Date | number): string {
    return buildParts(toJsDate(date), this.opts).map(p => p.value).join('')
  }

  formatToParts(date?: Date | number): DateTimePart[] {
    return buildParts(toJsDate(date), this.opts)
  }

  formatRange(start: Date | number, end: Date | number): string {
    return `${this.format(start)} – ${this.format(end)}`
  }

  formatRangeToParts(start: Date | number, end: Date | number): DateTimePart[] {
    return [
      ...this.formatToParts(start),
      { type: 'literal', value: ' – ' },
      ...this.formatToParts(end),
    ]
  }

  resolvedOptions(): AnyOptions {
    const cycle = resolveHourCycle(this.opts)
    return {
      locale: 'en-US',
      calendar: this.opts.calendar ?? 'gregory',
      numberingSystem: 'latn',
      timeZone: this.opts.timeZone ?? 'UTC',
      hourCycle: cycle,
      hour12: cycle === 'h11' || cycle === 'h12',
      ...this.opts,
    }
  }

  static supportedLocalesOf(locales?: string | string[]): string[] {
    if (!locales)
      return []
    return Array.isArray(locales) ? locales : [locales]
  }
}
