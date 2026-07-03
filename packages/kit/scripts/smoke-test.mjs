// Packed-tarball smoke test.
//
// Guards the failure mode that shipped silently for months: the old
// `bundle: false` + `./src/**/*.vue` glob build emitted every component as a
// self-importing wrapper chunk (`import … from "./Button.js"` inside
// `Button.js`), so every component export resolved to `undefined` when the
// package was consumed from its published tarball. Docs render from source, so
// nothing exercised `dist` — this test does.
//
// It packs the package exactly as `npm publish` would, extracts the tarball,
// and imports the built entry points (NOT source) to assert every public export
// is defined and each `exports` subpath resolves. Run after `build`.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// `@vyui/core` pulls the vue-lynx runtime, which reads the `__DEV__` define a
// bundler would inject. Provide it so the real core module graph evaluates.
globalThis.__DEV__ = false

const pkgRoot = new URL('..', import.meta.url).pathname
const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'))

const workDir = mkdtempSync(join(tmpdir(), 'vyui-kit-smoke-'))
let failures = 0
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++ }
const ok = (msg) => console.log(`  ✓ ${msg}`)

try {
  // Pack + extract the tarball so we import the exact published artifact.
  const tarball = execFileSync('npm', ['pack', '--silent', '--pack-destination', workDir], {
    cwd: pkgRoot, encoding: 'utf8',
  }).trim().split('\n').pop()
  execFileSync('tar', ['-xzf', join(workDir, tarball), '-C', workDir])
  const dist = join(workDir, 'package', 'dist') // npm packs into a `package/` root

  // Resolve externals from the package's own node_modules (vue, @vyui/core, …).
  // `import.meta.resolve` honors the `import` condition, so it follows
  // ESM-only `exports` maps (e.g. @vyui/core) that `require.resolve` rejects.
  const resolveExternal = (spec) => import.meta.resolve(spec)

  // Node's pure-ESM resolver can't follow the tarball's bare external imports
  // (they assume a bundler). Shim them to the workspace's installed copies.
  const externals = new Map([
    ['vue', resolveExternal('vue')],
    ['@vyui/core', resolveExternal('@vyui/core')],
    ['tailwind-variants', resolveExternal('tailwind-variants')],
    ['tailwindcss/colors.js', resolveExternal('tailwindcss/colors.js')],
    ['defu', resolveExternal('defu')],
  ])
  const loaderData = JSON.stringify(Object.fromEntries(externals))

  async function importFromTarball(rel) {
    // Register a resolve hook that redirects bare externals; then import.
    const hook = `
      export async function initialize(map) { globalThis.__vyuiExternals = map }
      export async function resolve(spec, ctx, next) {
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

  // 1. Main entry — every export defined, VyUI installable, components present.
  const main = await importFromTarball('index.js')
  const undef = Object.keys(main).filter((k) => main[k] === undefined)
  if (undef.length) fail(`main entry has undefined exports: ${undef.join(', ')}`)
  else ok(`main entry: ${Object.keys(main).length} exports, none undefined`)

  if (typeof main.VyUI?.install !== 'function') fail('VyUI.install is not a function')
  else ok('VyUI plugin is installable')

  // Spot-check a representative set of components are real component objects.
  for (const name of ['Button', 'Accordion', 'Switch', 'Modal', 'VyButton']) {
    const c = main[name]
    if (!c || (typeof c !== 'object' && typeof c !== 'function')) fail(`component ${name} is ${typeof c}`)
    else ok(`component ${name} resolves`)
  }

  // 2. Subpath exports resolve to real modules.
  const theme = await importFromTarball('theme/index.js')
  if (typeof theme.button !== 'function') fail('@vyui/kit/theme: button theme missing')
  else ok('@vyui/kit/theme resolves')

  const tw = await importFromTarball('tailwind.js')
  if (!tw.default && !tw.createVyuiPreset) fail('@vyui/kit/tailwind: no preset export')
  else ok('@vyui/kit/tailwind resolves')

  // 3. Every `exports` subpath file exists in the packed tarball.
  for (const [sub, target] of Object.entries(pkg.exports)) {
    const file = (typeof target === 'string' ? target : target.import || target.default)
    if (!file || !file.endsWith('.js')) continue
    try {
      readFileSync(join(workDir, 'package', file))
      ok(`exports "${sub}" → ${file} present`)
    } catch {
      fail(`exports "${sub}" → ${file} missing from tarball`)
    }
  }
} finally {
  rmSync(workDir, { recursive: true, force: true })
}

if (failures) {
  console.error(`\nSmoke test FAILED (${failures} problem${failures === 1 ? '' : 's'}).`)
  process.exit(1)
}
console.log('\nSmoke test passed.')
