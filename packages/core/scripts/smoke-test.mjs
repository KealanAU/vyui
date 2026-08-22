// Packed-tarball smoke test for @vyui/core.
//
// Mirrors @vyui/kit's smoke test: packs the package exactly as `npm publish`
// would, extracts the tarball, and imports every `exports` subpath from the
// built artifact (NOT source) to assert exports are defined and each subpath
// resolves. Runs after `build`. Guards against a bundling regression shipping
// undefined exports the way @vyui/kit@0.0.4 did.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// core pulls the vue-lynx runtime, which reads the `__DEV__` define a bundler
// would inject. Provide it so the real module graph evaluates in plain Node.
globalThis.__DEV__ = false

const pkgRoot = new URL('..', import.meta.url).pathname
const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'))

const workDir = mkdtempSync(join(tmpdir(), 'vyui-core-smoke-'))
let failures = 0
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++ }
const ok = (msg) => console.log(`  ✓ ${msg}`)

try {
  const tarball = execFileSync('npm', ['pack', '--silent', '--pack-destination', workDir], {
    cwd: pkgRoot, encoding: 'utf8',
  }).trim().split('\n').pop()
  execFileSync('tar', ['-xzf', join(workDir, tarball), '-C', workDir])
  const dist = join(workDir, 'package', 'dist')

  // Shim bare externals to the workspace's installed copies — Node's ESM
  // resolver can't follow the tarball's bare imports (they assume a bundler).
  // `import.meta.resolve` honors the `import` condition (ESM-only exports maps).
  const externals = new Map()
  for (const spec of ['vue', 'vue-lynx', '@iconify/utils', 'ohash', 'tailwind-merge']) {
    try { externals.set(spec, import.meta.resolve(spec)) } catch { /* not needed by every entry */ }
  }
  const loaderData = JSON.stringify(Object.fromEntries(externals))

  async function importFromTarball(rel) {
    const hook = `
      export async function initialize(map) { globalThis.__vyuiExternals = map }
      export async function resolve(spec, ctx, next) {
        // SFC <style> ships as a real side-effect import now; a bundler resolves
        // it, Node can't. Stub CSS to an empty module like a bundler would.
        if (spec.endsWith('.css')) return { url: 'data:text/javascript,export default {}', shortCircuit: true }
        const m = globalThis.__vyuiExternals
        if (m && m[spec]) return { url: m[spec], shortCircuit: true }
        return next(spec, ctx)
      }`
    const { register } = await import('node:module')
    register(`data:text/javascript,${encodeURIComponent(hook)}`, import.meta.url, {
      data: JSON.parse(loaderData),
    })
    return import(pathToFileURL(join(dist, rel)).href)
  }

  // Each `exports` subpath → its built entry file, imported and checked.
  // Wildcard subpaths (`./dist/*.js`, the deep-import surface for @vyui/kit's
  // rewrite) have no single file to import; bundler resolution covers them.
  for (const [sub, target] of Object.entries(pkg.exports)) {
    if (sub.includes('*')) continue
    const file = typeof target === 'string' ? target : target.import || target.default
    if (!file || !file.endsWith('.js')) continue
    const rel = file.replace(/^\.\/dist\//, '')
    let mod
    try {
      mod = await importFromTarball(rel)
    } catch (e) {
      fail(`exports "${sub}" (${file}) failed to import: ${e.message}`)
      continue
    }
    const names = Object.keys(mod)
    const undef = names.filter((n) => mod[n] === undefined)
    if (undef.length) fail(`exports "${sub}" has undefined exports: ${undef.join(', ')}`)
    else if (!names.length) fail(`exports "${sub}" has no exports`)
    else ok(`exports "${sub}" → ${names.length} export(s), none undefined`)
  }
} finally {
  rmSync(workDir, { recursive: true, force: true })
}

if (failures) {
  console.error(`\nSmoke test FAILED (${failures} problem${failures === 1 ? '' : 's'}).`)
  process.exit(1)
}
console.log('\nSmoke test passed.')
