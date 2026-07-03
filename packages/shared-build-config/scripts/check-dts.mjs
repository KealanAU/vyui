// Regression guard for the published TYPES: scan every emitted `.d.ts` and fail
// the build if a relative/aliased specifier would not resolve for a consumer.
// Complements the packed-tarball smoke test (which guards the RUNTIME exports).
//
// Catches the two ways @vyui types have broken downstream:
//   1. `@/*` path-alias specifiers leaking into `.d.ts` (unresolvable for
//      consumers — the alias only exists in our own tsconfig).
//   2. Extensionless relative specifiers (rejected under `moduleResolution:
//      node16`/`nodenext`), or ones that don't resolve to a real `.d.ts`.
//
// Run after the declaration emit + `add-dts-extensions`.
// Usage: node check-dts.mjs <distDir>
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const distDir = resolve(process.argv[2] ?? 'dist')

function collect(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collect(full))
    else if (entry.name.endsWith('.d.ts')) out.push(full)
  }
  return out
}

const SPECIFIER = /(?:\bfrom\s*|import\s*\(\s*|\bimport\s+|\bexport\s+\*\s+from\s*|\bexport\s*\{[^}]*\}\s*from\s*)(['"])([^'"]+)\1/g
// Code specifiers must carry a JS extension for node16; asset side-effect
// imports (`import './x.css'`) keep their own and aren't module-resolved.
const CODE_EXT = /\.(js|mjs|cjs)$/
const ASSET_EXT = /\.(json|css)$/

/** True if a relative specifier resolves to an existing declaration file. */
function resolvesToDts(spec, fileDir) {
  const base = spec.replace(/\.(js|mjs|cjs)$/, '')
  const target = resolve(fileDir, base)
  if (existsSync(`${target}.d.ts`)) return true
  if (existsSync(target) && statSync(target).isDirectory() && existsSync(join(target, 'index.d.ts'))) return true
  return false
}

const problems = []
for (const file of collect(distDir)) {
  const fileDir = dirname(file)
  const src = readFileSync(file, 'utf8')
  for (const [, , spec] of src.matchAll(SPECIFIER)) {
    if (spec.startsWith('@/')) {
      problems.push({ file, spec, why: 'unresolved path alias (@/ only exists in our tsconfig)' })
    } else if (spec.startsWith('.') && !ASSET_EXT.test(spec)) {
      if (!CODE_EXT.test(spec)) {
        problems.push({ file, spec, why: 'extensionless/wrong-extension relative import (breaks node16/nodenext)' })
      } else if (!resolvesToDts(spec, fileDir)) {
        problems.push({ file, spec, why: 'relative import resolves to no .d.ts' })
      }
    }
    // Bare specifiers (packages) are out of scope — declared deps handle them.
  }
}

if (problems.length) {
  console.error(`[check-dts] ${distDir}: ${problems.length} unresolved type specifier(s):`)
  for (const p of problems.slice(0, 25)) {
    console.error(`  ${p.file.replace(distDir, 'dist')}: "${p.spec}" — ${p.why}`)
  }
  if (problems.length > 25) console.error(`  …and ${problems.length - 25} more`)
  process.exit(1)
}
console.log(`[check-dts] ${distDir}: all relative/aliased type specifiers resolve.`)
