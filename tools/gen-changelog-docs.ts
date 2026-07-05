// Keeps the docs changelog timeline (apps/docs/content/changelog) in sync with
// the published package versions.
//
// changeset version bumps packages/*/package.json and writes the per-package
// CHANGELOG.md, but nothing feeds the docs site's hand-maintained changelog
// collection — so the /changelog page silently lags every release. This script
// emits a docs entry for the current version of each tracked package.
//
// It is generate-if-missing and never overwrites: a hand-curated entry for a
// version wins, and this only backfills the ones nobody wrote. Run it after
// changeset version (wired into the `version-packages` script).
//
// Usage:
//   tsx tools/gen-changelog-docs.ts            # write missing entries
//   tsx tools/gen-changelog-docs.ts --dry-run  # print what would be written
//   tsx tools/gen-changelog-docs.ts --all      # backfill every CHANGELOG version

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(REPO_ROOT, 'apps/docs/content/changelog')

// Tracked packages -> the `package` enum used by the docs changelog collection.
const PACKAGES = [
  { dir: 'packages/core', key: 'core' },
  { dir: 'packages/kit', key: 'kit' },
] as const

const flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')))
const dryRun = flags.has('--dry-run')
const all = flags.has('--all')

interface Block {
  version: string
  body: string
}

// Split a CHANGELOG.md into its `## <version>` sections, newest first.
function parseChangelog(md: string): Block[] {
  // Each section runs from a `## x.y.z` heading to the next one (or EOF).
  return md
    .split(/^## (?=\d+\.\d+\.\d+)/m)
    .slice(1) // drop the leading `# @vyui/pkg` preamble
    .map((section) => {
      const nl = section.indexOf('\n')
      return {
        version: section.slice(0, nl).trim(),
        body: section.slice(nl + 1).trim(),
      }
    })
    .filter((b) => /^\d+\.\d+\.\d+$/.test(b.version))
}

// First human-readable sentence of a changelog block, for the SEO description.
function deriveDescription(body: string): string {
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    // Skip section headings, the changesets dependency-bump bullets, and blanks.
    if (!line || line.startsWith('#') || line.startsWith('- Updated dependencies')) continue
    const text = line
      .replace(/^[-*]\s+/, '') // bullet marker
      .replace(/\(\[[^\]]*\]\([^)]*\)\)/g, '') // trailing ([#12](url)) PR refs
      .replace(/[*`]/g, '') // bold/code markers
      .trim()
    if (!text) continue
    const sentence = text.split(/(?<=\.)\s/)[0].trim()
    return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence
  }
  return 'Release notes.'
}

function entryPath(key: string, version: string): string {
  return path.join(DOCS_DIR, `${key}-${version}.md`)
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}

function versionOrder(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number)
  return major * 1_000_000 + minor * 1_000 + patch
}

// True if any docs file already documents this package@version, regardless of
// filename — so a hand-curated entry (even one named differently) is respected.
function alreadyDocumented(key: string, version: string): boolean {
  if (fs.existsSync(entryPath(key, version))) return true
  const tag = `v${version}`
  for (const file of fs.readdirSync(DOCS_DIR)) {
    if (!file.endsWith('.md')) continue
    const fm = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8').slice(0, 400)
    if (fm.includes(`package: ${key}`) && fm.includes(`version: ${tag}`)) return true
  }
  return false
}

function render(key: string, block: Block, date: string): string {
  const title = `@vyui/${key} v${block.version}`
  const description = deriveDescription(block.body)
  return `---
title: ${yamlString(title)}
description: ${yamlString(description)}
date: ${yamlString(date)}
package: ${key}
version: ${yamlString(`v${block.version}`)}
changelogOrder: ${versionOrder(block.version)}
---

${block.body}
`
}

const today = new Date().toISOString().slice(0, 10)
let written = 0

for (const pkg of PACKAGES) {
  const changelogPath = path.join(REPO_ROOT, pkg.dir, 'CHANGELOG.md')
  if (!fs.existsSync(changelogPath)) continue

  const blocks = parseChangelog(fs.readFileSync(changelogPath, 'utf8'))
  // Default: only the latest (top) version. --all backfills the full history.
  const targets = all ? blocks : blocks.slice(0, 1)

  for (const block of targets) {
    if (alreadyDocumented(pkg.key, block.version)) continue
    const dest = entryPath(pkg.key, block.version)
    const contents = render(pkg.key, block, today)
    if (dryRun) {
      console.log(`would write ${path.relative(REPO_ROOT, dest)}`)
    } else {
      fs.writeFileSync(dest, contents)
      console.log(`wrote ${path.relative(REPO_ROOT, dest)}`)
    }
    written++
  }
}

if (written === 0) console.log('changelog docs already in sync')
