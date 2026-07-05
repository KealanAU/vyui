import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { patchVueLynx } from './patch-vue-lynx.js'

function projectDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), 'vyui-patch-vue-lynx-'))
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({
    packageManager: 'pnpm@11.4.0',
    dependencies: { 'vue-lynx': '^0.4.0' },
  }))
  return cwd
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('patchVueLynx', () => {
  it('writes the vue-lynx patch and adds patchedDependencies to an existing workspace file', () => {
    const cwd = projectDir()
    writeFileSync(join(cwd, 'pnpm-workspace.yaml'), "packages:\n  - 'src/*'\n")
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const result = patchVueLynx({ cwd })

    expect(result.wrotePatch).toBe(true)
    expect(result.wroteWorkspace).toBe(true)
    expect(readFileSync(join(cwd, 'patches/vue-lynx@0.4.0.patch'), 'utf8')).toContain('worklet-loader-mt.js')
    expect(readFileSync(join(cwd, 'pnpm-workspace.yaml'), 'utf8')).toBe(
      "packages:\n  - 'src/*'\npatchedDependencies:\n  vue-lynx@0.4.0: patches/vue-lynx@0.4.0.patch\n",
    )
  })

  it('creates a minimal pnpm-workspace.yaml when none exists', () => {
    const cwd = projectDir()
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), '')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    patchVueLynx({ cwd })

    expect(readFileSync(join(cwd, 'pnpm-workspace.yaml'), 'utf8')).toBe(
      "packages:\n  - '.'\npatchedDependencies:\n  vue-lynx@0.4.0: patches/vue-lynx@0.4.0.patch\n",
    )
  })

  it('is idempotent once the patch is already configured', () => {
    const cwd = projectDir()
    writeFileSync(join(cwd, 'pnpm-workspace.yaml'), "packages:\n  - '.'\n")
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    patchVueLynx({ cwd })
    const result = patchVueLynx({ cwd })

    expect(result.wrotePatch).toBe(false)
    expect(result.wroteWorkspace).toBe(false)
  })

  it('previews changes without writing files', () => {
    const cwd = projectDir()
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), '')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const result = patchVueLynx({ cwd, dryRun: true })

    expect(result.wrotePatch).toBe(true)
    expect(result.wroteWorkspace).toBe(true)
    expect(existsSync(join(cwd, 'patches/vue-lynx@0.4.0.patch'))).toBe(false)
    expect(existsSync(join(cwd, 'pnpm-workspace.yaml'))).toBe(false)
  })

  it('refuses to replace a different patch unless overwrite is passed', () => {
    const cwd = projectDir()
    mkdirSync(join(cwd, 'patches'))
    writeFileSync(join(cwd, 'patches/vue-lynx@0.4.0.patch'), 'local edits')
    writeFileSync(join(cwd, 'pnpm-workspace.yaml'), "packages:\n  - '.'\n")
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(() => patchVueLynx({ cwd })).toThrow(/already exists and differs/)

    patchVueLynx({ cwd, overwrite: true })
    expect(readFileSync(join(cwd, 'patches/vue-lynx@0.4.0.patch'), 'utf8')).toContain('extractLocalImports')
  })

  it('uses the pnpm workspace root when run from a package directory', () => {
    const root = projectDir()
    writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    const packageDir = join(root, 'packages/app')
    mkdirSync(packageDir, { recursive: true })
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ dependencies: { 'vue-lynx': '^0.4.0' } }))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const result = patchVueLynx({ cwd: packageDir })

    expect(result.root).toBe(root)
    expect(existsSync(join(root, 'patches/vue-lynx@0.4.0.patch'))).toBe(true)
    expect(existsSync(join(packageDir, 'patches/vue-lynx@0.4.0.patch'))).toBe(false)
  })
})
