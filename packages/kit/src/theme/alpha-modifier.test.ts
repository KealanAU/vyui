import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALL_COLORS } from './color-constants.js'

// `import.meta.url` isn't a file: URL under the Lynx testing environment, so
// resolve from the package root (vitest's cwd) instead.
const themeDir = resolve(process.cwd(), 'src/theme')

/**
 * Strip `//` and block comments so prose that *names* a dead class (this file,
 * and the banners on the four overlay slots) isn't mistaken for one.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/**
 * The preset maps semantic colors to raw `var()` strings with no
 * `<alpha-value>` placeholder, so Tailwind 3 SKIPS generating any `/<alpha>`
 * utility on them: the class resolves to no CSS and the element paints nothing.
 *
 * It survives every normal check — the class string reads fine in review, and a
 * browser shows nothing wrong because the rule simply isn't there to be wrong.
 * That is how `modal`, `drawer`, `tray` and `actionSheet` all shipped an overlay
 * dim that never dimmed (docs/styling-audit.md §4.1); it only became obvious in
 * dark mode, where a `bg-default` panel over an undimmed `bg-default` page has
 * nothing to separate it.
 *
 * `bg-black/50` and `bg-white/80` are fine — those parse to rgb, so the modifier
 * applies. Discrete shades (`-50`, `-100`) are the substitute for a tinted fill.
 */
describe('theme class strings', () => {
  const files = readdirSync(themeDir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  const deadAlpha = new RegExp(`-(?:${ALL_COLORS.join('|')})-\\d+/\\d+`, 'g')

  it('covers the whole theme directory', () => {
    expect(files.length).toBeGreaterThan(40)
  })

  it.each(files)('%s uses no alpha modifier on a semantic color', (file) => {
    const found = code(readFileSync(join(themeDir, file), 'utf8')).match(deadAlpha) ?? []
    expect(found).toEqual([])
  })
})
