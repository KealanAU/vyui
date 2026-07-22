import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RegistryItem } from './registry-schema.js'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const publicDir = join(root, 'apps/docs/public')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('published registry contracts', () => {
  it.each([
    'schema.json',
    'registry-index.json',
    'registry-styles.json',
  ])('publishes %s', (name) => {
    const path = join(publicDir, name)
    expect(existsSync(path)).toBe(true)
    expect(readJson<{ $id: string }>(path).$id).toBe(`https://vyui.dev/${name}`)
  })

  it('bakes shadcn UI deltas into init without forking the button theme', () => {
    const defaultButton = readJson<RegistryItem>(join(publicDir, 'r/default/button.json'))
    const shadcnButton = readJson<RegistryItem>(join(publicDir, 'r/shadcn/button.json'))
    const shadcnInit = readJson<RegistryItem>(join(publicDir, 'r/shadcn/init.json'))

    const defaultTheme = defaultButton.files.find(file => file.target === 'theme/button.ts')?.content
    const shadcnTheme = shadcnButton.files.find(file => file.target === 'theme/button.ts')?.content
    const plugin = shadcnInit.files.find(file => file.target === 'plugin.ts')?.content

    expect(shadcnTheme).toBe(defaultTheme)
    // `primary` carries the gray sentinel, not a fixed palette: shadcn/ui's
    // accent IS the base color, so it must follow `--base-color` like `neutral`
    // does. `writeFiles` substitutes it at init.
    expect(plugin).toContain('"primary": "__VYUI_GRAY__"')
    expect(plugin).toContain('"button": {')
    expect(plugin).toContain('"color": "neutral"')
  })

  const styles = readJson<{ styles: string[] }>(join(publicDir, 'r/styles.json')).styles

  const styleCss = (style: string): string => {
    const init = readJson<RegistryItem>(join(publicDir, `r/${style}/init.json`))
    return init.files.find(file => file.target === 'style.css')?.content ?? ''
  }

  // Lynx native resolves ONE level of var() indirection. A token whose value is
  // itself a `var(--ui-color-*)` ref therefore collapses on device — invisible
  // in a browser preview, broken on a phone. `shadcn` and `rounded` both
  // shipped that way (docs/styling-audit.md §4.2); this pins every style's
  // shipped style.css so no overlay reintroduces it.
  it.each(styles)('style %s ships no nested var() token values', (style) => {
    const css = styleCss(style)
    expect(css).not.toBe('')

    const nested = css
      .split('\n')
      .filter(line => /^\s*--ui-[\w-]+:\s*var\(/.test(line))

    expect(nested).toEqual([])
  })

  // Comments are stripped first, and it matters twice: every style.css opens
  // with a banner mentioning `:root`/`.dark` in prose, and several carry a
  // literal `}` inside a comment (`bg-${c}-500`) that would otherwise close the
  // block early. PostCSS drops comments before parsing, so this matches what the
  // browser/Lynx actually sees. No nested braces survive, so `[^}]*` is safe.
  const tokensOf = (css: string): Map<string, string> => {
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const body = (selector: string): string =>
      bare.match(new RegExp(`^${selector}\\s*\\{([^}]*)\\}`, 'm'))?.[1] ?? ''

    return new Map(
      [':root', '\\.dark'].flatMap(selector =>
        [...body(selector).matchAll(/(--ui-[\w-]+):\s*([^;]+);/g)]
          .map(m => [`${selector}${m[1]}`, m[2].trim()] as [string, string]),
      ),
    )
  }

  const baseTokens = tokensOf(styleCss('default'))

  // A style overlay REPLACES `style.css` wholesale rather than cascading over
  // it, so every style re-declares the entire token surface by hand. If the base
  // gains a token and an overlay doesn't, components under that style paint an
  // undefined var — transparent text and invisible surfaces, only on device.
  it('parses the full base token surface', () => {
    // Guard the guard: a parser that finds nothing passes every assertion below.
    expect(baseTokens.size).toBeGreaterThan(100)
  })

  it.each(styles.filter(style => style !== 'default'))(
    'style %s declares every base token',
    (style) => {
      const own = tokensOf(styleCss(style))
      expect([...baseTokens.keys()].filter(name => !own.has(name))).toEqual([])
    },
  )

  // `rounded`'s whole premise is "the base, with a bigger radius".
  it('rounded overrides nothing but the radius', () => {
    const own = tokensOf(styleCss('rounded'))
    const changed = [...baseTokens].filter(([name, value]) => own.get(name) !== value)
    expect(changed.map(([name]) => name)).toEqual([':root--ui-radius'])
  })
})
