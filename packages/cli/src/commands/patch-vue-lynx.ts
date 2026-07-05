import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { detectPackageManager, log, c } from '../utils.js'

const VUE_LYNX_VERSION = '0.4.0'
const PATCH_PATH = `patches/vue-lynx@${VUE_LYNX_VERSION}.patch`
const PATCH_ENTRY = `vue-lynx@${VUE_LYNX_VERSION}: ${PATCH_PATH}`

const VUE_LYNX_PATCH = `diff --git a/plugin/dist/loaders/worklet-loader-mt.js b/plugin/dist/loaders/worklet-loader-mt.js
index 2201679cff292214a49d6db18cc00627f31431a6..049a6456f82a9c0c1b39006528926a1ea8b6454f 100644
--- a/plugin/dist/loaders/worklet-loader-mt.js
+++ b/plugin/dist/loaders/worklet-loader-mt.js
@@ -1,7 +1,15 @@
+// [vyui local patch \u2014 REMOVE WHEN UPSTREAM FIXED]
+// vue-lynx's MT worklet loader only followed relative imports, so '@/\u2026'
+// alias-imported worklets and published @vyui/core/@vyui/kit package imports
+// never reached the MT graph (TypeError: cannot read property 'bind' of
+// undefined). This widens extractLocalImports to follow those known-safe
+// edges. Track: docs/upstream/vue-lynx-mt-worklet-import-issue.md.
+// To undo: delete patches/vue-lynx@0.4.0.patch + its pnpm.patchedDependencies
+// entry in the root package.json, then \`pnpm install\`.
 import * as __WEBPACK_EXTERNAL_MODULE__lynx_js_react_transform_7b1e07c1__ from "@lynx-js/react/transform";
 function extractLocalImports(source) {
     const specifiers = new Set();
-    const fromRe = /from\\s+['"](\\.[^'"]+)['"]/g;
+    const fromRe = /from\\s+['"](\\.[^'"]+|@\\/[^'"]+|@vyui\\/(?:core|kit)(?:\\/[^'"]*)?)['"]/g;
     let match;
     while(null !== (match = fromRe.exec(source))){
         const lineStart = source.lastIndexOf('\\n', match.index) + 1;
@@ -10,7 +18,7 @@ function extractLocalImports(source) {
         if (/with\\s*\\{/.test(line)) continue;
         specifiers.add(match[1]);
     }
-    const bareRe = /import\\s+['"](\\.[^'"]+)['"]/g;
+    const bareRe = /import\\s+['"](\\.[^'"]+|@\\/[^'"]+|@vyui\\/(?:core|kit)(?:\\/[^'"]*)?)['"]/g;
     while(null !== (match = bareRe.exec(source)))specifiers.add(match[1]);
     if (0 === specifiers.size) return '';
     return [
`

export interface PatchVueLynxOptions {
  cwd: string
  dryRun?: boolean
  overwrite?: boolean
}

export interface PatchVueLynxResult {
  root: string
  patchFile: string
  workspaceFile: string
  wrotePatch: boolean
  wroteWorkspace: boolean
}

export function patchVueLynx(opts: PatchVueLynxOptions): PatchVueLynxResult {
  const pm = detectPackageManager(opts.cwd)
  if (pm !== 'pnpm') {
    throw new Error(`patch-vue-lynx currently supports pnpm projects only; detected ${pm}.`)
  }

  const root = findPnpmRoot(opts.cwd)
  const patchFile = join(root, PATCH_PATH)
  const workspaceFile = join(root, 'pnpm-workspace.yaml')

  const existingPatch = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : undefined
  if (existingPatch !== undefined && existingPatch !== VUE_LYNX_PATCH && !opts.overwrite) {
    throw new Error(`${PATCH_PATH} already exists and differs from the VyUI patch. Pass --overwrite to replace it.`)
  }

  const nextWorkspace = updateWorkspaceConfig(
    existsSync(workspaceFile) ? readFileSync(workspaceFile, 'utf8') : undefined,
  )
  const currentWorkspace = existsSync(workspaceFile) ? readFileSync(workspaceFile, 'utf8') : undefined

  const wrotePatch = existingPatch !== VUE_LYNX_PATCH
  const wroteWorkspace = currentWorkspace !== nextWorkspace

  if (opts.dryRun) {
    log.step(`${wrotePatch ? 'write' : 'keep'} ${PATCH_PATH}`)
    log.step(`${wroteWorkspace ? 'update' : 'keep'} pnpm-workspace.yaml`)
    log.ok('Dry run complete. No files were changed.')
    return { root, patchFile, workspaceFile, wrotePatch, wroteWorkspace }
  }

  if (wrotePatch) {
    mkdirSync(dirname(patchFile), { recursive: true })
    writeFileSync(patchFile, VUE_LYNX_PATCH)
    log.ok(`Wrote ${c.cyan(PATCH_PATH)}`)
  }
  else {
    log.ok(`${c.cyan(PATCH_PATH)} is already up to date`)
  }

  if (wroteWorkspace) {
    writeFileSync(workspaceFile, nextWorkspace)
    log.ok(`Updated ${c.cyan('pnpm-workspace.yaml')}`)
  }
  else {
    log.ok(`${c.cyan('pnpm-workspace.yaml')} already contains ${c.cyan(PATCH_ENTRY)}`)
  }

  console.log(`
  Apply the patch: ${c.cyan('pnpm install')}
  Undo later: ${c.cyan(`delete ${PATCH_PATH} and remove ${PATCH_ENTRY} from pnpm-workspace.yaml`)}
`)

  return { root, patchFile, workspaceFile, wrotePatch, wroteWorkspace }
}

function findPnpmRoot(cwd: string): string {
  let dir = cwd
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml')) || existsSync(join(dir, 'pnpm-lock.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return cwd
    dir = parent
  }
}

function updateWorkspaceConfig(current: string | undefined): string {
  if (!current) {
    return `packages:\n  - '.'\npatchedDependencies:\n  ${PATCH_ENTRY}\n`
  }

  const normalized = current.endsWith('\n') ? current : `${current}\n`
  const existingEntry = new RegExp(`(^|\\n)\\s*vue-lynx@${escapeRegExp(VUE_LYNX_VERSION)}:\\s*.+(?:\\n|$)`)
  if (existingEntry.test(normalized)) return normalized

  const patchedDependencies = /^patchedDependencies:\s*$/m
  if (patchedDependencies.test(normalized)) {
    return normalized.replace(patchedDependencies, `patchedDependencies:\n  ${PATCH_ENTRY}`)
  }

  return `${normalized}patchedDependencies:\n  ${PATCH_ENTRY}\n`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
