// Append explicit `.js` extensions to relative specifiers in emitted `.d.ts`
// files, so the published types resolve under `moduleResolution: node16` /
// `nodenext` (which reject extensionless relative imports in an ESM package).
//
// Why a post-process: both @vyui packages bundle their RUNTIME (a handful of
// entry `.js`) but emit UNBUNDLED types (one `.d.ts` per source file, from
// vue-tsc). vue-tsc writes extensionless relative specifiers, and there is no
// per-module `.js` to point at, so `tsc-alias --resolve-full-paths` can't add
// the extension. TS only needs the specifier to resolve to a `.d.ts` for type
// checking (consumers runtime-import the bundled entry, never these subpaths),
// so `'./x'` → `'./x.js'` (mapped to `./x.d.ts`) or `'./x/index.js'` is exactly
// what node16 wants. Safe under `bundler` resolution too.
//
// Usage: node add-dts-extensions.mjs <distDir>
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const distDir = resolve(process.argv[2] ?? 'dist')

/** Recursively collect every `.d.ts` under `dir`. */
function collect(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.d.ts'))
    .map(e => join(e.parentPath, e.name))
}

// Matches the specifier of `from '…'`, `import('…')`, and bare `import '…'`.
const SPECIFIER = /(\bfrom\s*|import\s*\(\s*|\bimport\s+)(['"])(\.[^'"]*)\2/g

/**
 * Resolve a relative specifier (from `fileDir`) to the `.js` form node16 wants,
 * or null to leave it. Handles missing extensions AND wrong ones — vue-tsc
 * emits both `./x` (extensionless) and `./x.ts` (source extension), neither of
 * which resolves for a consumer.
 */
function withExtension(spec, fileDir) {
  // Asset imports keep their own extension.
  if (/\.(json|css)$/.test(spec)) return null
  // Strip any code extension to get the base, then re-resolve against `.d.ts`.
  const base = spec.replace(/\.(js|mjs|cjs|ts|tsx|d\.ts)$/, '')
  const target = resolve(fileDir, base)
  if (existsSync(`${target}.d.ts`)) {
    const want = `${base}.js`
    return want === spec ? null : want
  }
  if (existsSync(target) && statSync(target).isDirectory() && existsSync(join(target, 'index.d.ts'))) {
    const want = `${base}/index.js`
    return want === spec ? null : want
  }
  return null // unresolved — don't guess
}

let changedFiles = 0
let changedSpecs = 0
for (const file of collect(distDir)) {
  const fileDir = dirname(file)
  let touched = false
  const next = readFileSync(file, 'utf8').replace(SPECIFIER, (match, kw, quote, spec) => {
    const rewritten = withExtension(spec, fileDir)
    if (!rewritten) return match
    touched = true
    changedSpecs++
    return `${kw}${quote}${rewritten}${quote}`
  })
  if (touched) {
    writeFileSync(file, next)
    changedFiles++
  }
}

console.log(`[add-dts-extensions] ${distDir}: rewrote ${changedSpecs} specifier(s) across ${changedFiles} file(s)`)
