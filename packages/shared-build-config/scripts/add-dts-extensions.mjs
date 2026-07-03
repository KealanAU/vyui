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
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collect(full))
    else if (entry.name.endsWith('.d.ts')) out.push(full)
  }
  return out
}

// Matches the specifier of `from '…'`, `import('…')`, and bare `import '…'`.
const SPECIFIER = /(\bfrom\s*|import\s*\(\s*|\bimport\s+)(['"])(\.[^'"]*)\2/g

/** Resolve a relative specifier (from `fileDir`) to its `.js` form, or null. */
function withExtension(spec, fileDir) {
  // Already has an extension we recognise — leave it.
  if (/\.(js|mjs|cjs|json|css|d\.ts)$/.test(spec)) return null
  const target = resolve(fileDir, spec)
  if (existsSync(`${target}.d.ts`)) return `${spec}.js`
  if (existsSync(target) && statSync(target).isDirectory() && existsSync(join(target, 'index.d.ts'))) {
    return `${spec}/index.js`
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
