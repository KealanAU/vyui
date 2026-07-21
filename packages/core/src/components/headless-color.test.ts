import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// `import.meta.url` isn't a file: URL under the Lynx testing environment.
const componentsDir = resolve(process.cwd(), 'src/components')

/** Strip comments so prose naming a color isn't mistaken for shipping one. */
function code(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
}

function vueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'story' ? [] : vueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

/**
 * @vyui/core is headless: it owns behaviour, structure and lifecycle classes,
 * and ships NO color. Every overlay primitive documents this ("No defaults —
 * pass `backgroundColor` … here", see `DialogContentImpl`), but `Sheet` and
 * `SwipeAction` shipped one anyway, and both did it in a way the consumer could
 * not override:
 *
 *   - `.vyui-sheet__content { background-color: #fff }` beat `@vyui/kit`'s
 *     `bg-default` on source order, pinning every Sheet-backed surface —
 *     drawer, tray, action sheet, select, combobox, popover — to white in BOTH
 *     color modes.
 *   - `SheetBackdropImpl` and `SwipeAction` set it INLINE, which no class can
 *     outrank at all, so the theme's class was dead on arrival.
 *
 * It only looked like a dark-mode bug because white-on-white is invisible.
 *
 * `story/` is exempt: stories are consumers of the primitives and must supply
 * their own color, exactly as `@vyui/kit` does.
 */
describe('@vyui/core ships no color', () => {
  const files = vueFiles(componentsDir)

  // A literal color: hex, rgb()/rgba(), hsl(), or a bare word that isn't a
  // pass-through keyword. `var(...)` is fine — that IS the consumer's hook.
  const literalBackground
    = /background(?:-color)?\s*:\s*(?!var\(|inherit|transparent|initial|unset|none\b)['"]?[#a-z0-9(]/i

  it('finds the component tree', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it.each(files.map(f => [f.slice(componentsDir.length + 1), f] as const))(
    '%s declares no background color',
    (_name, path) => {
      const offending = code(readFileSync(path, 'utf8'))
        .split('\n')
        .filter(line => literalBackground.test(line))
        .map(line => line.trim())

      expect(offending).toEqual([])
    },
  )
})
