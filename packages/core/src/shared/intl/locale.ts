/**
 * Minimal BCP-47 locale parsing.
 *
 * Stopgap for Lynx's PrimJS engine, which does not ship a working
 * `Intl.Locale`. Returns only the primary language subtag — enough for the
 * places vyui currently reaches for `Intl.Locale`. Swap for a real i18n
 * library later — see `shared/intl/`.
 */

/** Primary language subtag of a BCP-47 tag, lower-cased. Defaults to `'en'`. */
export function getLanguage(tag: string): string {
  return (String(tag).split('-')[0] || 'en').toLowerCase()
}

/** Region subtag (ISO 3166 alpha-2 or UN M.49) if present, upper-cased. */
export function getRegion(tag: string): string | undefined {
  const subtags = String(tag).split('-')
  return subtags.slice(1).find(s => /^[a-z]{2}$/i.test(s) || /^\d{3}$/.test(s))?.toUpperCase()
}
