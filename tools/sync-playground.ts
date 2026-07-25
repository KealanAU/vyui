/**
 * Syncs the docs-playground into the docs app:
 *
 *   1. Copies the web bundle into `public/` so `<LynxPreview>` can load it
 *      from `/playground/main.web.bundle` (a single self-contained file).
 *   2. Reads every example SFC under the playground's `src/examples/**` and
 *      emits a source manifest so `<ComponentCode>` can show the exact code
 *      that renders in the live preview. Example ids are the camel→kebab of
 *      the file basename (e.g. `AccordionMultiple.vue` -> `accordion-multiple`),
 *      matching the playground's registry keys.
 *
 * Run via `pnpm --filter @vyui/docs playground:build`, which builds first.
 */
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { codeToHtml } from 'shiki'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const playground = resolve(root, 'apps/examples/docs-playground')

const bundleSrc = resolve(playground, 'dist/main.web.bundle')
const publicDir = resolve(root, 'apps/docs/public/playground')
mkdirSync(publicDir, { recursive: true })
copyFileSync(bundleSrc, resolve(publicDir, 'main.web.bundle'))

// 2. Prebuilt Lynx web runtime -> docs public/
//
// Keep this asset tree intact. Importing @lynx-js/web-core/client through
// Nuxt/Vite rewrites its WASM URLs into optimized dependency paths; serving
// the package's production runtime untouched preserves its relative chunk and
// WASM URLs, matching the integration used by the official Lynx docs.
const docsRequire = createRequire(resolve(root, 'apps/docs/package.json'))
const runtimeEntry = docsRequire.resolve('@lynx-js/web-core/client.prod.js')
const runtimeSrc = resolve(dirname(runtimeEntry), '../..')
const runtimeDir = resolve(root, 'apps/docs/public/lynx-runtime')
rmSync(runtimeDir, { recursive: true, force: true })
cpSync(runtimeSrc, runtimeDir, { recursive: true, force: true })

const examplesDir = resolve(playground, 'src/examples')

const toKebab = (name: string) =>
  name.replace(/\.vue$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// Valid per-component deep entries, straight from kit's published `exports` —
// the source of truth, so a shared entry like `keyboard-aware` (which exports
// VyKeyboardAwareRoot/Trigger/Responder) maps right instead of being guessed
// into a `keyboard-aware-root` path that doesn't exist.
const kitSubpaths = Object.keys(JSON.parse(readFileSync(resolve(root, 'packages/kit/package.json'), 'utf8')).exports)
  .filter(k => k.startsWith('./') && !k.includes('.', 2))
  .map(k => k.slice(2))

/** Longest kit subpath that is a whole-segment prefix of `kebab(Vy-stripped name)`. */
function subpathFor(name: string): string | undefined {
  const kebab = toKebab(name.slice(2))
  return kitSubpaths.filter(s => kebab === s || kebab.startsWith(`${s}-`)).sort((a, b) => b.length - a.length)[0]
}

// Rewrite the DISPLAYED barrel import to the per-component deep entry
// (`@vyui/kit/button`) so copied code ships only what it uses — see the
// installation guide's "Bundle size & deep imports". The SFCs keep the barrel
// import on disk; the source-aliased playground resolves both identically.
// Non-component names are left on the barrel.
function toDeepImports(source: string): string {
  return source.replace(/import \{([^}]+)\} from '@vyui\/kit'/g, (_whole, names: string) => {
    const bySubpath = new Map<string, string[]>()
    const barrel: string[] = []
    for (const n of names.split(',').map(s => s.trim()).filter(Boolean)) {
      const sub = n.startsWith('Vy') ? subpathFor(n) : undefined
      if (sub) bySubpath.set(sub, [...(bySubpath.get(sub) ?? []), n])
      else barrel.push(n)
    }
    const lines = [...bySubpath].map(([sub, ns]) => `import { ${ns.join(', ')} } from '@vyui/kit/${sub}'`)
    if (barrel.length) lines.push(`import { ${barrel.join(', ')} } from '@vyui/kit'`)
    return lines.join('\n')
  })
}

function walk(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.vue'))
    .map(e => join(e.parentPath, e.name))
}

// One file per example, glob-loaded on demand (see app/utils/example.ts) — all
// 80 in one module is ~500KB every importing page parses to show one.
const genDir = resolve(root, 'apps/docs/app/generated/examples')
rmSync(genDir, { recursive: true, force: true })
mkdirSync(genDir, { recursive: true })

const files = walk(examplesDir)
for (const file of files) {
  const id = toKebab(file.split('/').pop()!)
  const source = toDeepImports(readFileSync(file, 'utf8').trimEnd())
  const highlighted = await codeToHtml(source, { lang: 'vue', theme: 'material-theme-palenight' })
  writeFileSync(resolve(genDir, `${id}.json`), JSON.stringify({ source, highlighted }))
}

console.log(`[sync-playground] runtime + bundle + ${files.length} example sources synced`)
