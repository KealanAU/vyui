import { queryCollection } from '@nuxt/content/server'

// RSS 2.0 feed for the changelog, served at /changelog.xml. Lets readers
// subscribe to @vyui/core + @vyui/kit releases. Entries come from the same
// `changelog` collection the /changelog page renders, newest first.
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function parseChangelogDate(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const date = new Date(`${value.trim()}T00:00:00Z`)
  return Number.isFinite(date.getTime()) ? date : undefined
}

function parseVersionOrder(version: unknown) {
  if (typeof version !== 'string') {
    return 0
  }

  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/)
  if (!match) {
    return 0
  }

  const [, major, minor, patch] = match
  return Number(major) * 1_000_000 + Number(minor) * 1_000 + Number(patch)
}

function getChangelogOrder(entry: { version?: unknown }) {
  return (
    (entry as { changelogOrder?: number }).changelogOrder
    ?? parseVersionOrder(entry.version)
  )
}

export default defineEventHandler(async (event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl as string
  const entries = (await queryCollection(event, 'changelog').all()).sort((a, b) => {
    const dateA = parseChangelogDate(a.date)?.getTime() ?? 0
    const dateB = parseChangelogDate(b.date)?.getTime() ?? 0

    if (dateA !== dateB) {
      return dateB - dateA
    }

    const orderA = getChangelogOrder(a)
    const orderB = getChangelogOrder(b)

    if (orderA !== orderB) {
      return orderB - orderA
    }

    return String(a.path).localeCompare(String(b.path))
  })

  const items = entries.map((entry) => {
    const link = `${siteUrl}/changelog`
    const guid = `${siteUrl}${entry.path}`
    const pubDate = parseChangelogDate(entry.date)?.toUTCString()
    const title = `@vyui/${entry.package} ${entry.version} — ${entry.title}`
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
${pubDate ? `      <pubDate>${pubDate}</pubDate>` : ''}
      <description>${escapeXml(entry.description ?? '')}</description>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vy UI — Changelog</title>
    <link>${siteUrl}/changelog</link>
    <description>Release notes for Vy UI — @vyui/core and @vyui/kit.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/changelog.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return xml
})
