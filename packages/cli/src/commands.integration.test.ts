import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RegistryItem } from './registry-schema.js'
import { add } from './commands/add.js'
import { init } from './commands/init.js'

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeRegistryItem(root: string, style: string, item: RegistryItem): void {
  const directory = join(root, style)
  mkdirSync(directory, { recursive: true })
  writeJson(join(directory, `${item.name}.json`), item)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('init + add', () => {
  it('installs a styled component graph from a local registry', async () => {
    const registry = tempDir('vyui-e2e-registry-')
    const project = tempDir('vyui-e2e-project-')
    writeFileSync(join(project, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { paths: { '~/*': ['./src/*'] } },
    }))
    writeJson(join(registry, 'styles.json'), { default: 'default', styles: ['default', 'shadcn'] })
    mkdirSync(join(registry, 'shadcn'), { recursive: true })
    writeJson(join(registry, 'shadcn/index.json'), {
      registry,
      style: 'shadcn',
      components: [
        { name: 'button', type: 'registry:ui', dependencies: [], registryDependencies: ['icon'] },
        { name: 'icon', type: 'registry:ui', dependencies: [], registryDependencies: [] },
      ],
    })

    writeRegistryItem(registry, 'shadcn', {
      name: 'init',
      type: 'registry:lib',
      dependencies: [],
      registryDependencies: [],
      files: [
        {
          path: 'plugin.ts',
          target: 'plugin.ts',
          type: 'registry:lib',
          content: `import type { X } from '@@vyui:lib/types'\nexport const gray = '__VYUI_GRAY__'\n`,
        },
        {
          path: 'types.ts',
          target: 'types.ts',
          type: 'registry:lib',
          content: 'export interface X {}\n',
        },
      ],
    })
    writeRegistryItem(registry, 'shadcn', {
      name: 'button',
      type: 'registry:ui',
      dependencies: [],
      registryDependencies: ['icon'],
      files: [
        {
          path: 'components/Button.vue',
          target: 'Button.vue',
          type: 'registry:ui',
          content: `<script setup lang="ts">\nimport Icon from '@@vyui:components/Icon.vue'\n</script>\n`,
        },
      ],
    })
    writeRegistryItem(registry, 'shadcn', {
      name: 'icon',
      type: 'registry:ui',
      dependencies: [],
      registryDependencies: [],
      files: [
        {
          path: 'components/Icon.vue',
          target: 'Icon.vue',
          type: 'registry:ui',
          content: '<template><view /></template>\n',
        },
      ],
    })

    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await init({
      cwd: project,
      registry,
      style: 'shadcn',
      baseColor: 'zinc',
      yes: true,
      skipInstall: true,
    })
    await add({
      cwd: project,
      components: ['button'],
      yes: true,
      skipInstall: true,
    })

    const config = JSON.parse(readFileSync(join(project, 'vyui.config.json'), 'utf8'))
    expect(config.style).toBe('shadcn')
    expect(config.aliases.components).toBe('~/components/vyui')

    expect(readFileSync(join(project, 'src/lib/vyui/plugin.ts'), 'utf8')).toContain(`from '~/lib/vyui/types'`)
    expect(readFileSync(join(project, 'src/lib/vyui/plugin.ts'), 'utf8')).toContain(`gray = 'zinc'`)
    expect(readFileSync(join(project, 'src/components/vyui/Button.vue'), 'utf8')).toContain(`from '~/components/vyui/Icon.vue'`)
    expect(readFileSync(join(project, 'src/components/vyui/Icon.vue'), 'utf8')).toContain('<view />')

    // Explicit overwrite updates the requested component, but preserves a
    // transitive dependency the consumer has customized.
    writeFileSync(join(project, 'src/components/vyui/Button.vue'), 'custom button')
    writeFileSync(join(project, 'src/components/vyui/Icon.vue'), 'custom icon')
    await add({
      cwd: project,
      components: ['button'],
      yes: true,
      skipInstall: true,
      overwrite: true,
    })
    expect(readFileSync(join(project, 'src/components/vyui/Button.vue'), 'utf8')).toContain(`from '~/components/vyui/Icon.vue'`)
    expect(readFileSync(join(project, 'src/components/vyui/Icon.vue'), 'utf8')).toBe('custom icon')
  })
})
