// Regression guard for the published JS SHAPE (the "Target dist contract" from
// docs/plans/vite-preserve-modules-dist.md): worklet-bearing modules must ship
// source-shaped so the consumer's MT worklet toolchain can follow them. A
// regression back to a bundle reintroduces the
// `__WEBPACK_EXTERNAL_MODULE_vue_lynx_* is not defined` crash.
//
// Usage: node check-dist-shape.mjs <distDir>
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Scan one module's source for contract violations. Pure + synchronous so it
 * can be unit-tested without a build.
 *
 * @param {string} file  label for messages (e.g. a dist-relative path)
 * @param {string} code
 * @returns {{ file: string, why: string, registrations: number, isWorklet: boolean }}
 */
export function scanModule(file, code) {
  const why = []

  // The bundle fingerprint: its orphaned references crash the consumer's MT bundle.
  if (/__WEBPACK_EXTERNAL_MODULE_/.test(code)) {
    why.push('contains __WEBPACK_EXTERNAL_MODULE_* (dist was bundled, not source-shaped)')
  }

  // The consumer's registration slicing keeps named refs, drops a namespace import.
  if (/import\s+\*\s+as\s+\w+\s+from\s*['"]vue-lynx['"]/.test(code)) {
    why.push("namespace import of 'vue-lynx' (must be named imports)")
  }

  // vue-lynx doesn't export `loadWorkletRuntime`; a leftover throws at load.
  if (/\bloadWorkletRuntime\b/.test(code)) {
    why.push("leftover 'loadWorkletRuntime' reference (inlineRuntimeGate did not fully strip it)")
  }

  // plugin-vue virtual sub-module specifiers must never leak into dist.
  if (/['"][^'"]*\?vue&type=/.test(code)) {
    why.push('leaked ?vue&type= virtual sub-module specifier')
  }

  // Per-file self-registration: every `_workletMap["<id>"]` needs a matching
  // in-file `registerWorkletInternal("main-thread", "<id>", …)`.
  const registered = new Set()
  for (const m of code.matchAll(/registerWorkletInternal\(\s*["']main-thread["']\s*,\s*["']([^"']+)["']/g)) {
    registered.add(m[1])
  }
  for (const m of code.matchAll(/_workletMap\[\s*["']([^"']+)["']\s*\]/g)) {
    if (!registered.has(m[1])) {
      why.push(`_workletMap["${m[1]}"] has no matching registerWorkletInternal in the same module`)
    }
  }

  // The consumer's `worklet-loader-mt` gates registration extraction on the
  // `'main thread'` marker — without it every registration is dropped.
  if (registered.size > 0 && !/'main thread'|"main thread"/.test(code)) {
    why.push("worklet module is missing the 'main thread' marker (consumer MT loader will drop its registrations)")
  }

  return { file, why, registrations: registered.size, isWorklet: registered.size > 0 }
}

function collect(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.js'))
    .map(e => join(e.parentPath, e.name))
}

export function checkDistShape(distDir) {
  const problems = []
  let workletFiles = 0
  let totalRegistrations = 0
  for (const file of collect(distDir)) {
    const res = scanModule(relative(distDir, file), readFileSync(file, 'utf8'))
    for (const why of res.why) problems.push({ file: res.file, why })
    if (res.isWorklet) workletFiles++
    totalRegistrations += res.registrations
  }
  return { problems, workletFiles, totalRegistrations }
}

// CLI entry — only when run directly, so the module is importable for tests.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const distDir = resolve(process.argv[2] ?? 'dist')
  const { problems, workletFiles, totalRegistrations } = checkDistShape(distDir)
  if (problems.length) {
    console.error(`[check-dist-shape] ${distDir}: ${problems.length} contract violation(s):`)
    for (const p of problems.slice(0, 30)) console.error(`  dist/${p.file}: ${p.why}`)
    if (problems.length > 30) console.error(`  …and ${problems.length - 30} more`)
    process.exit(1)
  }
  console.log(`[check-dist-shape] ${distDir}: OK — source-shaped, ${workletFiles} worklet module(s), ${totalRegistrations} registration(s), no bundle fingerprints.`)
}
