import type { Page } from '@playwright/test'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

// Web-runtime smoke (issue #8, web tier): boots the docs-playground bundle in a
// bare host page — the same wiring as LynxPreview.vue — and drives it with real
// mouse events. Unit tests run against the Lynx test env, so this is the only
// coverage the web bundle + <lynx-view> integration gets.

const examplesDir = fileURLToPath(new URL('../../examples/docs-playground/src/examples', import.meta.url))
const toKebab = (name: string) => name.replace(/\.vue$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const exampleIds = readdirSync(examplesDir, { recursive: true, encoding: 'utf8' })
  .filter(f => f.endsWith('.vue'))
  .map(f => toKebab(f.split('/').pop()!))
  .sort()

const HOST = `<!doctype html>
<link rel="stylesheet" href="/lynx-runtime/static/css/client.css">
<body style="margin:0">
<script type="module">
  await import('/lynx-runtime/static/js/client.js')
  await customElements.whenDefined('lynx-view')
  const view = document.createElement('lynx-view')
  view.setAttribute('url', '/playground/main.web.bundle')
  view.setAttribute('transform-vw', '')
  view.setAttribute('transform-vh', '')
  view.globalProps = { example: new URLSearchParams(location.search).get('example') }
  view.browserConfig = { pixelRatio: 1, pixelWidth: 390, pixelHeight: 640 }
  view.style.cssText = 'display:block;width:390px;height:640px'
  view.addEventListener('load', () => { window.__lynx = 'load' })
  view.addEventListener('error', e => { window.__lynx = 'error: ' + (e.detail?.error?.message ?? 'unknown') })
  document.body.appendChild(view)
</script>
</body>`

async function mount(page: Page, example: string) {
  await page.route('**/__smoke__*', route => route.fulfill({ contentType: 'text/html', body: HOST }))
  await page.goto(`/__smoke__?example=${example}`)
  await expect
    .poll(() => page.evaluate(() => (window as { __lynx?: string }).__lynx), { timeout: 30_000 })
    .toBe('load')
}

test.describe('every example boots on the web runtime', () => {
  for (const id of exampleIds) {
    test(id, async ({ page }) => {
      await mount(page, id)
    })
  }
})

test('button-example renders its content', async ({ page }) => {
  await mount(page, 'button-example')
  await expect(page.getByText('Save draft')).toBeVisible()
  await expect(page.getByText('Continue with slot content')).toBeVisible()
})

test('tabs-example switches panels on tap', async ({ page }) => {
  await mount(page, 'tabs-example')
  await expect(page.getByText('Your account summary and recent activity.')).toBeVisible()
  await page.getByText('Security', { exact: true }).click()
  await expect(page.getByText('Passkeys, passwords, and signed-in devices.')).toBeVisible()
})
