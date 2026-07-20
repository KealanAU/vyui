import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { VyuiConfig } from './config.js'
import type { ProjectInfo } from './project-info.js'
import { c, log } from './utils.js'

export interface ProjectUpdate {
  path: string
  before: string
  after: string
  description: string
}

export interface ProjectUpdatePlan {
  updates: ProjectUpdate[]
  warnings: string[]
}

// The one npm package whose main-thread worklets a shadcn-flow consumer imports
// (styled kit components are copied to source, so they're scanned by default).
// Quoted so it drops straight into a `[…]` array literal in the config.
const WORKLET_PACKAGE = `'@vyui/core'`

export function planProjectUpdates(info: ProjectInfo, config: VyuiConfig): ProjectUpdatePlan {
  const updates: ProjectUpdate[] = []
  const warnings: string[] = []
  const pluginImport = `${config.aliases.lib}/plugin`
  const styleImport = `${config.aliases.lib}/style.css`
  const presetImport = relativePresetImport(config.tailwind.config, config.paths.lib)

  if (info.appEntry) {
    const before = readFileSync(join(info.cwd, info.appEntry), 'utf8')
    let after = before
    const hasVyuiBinding = /import\s+[^'"]*\bVyUI\b[^'"]*from\s+['"]/.test(after)
    if (!after.includes(pluginImport) && !hasVyuiBinding) after = insertAfterImports(after, `import { VyUI } from '${pluginImport}'`)
    if (hasVyuiBinding && !after.includes(pluginImport)) {
      warnings.push(`${info.appEntry} already imports VyUI from another package; replace that import with ${pluginImport} if migrating from @vyui/kit.`)
    }
    if (!after.includes(styleImport)) after = insertAfterImports(after, `import '${styleImport}'`)
    if (!/\.use\(\s*VyUI\b/.test(after)) {
      const appMatch = after.match(/const\s+(\w+)\s*=\s*createApp\([^\n]+\)\s*\n/)
      if (appMatch) {
        const insertion = `${appMatch[0]}${appMatch[1]}.use(VyUI)\n`
        after = after.replace(appMatch[0], insertion)
      }
      else {
        warnings.push(`Could not locate createApp() in ${info.appEntry}; register VyUI manually.`)
      }
    }
    if (after !== before) updates.push({ path: info.appEntry, before, after, description: 'register VyUI and import its tokens' })
  }
  else {
    warnings.push(`Could not find the Vue-Lynx app entry; import ${pluginImport} and call app.use(VyUI) manually.`)
  }

  if (info.tailwindConfig) {
    const before = readFileSync(join(info.cwd, info.tailwindConfig), 'utf8')
    let after = before
    const importLine = `import vyuiPreset, { VYUI_UI_STATES } from '${presetImport}'`
    const hasVyuiPresetBinding = /import\s+[^'"]*\bvyuiPreset\b[^'"]*from\s+['"]/.test(after)
    if (!after.includes('vyui-preset') && !hasVyuiPresetBinding) after = insertAfterImports(after, importLine)
    if (hasVyuiPresetBinding && !after.includes('vyui-preset')) {
      warnings.push(`${info.tailwindConfig} already imports a VyUI preset from another package; switch it to ${presetImport} if migrating from @vyui/kit.`)
    }
    if (!/\bvyuiPreset\b/.test(findPresetsExpression(after))) {
      if (/presets\s*:\s*\[/.test(after)) {
        after = after.replace(/presets\s*:\s*\[([^\]]*)\]/s, (full, inner: string) => `presets: [${inner.trim()}${inner.trim() ? ', ' : ''}vyuiPreset]`)
      }
      else {
        warnings.push(`Could not find a presets array in ${info.tailwindConfig}; add vyuiPreset manually.`)
      }
    }
    if (!after.includes('VYUI_UI_STATES]') && after.includes('createLynxPreset()')) {
      after = after.replace('createLynxPreset()', `createLynxPreset({
  lynxUIPlugins: {
    uiVariants: {
      prefixes: defaults => ({
        ...defaults,
        ui: [...defaults.ui, ...VYUI_UI_STATES],
      }),
    },
  },
})`)
    }
    else if (!after.includes('...VYUI_UI_STATES') && after.includes('createLynxPreset({')) {
      if (!after.includes('lynxUIPlugins:')) {
        after = after.replace('createLynxPreset({', `createLynxPreset({
  lynxUIPlugins: {
    uiVariants: {
      prefixes: defaults => ({
        ...defaults,
        ui: [...defaults.ui, ...VYUI_UI_STATES],
      }),
    },
  },`)
      }
      else {
        warnings.push(`Add VYUI_UI_STATES to the existing createLynxPreset uiVariants configuration in ${info.tailwindConfig}.`)
      }
    }
    if (after !== before) updates.push({ path: info.tailwindConfig, before, after, description: 'add the VyUI Tailwind preset' })
  }
  else {
    warnings.push(`Could not find tailwind.config.*; add ${presetImport} to your presets manually.`)
  }

  if (info.lynxConfig) {
    const before = readFileSync(join(info.cwd, info.lynxConfig), 'utf8')
    let after = before
    // `@vyui/core` stays an npm dependency in the shadcn flow (only the styled
    // components get copied), so its `'main thread'` worklets live in
    // node_modules. vue-lynx's MT loader skips node_modules unless a package is
    // allowlisted — without this the first gesture throws
    // `TypeError: cannot read property 'bind' of undefined` at runtime.
    if (!after.includes('includeWorkletPackages')) {
      if (after.includes('pluginVueLynx({')) {
        after = after.replace('pluginVueLynx({', `pluginVueLynx({\n      includeWorkletPackages: [${WORKLET_PACKAGE}],`)
      }
      else if (after.includes('pluginVueLynx()')) {
        after = after.replace('pluginVueLynx()', `pluginVueLynx({ includeWorkletPackages: [${WORKLET_PACKAGE}] })`)
      }
      else {
        warnings.push(`Could not find pluginVueLynx(…) in ${info.lynxConfig}; add includeWorkletPackages: [${WORKLET_PACKAGE}] to it so @vyui/core's main-thread worklets register.`)
      }
    }
    if (after !== before) updates.push({ path: info.lynxConfig, before, after, description: 'allowlist @vyui/core main-thread worklets' })
  }
  else {
    warnings.push(`Could not find lynx.config.*; add includeWorkletPackages: [${WORKLET_PACKAGE}] to pluginVueLynx(…) so main-thread worklets register.`)
  }

  return { updates, warnings }
}

export function applyProjectUpdates(plan: ProjectUpdatePlan, cwd: string, dryRun: boolean): void {
  for (const update of plan.updates) {
    if (!dryRun) writeFileSync(join(cwd, update.path), update.after)
    log.step(`${dryRun ? c.cyan('plan') : c.green('edit')} ${update.path} ${c.dim(`(${update.description})`)}`)
  }
  for (const warning of plan.warnings) log.warn(warning)
}

function insertAfterImports(source: string, line: string): string {
  const imports = [...source.matchAll(/^import[^\n]*\n/gm)]
  const last = imports.at(-1)
  if (!last || last.index === undefined) return `${line}\n${source}`
  const end = last.index + last[0].length
  return `${source.slice(0, end)}${line}\n${source.slice(end)}`
}

function findPresetsExpression(source: string): string {
  return source.match(/presets\s*:\s*\[[^\]]*\]/s)?.[0] ?? ''
}

function relativePresetImport(tailwindConfig: string, libPath: string): string {
  const depth = tailwindConfig.split(/[\\/]/).length - 1
  return `${depth === 0 ? './' : '../'.repeat(depth)}${libPath.replaceAll('\\', '/')}/vyui-preset.js`
}
