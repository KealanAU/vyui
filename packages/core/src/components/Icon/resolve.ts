import type { IconifyJSON } from '@iconify/types'
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'

/**
 * Iconify icon-set data registered for resolution, keyed by prefix.
 *
 * Iconify ships icon *data* (plain JSON: SVG body + viewBox) separately from any
 * renderer. We reuse the data and `@iconify/utils`, and feed the resulting SVG
 * string to Lynx's `<svg content="...">` element — the DOM `<svg>` element and
 * CSS-mask renderers don't exist on Lynx.
 *
 * No sets are registered by default. Iconify icon-set JSON blobs don't
 * tree-shake (importing `@iconify-json/lucide/icons.json` ships the entire
 * lucide payload), so the primitive deliberately stays vendor-neutral.
 * Consumers register either a full set (`@iconify-json/<name>/icons.json`)
 * or a hand-crafted single-icon `IconifyJSON` for the icons they actually use.
 */
const sets = new Map<string, IconifyJSON>()

/**
 * Memoizes resolved SVG strings keyed on `name|size|color`. Resolution is pure
 * for a given registered set, and a list of repeated icons (e.g. a `check` per
 * row) would otherwise re-run `parseName` + `iconToSVG` + the `currentColor`
 * regex for every instance. Cleared on `registerIconSet` so a name that
 * resolved to `null` before its set was registered re-resolves afterwards.
 */
const svgCache = new Map<string, string | null>()

/**
 * Register an Iconify icon set so `<Icon>` can resolve names under its prefix.
 *
 * @example
 * import mdi from '@iconify-json/mdi/icons.json'
 * registerIconSet('mdi', mdi)
 *
 * @example
 * // Hand-crafted single-icon set (avoids shipping the full vendor JSON):
 * registerIconSet('lucide', {
 *   prefix: 'lucide',
 *   width: 24,
 *   height: 24,
 *   icons: { check: { body: '<path d="M20 6L9 17l-5-5" .../>' } },
 * })
 */
export function registerIconSet(prefix: string, data: IconifyJSON): void {
  sets.set(prefix, data)
  // A newly registered set can change what previously-cached names resolve to
  // (including cached `null`s), so drop the memo.
  svgCache.clear()
}

/**
 * `color` is spliced verbatim into SVG markup where `currentColor` sits inside
 * attribute values (`fill="currentColor"`), so a value containing `"` or `<`
 * could break out of the attribute and inject elements into the XML that
 * Lynx's `<svg content>` (and the web `x-svg` element) parses. Allow only the
 * characters CSS color syntaxes need — named colors, `#hex`, `rgb()`/`hsl()`
 * including modern space/`/`-alpha forms — and ignore anything else.
 */
const SAFE_COLOR_RE = /^[\w#(),.%/ -]+$/

export interface ResolveIconOptions {
  /** Pixel size applied to the SVG `width`/`height`. */
  size?: number
  /** Color baked into the SVG, replacing `currentColor` (Lynx's `<svg>` rasterizes the XML). */
  color?: string
}

/**
 * Parse an icon name into `[prefix, name]`.
 *
 * Accepts the Tailwind/UnoCSS form `i-lucide-folder`, the Iconify form
 * `lucide:folder` / `simple-icons:bytedance`, and the bare `lucide-folder`.
 * Colon takes precedence over dash so hyphenated prefixes (`simple-icons`)
 * round-trip correctly; the `i-` / bare dash forms fall back to splitting on
 * the first dash and so only support alphanumeric prefixes — hyphenated
 * prefixes like `simple-icons` must use the colon form.
 */
function parseName(name: string): [string, string] | null {
  const cleaned = name.replace(/^i-/, '')
  const colonIdx = cleaned.indexOf(':')
  if (colonIdx > 0)
    return [cleaned.slice(0, colonIdx), cleaned.slice(colonIdx + 1)]
  const match = cleaned.match(/^([a-z0-9]+)-(.+)$/i)
  return match ? [match[1], match[2]] : null
}

/**
 * Resolve an Iconify icon name to a standalone SVG string, or `null` if the
 * prefix isn't registered / the icon doesn't exist.
 */
export function resolveIconSvg(name: string, opts: ResolveIconOptions = {}): string | null {
  const cacheKey = `${name}|${opts.size ?? ''}|${opts.color ?? ''}`
  const cached = svgCache.get(cacheKey)
  if (cached !== undefined)
    return cached

  const svg = computeIconSvg(name, opts)
  svgCache.set(cacheKey, svg)
  return svg
}

function computeIconSvg(name: string, opts: ResolveIconOptions): string | null {
  const parsed = parseName(name)
  if (!parsed)
    return null

  const [prefix, iconName] = parsed
  const set = sets.get(prefix)
  if (!set)
    return null

  const data = getIconData(set, iconName)
  if (!data)
    return null

  const { attributes, body } = iconToSVG(data, {
    height: opts.size,
    width: opts.size,
  })
  const svg = iconToHTML(body, attributes)
  if (!opts.color)
    return svg
  if (!SAFE_COLOR_RE.test(opts.color)) {
    if (__DEV__) {
      console.warn(
        `[vyui/Icon] \`color\` value ${JSON.stringify(opts.color)} contains characters `
        + 'that are invalid in a CSS color; ignoring it so it cannot inject SVG markup.',
      )
    }
    return svg
  }
  return svg.replace(/currentColor/g, opts.color)
}
