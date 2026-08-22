// Append explicit `.js` extensions to relative specifiers in emitted `.d.ts`
// files, so the published types resolve under `moduleResolution: node16` /
// `nodenext` (which reject extensionless relative imports in an ESM package).
// vue-tsc writes them extensionless and `tsc-alias --resolve-full-paths` can't
// fix it (there is no per-module `.js` to point at), hence this post-process.
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

// Whole-line CSS side-effect imports — no types, and every resolver fails on
// them, so drop them from the declaration copy.
const CSS_SIDE_EFFECT = /^[ \t]*import\s+(['"])\.[^'"]*\.css\1;?[ \t]*\r?\n?/gm

/**
 * Resolve a relative specifier (from `fileDir`) to the `.js` form node16 wants,
 * or null to leave it. vue-tsc emits both `./x` and `./x.ts`; neither resolves
 * for a consumer.
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
let strippedCss = 0
for (const file of collect(distDir)) {
  const fileDir = dirname(file)
  let touched = false
  let src = readFileSync(file, 'utf8')
  const withoutCss = src.replace(CSS_SIDE_EFFECT, '')
  if (withoutCss !== src) {
    src = withoutCss
    touched = true
    strippedCss++
  }
  const next = src.replace(SPECIFIER, (match, kw, quote, spec) => {
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

console.log(`[add-dts-extensions] ${distDir}: rewrote ${changedSpecs} specifier(s) across ${changedFiles} file(s), stripped CSS imports from ${strippedCss}`)
