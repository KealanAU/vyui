/**
 * Fails CI when a shipped `@vyui/kit` component has no documentation page.
 *
 * Every SFC in `packages/kit/src/components/*.vue` must have a matching content
 * page at `apps/docs/content/3.components/<kebab-name>.md`. A component library
 * where `button.md` 404s is the worst possible DX signal, so this gate makes an
 * undocumented component a hard build failure.
 *
 * `KNOWN_GAPS` is a ratcheting allowlist of components that predate this check
 * and don't have a page yet. It only shrinks: adding a page for a listed
 * component makes the check tell you to remove it from the list, and a listed
 * component that no longer exists is also an error — so the list can't rot.
 *
 * Usage:
 *   tsx tools/check-docs-coverage.ts
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const componentsDir = resolve(root, 'packages/kit/src/components')
const contentDir = resolve(root, 'apps/docs/content/3.components')

/**
 * Components that don't have a docs page yet. Backfill a page, then delete the
 * entry — the check enforces that this list only ever gets shorter. Do NOT add
 * new entries for newly-authored components; write their page instead.
 */
const KNOWN_GAPS = new Set([
  'badge',
  'chip',
  'combobox',
  'dropdown-menu',
  'feed-list',
  'form-field',
  'tray-view',
])

/** `DropdownMenu` -> `dropdown-menu`, `FeedList` -> `feed-list`. */
const toKebab = (name: string): string =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const componentPages = new Set(
  readdirSync(componentsDir)
    .filter(f => f.endsWith('.vue'))
    .map(f => toKebab(f.replace(/\.vue$/, ''))),
)

const docPages = new Set(
  readdirSync(contentDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, '')),
)

// Guard: component docs must teach the slim deep-import path
// (`@vyui/kit/button`), not the barrel — a single barrel component import ships
// the whole set on Vue-Lynx (see the installation guide). Names without a deep
// entry (the `VyUI` plugin, types) stay on the barrel and are allowed.
const kitSubpaths = Object.keys(
  JSON.parse(readFileSync(resolve(root, 'packages/kit/package.json'), 'utf8')).exports as Record<string, unknown>,
)
  .filter(k => k.startsWith('./') && !k.includes('.', 2))
  .map(k => k.slice(2))

const hasDeepEntry = (name: string): boolean => {
  if (!name.startsWith('Vy')) return false
  const kebab = toKebab(name.slice(2))
  return kitSubpaths.some(s => kebab === s || kebab.startsWith(`${s}-`))
}

const barrelImports: string[] = []
for (const file of readdirSync(contentDir).filter(f => f.endsWith('.md'))) {
  const text = readFileSync(resolve(contentDir, file), 'utf8')
  for (const [, names] of text.matchAll(/import \{([^}]+)\} from '@vyui\/kit'/g)) {
    const offenders = names.split(',').map(n => n.trim().replace(/^type /, '')).filter(hasDeepEntry)
    if (offenders.length) barrelImports.push(`  - ${file}: ${offenders.join(', ')}`)
  }
}

const missing = [...componentPages].filter(p => !docPages.has(p) && !KNOWN_GAPS.has(p)).sort()
const staleGaps = [...KNOWN_GAPS].filter(p => docPages.has(p)).sort()
const orphanGaps = [...KNOWN_GAPS].filter(p => !componentPages.has(p)).sort()

const errors: string[] = []

if (missing.length) {
  errors.push(
    `Undocumented @vyui/kit components (no page at apps/docs/content/3.components/):\n`
    + missing.map(p => `  - ${p}.md`).join('\n')
    + `\nWrite a docs page for each. (Do not add them to KNOWN_GAPS — that list only shrinks.)`,
  )
}

if (staleGaps.length) {
  errors.push(
    `These now have a docs page but are still listed in KNOWN_GAPS — remove them from `
    + `tools/check-docs-coverage.ts:\n`
    + staleGaps.map(p => `  - ${p}`).join('\n'),
  )
}

if (orphanGaps.length) {
  errors.push(
    `KNOWN_GAPS references components that no longer exist — remove them from `
    + `tools/check-docs-coverage.ts:\n`
    + orphanGaps.map(p => `  - ${p}`).join('\n'),
  )
}

if (barrelImports.length) {
  errors.push(
    `Component docs import components from the '@vyui/kit' barrel — use the deep `
    + `entry (e.g. \`@vyui/kit/button\`) so consumers ship only what they use:\n`
    + barrelImports.join('\n'),
  )
}

if (errors.length) {
  console.error(`\n[check-docs-coverage] FAILED\n\n${errors.join('\n\n')}\n`)
  process.exit(1)
}

const gapNote = KNOWN_GAPS.size ? ` (${KNOWN_GAPS.size} known gap(s) still allowlisted)` : ''
console.log(`[check-docs-coverage] OK — ${componentPages.size} kit components documented${gapNote}.`)
