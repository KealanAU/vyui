# Docs playground

This app powers the real Lynx previews embedded in the component documentation.
It is separate from the Nuxt docs app so examples are compiled by Rspeedy in
the same shape as a consumer's Vue-Lynx application.

## How it works

1. Rspeedy builds the example registry as both `main.web.bundle` and
   `main.lynx.bundle`.
2. `tools/sync-playground.ts` copies the web bundle and the prebuilt Lynx web
   runtime into `apps/docs/public/`.
3. The sync script also generates `apps/docs/app/generated/examples.ts` from
   the example SFCs so the Code tab always displays the source used by Preview.
4. `ComponentCode.vue` renders `LynxPreview.vue`, which creates a real
   `<lynx-view>` and selects an example through `globalProps.example`.

The docs app intentionally serves the production files from
`@lynx-js/web-core` without passing them through Nuxt/Vite. The runtime loads
worker chunks and WebAssembly by relative URL; rebundling it can break those
asset paths.

## Add an example

1. Add a Vue SFC under `src/examples/<component>/`.
2. Register its kebab-case id in `src/examples/index.ts`.
3. Embed it in an MDC page:

   ```md
   ::component-code
   ---
   name: accordion-example
   height: 360px
   ---
   ::
   ```

4. Build and sync the playground:

   ```bash
   pnpm --filter @vyui/docs playground:build
   ```

The docs app runs this automatically before `dev`, `build`, and `generate`.

## Version compatibility

The current tested combination is:

- `vue-lynx` 0.4.x
- `@lynx-js/rspeedy` 0.13.x
- `@lynx-js/web-core` 0.20.4
- `@lynx-js/lynx-core` 0.1.3

Keep `web-core` and `lynx-core` compatible, and import the web runtime through
`@lynx-js/web-core/client`. With `web-core` 0.20 and later, do not separately
install or import `@lynx-js/web-elements`.

## Preview policy

Use the real web runtime whenever the component and its example use APIs
supported by Lynx for Web. It gives readers an interactive preview while
keeping the example valid for native Lynx builds.

The web runtime is not a substitute for testing iOS and Android. For an example
that depends on native-only APIs, show its source and provide a Lynx Explorer
or device path. An abstract browser recreation is acceptable as a clearly
labelled fallback, but should not be presented as the component's actual Lynx
rendering.

This mirrors the official Lynx documentation's broad approach: compile real
example packages, show their source beside a web preview, and offer Lynx
Explorer for native verification.
