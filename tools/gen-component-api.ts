/**
 * Extracts props / events / slots metadata for @vyui/kit and @vyui/core SFCs
 * and writes one JSON file per component to
 * `apps/docs/app/generated/api/<Name>.json`, consumed by the
 * `<ComponentProps>` / `<ComponentEmits>` / `<ComponentSlots>` MDC components.
 * Resolves interface inheritance and JSDoc (`@defaultValue`, descriptions) via
 * vue-component-meta, so the tables stay in sync with source.
 *
 * Output names are the SFC basename — kit `Accordion.vue` -> `Accordion.json`,
 * core `AccordionRoot.vue` -> `AccordionRoot.json` (no collisions).
 *
 * Usage:
 *   tsx tools/gen-component-api.ts            # all kit + core components
 *   tsx tools/gen-component-api.ts Accordion  # filter by SFC basename
 */
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createChecker } from 'vue-component-meta'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'apps/docs/app/generated/api')
mkdirSync(outDir, { recursive: true })

const only = process.argv.slice(2)

interface PropDoc { name: string, type: string, required: boolean, default?: string, description?: string }

function clean(meta: ReturnType<ReturnType<typeof createChecker>['getComponentMeta']>) {
  const props: PropDoc[] = meta.props
    .filter(p => !p.global) // drop inherited DOM/global attributes
    .map(p => ({
      name: p.name,
      type: p.type,
      required: p.required,
      default: p.default ?? undefined,
      description: p.description || undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const events = meta.events.map(e => ({ name: e.name, type: e.type, description: (e as { description?: string }).description || undefined }))
  const slots = meta.slots.map(s => ({ name: s.name, type: s.type, description: (s as { description?: string }).description || undefined }))
  return { props, events, slots }
}

function vueFilesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip per-component story/internal trees.
      if (entry.name === 'story' || entry.name === 'internal') return []
      return vueFilesIn(full)
    }
    return entry.name.endsWith('.vue') && !entry.name.includes('.story.') ? [full] : []
  })
}

const sources = [
  { name: 'kit', tsconfig: resolve(root, 'packages/kit/tsconfig.json'), dir: resolve(root, 'packages/kit/src/components') },
  { name: 'core', tsconfig: resolve(root, 'packages/core/tsconfig.json'), dir: resolve(root, 'packages/core/src/components') },
]

// On a shared SFC basename (`Toggle.vue` in both kit and core) the later core
// write would clobber the kit table, so skip core collidees — the kit wrapper's
// inherited props still cover the headless component.
const kitDir = sources.find(s => s.name === 'kit')?.dir
const kitNames = kitDir ? new Set(vueFilesIn(kitDir).map(file => file.split('/').pop()!.replace(/\.vue$/, ''))) : new Set<string>()

// Every SFC the run considered, whether or not its write succeeded — a component
// that threw stays in the set, so a transient vue-component-meta failure leaves
// its page stale rather than deleting it.
const expected = new Set<string>()

for (const source of sources) {
  if (!statSync(source.tsconfig, { throwIfNoEntry: false })) {
    console.warn(`[gen-api] no tsconfig for ${source.name}, skipping`)
    continue
  }
  const checker = createChecker(source.tsconfig, { forceUseTs: true, printer: { newLine: 1 } })
  for (const file of vueFilesIn(source.dir)) {
    const name = file.split('/').pop()!.replace(/\.vue$/, '')
    if (source.name === 'core' && kitNames.has(name)) continue
    expected.add(name)
    if (only.length && !only.includes(name)) continue
    try {
      const meta = checker.getComponentMeta(file)
      writeFileSync(resolve(outDir, `${name}.json`), `${JSON.stringify(clean(meta), null, 2)}\n`)
      console.log(`[gen-api] ${source.name}/${name}`)
    }
    catch (err) {
      console.warn(`[gen-api] skipped ${source.name}/${name}: ${(err as Error).message}`)
    }
  }
}

// Deleted/renamed components would otherwise leave their JSON behind forever.
// Full runs only — a filtered run never looked at the rest.
if (!only.length) {
  for (const entry of readdirSync(outDir)) {
    if (!entry.endsWith('.json') || expected.has(entry.replace(/\.json$/, ''))) continue
    rmSync(resolve(outDir, entry))
    console.log(`[gen-api] pruned ${entry}`)
  }
}
