import { execSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Emits <loc> + <lastmod> for every docs markdown file so search engines get a
// freshness signal and recrawl changed pages sooner. lastmod = date of the last
// git commit touching the file. @nuxtjs/sitemap merges these onto its
// auto-discovered routes by loc; routes without a 1:1 source file (/, /changelog)
// keep their default lastmod-less entry. Files that 404 have no .md here, so they
// are never added.
export default defineSitemapEventHandler(() => {
  const contentDir = resolve(process.cwd(), 'content')

  const files = readdirSync(contentDir, { recursive: true, encoding: 'utf8' })
    .filter(file => file.endsWith('.md'))
    // Root index is the landing page; changelog entries aren't per-file routes.
    .filter(file => file !== 'index.md' && !file.startsWith('changelog'))

  return files.map((file) => {
    const loc = '/' + file
      .replace(/\.md$/, '')
      .split('/')
      .map(seg => seg.replace(/^\d+\./, '')) // strip @nuxt/content order prefix
      .filter(seg => seg !== 'index') // index.md maps to its parent path
      .join('/')

    let lastmod = ''
    try {
      lastmod = execSync(`git log -1 --format=%cI -- "${file}"`, {
        cwd: contentDir,
        encoding: 'utf8',
      }).trim()
    }
    catch {
      // Untracked/new file or git unavailable — omit lastmod for this entry.
    }

    return lastmod ? { loc, lastmod } : { loc }
  })
})
