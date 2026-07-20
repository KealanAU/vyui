// Native-compat check for pre-compiled MT worklets, in plain node:test
// (worklet-bearing modules crash vitest — see CONTRIBUTING "Worklet pitfalls"
// and issue #6; this sidesteps the whole MT pipeline).
//
// The consumer's `worklet-loader-mt` ships ONLY our dist registrations to the
// main thread — module scope is stripped. So every registered worklet body must
// be self-contained: its only free identifiers are the PrimJS/Lynx MT runtime
// globals. We evaluate each worklet-bearing dist module with a collecting
// `registerWorkletInternal`, then run eslint's scope analysis (`no-undef`) over
// each collected body in isolation. Any other free identifier is a closure /
// module-scope capture that throws ReferenceError on device.
//
// Also scans dist text for regex syntax PrimJS rejects (Unicode property
// escapes, lookbehind).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { register } from 'node:module'
import { Linter } from 'eslint'

const dist = new URL('../dist', import.meta.url).pathname

// Globals that exist on the Lynx main thread (PrimJS). ES built-ins (Number,
// Math, …) are covered by eslint's default ecmaVersion globals; only
// environment globals go here. Additions need a source in one of the two
// installers below (or ambient PrimJS) — not just "it looks global".
const MT_GLOBALS = {
  // ambient PrimJS / Lynx
  lynx: 'readonly',
  SystemInfo: 'readonly',
  console: 'readonly',
  // @lynx-js/react worklet-runtime (dist/main.js) installs on globalThis
  lynxWorkletImpl: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  // vue-lynx main-thread/dist/entry-main.js installs on globalThis
  runOnBackground: 'readonly',
}

const jsFiles = (dir) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(dir, f))

const files = jsFiles(dist).map((path) => ({ path, code: readFileSync(path, 'utf8') }))
const workletFiles = files.filter((f) => f.code.includes('registerWorkletInternal('))

// --- collect worklet bodies by evaluating dist modules with a mock runtime ---

globalThis.__DEV__ = false // bundler define the vue-lynx runtime expects
globalThis.lynxWorkletImpl = { _workletMap: {} } // truthy → registration gate passes
const worklets = []
let currentFile = ''
globalThis.registerWorkletInternal = (target, id, fn) => {
  worklets.push({ file: currentFile, id, src: fn.toString() })
}

// SFC <style> ships as a real side-effect import; stub CSS like a bundler would.
register(
  `data:text/javascript,${encodeURIComponent(`
    export async function resolve(spec, ctx, next) {
      if (spec.endsWith('.css')) return { url: 'data:text/javascript,export default {}', shortCircuit: true }
      return next(spec, ctx)
    }`)}`,
  import.meta.url,
)

for (const f of workletFiles) {
  currentFile = f.path.slice(dist.length + 1)
  await import(pathToFileURL(f.path).href)
}

test('every dist registration was collected', () => {
  const expected = files.reduce(
    (n, f) => n + (f.code.match(/registerWorkletInternal\("main-thread"/g)?.length ?? 0),
    0,
  )
  assert.ok(expected > 0, 'no registerWorkletInternal calls found in dist — build shape changed?')
  assert.equal(worklets.length, expected)
})

test('worklet bodies are self-contained (no module-scope captures)', () => {
  const linter = new Linter()
  const problems = worklets.flatMap((w) =>
    linter
      .verify(`(${w.src})`, {
        languageOptions: { sourceType: 'script', globals: MT_GLOBALS },
        rules: { 'no-undef': 'error' },
      })
      .map((m) => `${w.file} [${w.id}]: ${m.message}`),
  )
  assert.deepEqual(problems, [])
})

test('worklet bodies are extraction-safe (no comments, no regex literals)', () => {
  // The consumer's worklet-loader-mt slices registrations out of dist with
  // hand-rolled text scanners that have misread comment content (vue-lynx
  // 0.5.x) and would misread regex literals (every version). The build strips
  // comments from worklet modules (vite-worklet-plugin); this pins both
  // invariants so a build-config change can't silently reopen the exposure.
  const linter = new Linter()
  const problems = worklets.flatMap((w) =>
    linter
      .verify(`(${w.src})`, {
        plugins: {
          vyui: {
            rules: {
              'extraction-safe': {
                create(ctx) {
                  return {
                    Program() {
                      for (const c of ctx.sourceCode.getAllComments())
                        ctx.report({ loc: c.loc, message: `comment in body: ${c.value.trim().slice(0, 40)}` })
                    },
                    Literal(node) {
                      if (node.regex) ctx.report({ node, message: `regex literal in body: /${node.regex.pattern}/` })
                    },
                  }
                },
              },
            },
          },
        },
        languageOptions: { sourceType: 'script' },
        rules: { 'vyui/extraction-safe': 'error' },
      })
      .map((m) => `${w.file} [${w.id}]: ${m.message}`),
  )
  assert.deepEqual(problems, [])
})

test('no PrimJS regex landmines in dist', () => {
  // \p{…}/\P{…} property escapes and (?<=/(?<! lookbehind fail to parse on
  // PrimJS. Text scan over all dist (deps are external, so this is first-party
  // code only); a hit needs eyes regardless of which module it lands in.
  const landmine = /\\[pP]\{|\(\?<[=!]/
  const hits = files
    .filter((f) => landmine.test(f.code))
    .map((f) => f.path.slice(dist.length + 1))
  assert.deepEqual(hits, [])
})
