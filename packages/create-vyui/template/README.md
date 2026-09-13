# my-vyui-app

Vue-Lynx + Vy UI starter, scaffolded with `create-vyui`. Tailwind preset,
worklet allowlist, theme providers, and overlay hosts are already wired.

## Develop

```bash
npm run dev
```

Scan the printed QR with Lynx Go for on-device preview, or open the printed
`main.web.bundle` URL for the web preview.

## Theme

Edit `vyui.config.ts` — the same object feeds the Tailwind preset (class
generation) and `provideVyUI` (runtime selection), so they cannot drift.

## Add components

Import more styled components from their deep entries (keeps native bundles
small):

```vue
<script setup>
import { VyButton } from '@vyui/kit/button'
</script>
```

Or copy component source into this repo with the shadcn-style CLI:

```bash
npx @vyui/cli init
npx @vyui/cli add button
```
