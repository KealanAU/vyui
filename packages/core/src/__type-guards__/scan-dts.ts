// Regression guard for issue #10 — DOM types leaking into the emitted `.d.ts`.
//
// Lynx-native consumers compile without the DOM lib. Any DOM global that reaches
// `@vyui/core`'s public declarations (e.g. `HTMLElement`, `KeyboardEvent`) breaks
// their `tsc`. We can't fully drop the DOM lib from the *emit* config — internal
// web-fallback paths legitimately touch `window`/`ResizeObserver`/`offsetWidth`
// (see `shared/useSize.ts`) — so instead we assert
// on the artifact: the shipped `.d.ts` text must name no DOM type.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * DOM-global type names that must never appear in the public surface. Lynx
 * counterparts (`MouseEvent`/`TouchEvent` from `@lynx-js/types`, `MainThread.*`)
 * are intentionally excluded — they're qualified or Lynx-owned.
 */
const DOM_TYPE_TOKENS: readonly RegExp[] = [
  /(?<![.\w])HTML[A-Za-z]*Element\b/,
  /(?<![.\w])KeyboardEvent\b/,
  /(?<![.\w])Element\b/,
  /(?<![.\w])Window\b/,
  /(?<![.\w])Document\b/,
  /(?<![.\w])HTMLCollection\b/,
  /(?<![.\w])NodeList\b/,
  /(?<![.\w])querySelectorAll?\b/,
]

/**
 * Strip comments and string/template literals so prose that *mentions* a DOM
 * type ("`unknown`, not `HTMLElement` —") doesn't trip the scan. The negative
 * lookbehind on each token additionally skips member access (`MainThread.Element`).
 */
function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/`(?:\\.|[^`\\])*`/g, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '')
    .replace(/'(?:\\.|[^'\\])*'/g, '')
}

function walkDeclarations(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory())
      return walkDeclarations(full)
    return entry.name.endsWith('.d.ts') ? [full] : []
  })
}

export interface DomLeak {
  file: string
  token: string
  count: number
}

/** Scan every emitted `.d.ts` under `distDir` and return any DOM-type leaks. */
export function scanForDomLeaks(distDir: string): DomLeak[] {
  const leaks: DomLeak[] = []
  for (const file of walkDeclarations(distDir)) {
    const code = stripCommentsAndStrings(readFileSync(file, 'utf8'))
    for (const token of DOM_TYPE_TOKENS) {
      const matches = code.match(new RegExp(token.source, 'g'))
      if (matches)
        leaks.push({ file, token: token.source, count: matches.length })
    }
  }
  return leaks
}
