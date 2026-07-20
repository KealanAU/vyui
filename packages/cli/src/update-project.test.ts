import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultConfig } from './config.js'
import { detectProject } from './project-info.js'
import { planProjectUpdates } from './update-project.js'

describe('planProjectUpdates', () => {
  it('wires a standard app entry and Tailwind config idempotently', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vyui-update-'))
    mkdirSync(join(cwd, 'src'))
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { 'vue-lynx': '^0.4.0' } }))
    writeFileSync(join(cwd, 'src/index.css'), '@tailwind utilities;\n')
    writeFileSync(join(cwd, 'src/index.ts'), `import { createApp } from 'vue-lynx'\nimport App from './App.vue'\n\nconst app = createApp(App)\napp.mount()\n`)
    writeFileSync(join(cwd, 'tailwind.config.ts'), `import { createLynxPreset } from '@lynx-js/tailwind-preset'\n\nconst lynxPreset = createLynxPreset()\nexport default { presets: [lynxPreset] }\n`)
    writeFileSync(join(cwd, 'lynx.config.ts'), `import { pluginVueLynx } from 'vue-lynx/plugin'\n\nexport default { plugins: [pluginVueLynx({ optionsApi: false })] }\n`)

    const info = detectProject(cwd)
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate', {
      tailwindConfig: info.tailwindConfig,
      css: info.css,
    })
    const plan = planProjectUpdates(info, config)
    const app = plan.updates.find(update => update.path === 'src/index.ts')?.after ?? ''
    const tailwind = plan.updates.find(update => update.path === 'tailwind.config.ts')?.after ?? ''
    const lynx = plan.updates.find(update => update.path === 'lynx.config.ts')?.after ?? ''

    expect(app).toContain(`import { VyUI } from '@/lib/vyui/plugin'`)
    expect(app).toContain(`import '@/lib/vyui/style.css'`)
    expect(app).toContain('app.use(VyUI)')
    expect(tailwind).toContain('VYUI_UI_STATES')
    expect(tailwind).toContain('presets: [lynxPreset, vyuiPreset]')
    expect(lynx).toContain(`includeWorkletPackages: ['@vyui/core']`)
  })

  it('allowlists worklets idempotently and warns when pluginVueLynx is absent', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vyui-update-'))
    mkdirSync(join(cwd, 'src'))
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { 'vue-lynx': '^0.4.0' } }))
    // Already-wired lynx.config: a second pass must not add a duplicate.
    writeFileSync(join(cwd, 'lynx.config.ts'), `import { pluginVueLynx } from 'vue-lynx/plugin'\n\nexport default { plugins: [pluginVueLynx({ includeWorkletPackages: ['@vyui/core'] })] }\n`)

    const info = detectProject(cwd)
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate')
    const plan = planProjectUpdates(info, config)

    expect(plan.updates.some(update => update.path === 'lynx.config.ts')).toBe(false)
    expect(plan.warnings.some(w => w.includes('lynx.config'))).toBe(false)
  })
})
