---
seo:
  title: Vy UI — Headless components for Vue-Lynx
  description: Radix-style primitives and an opinionated styled kit for ByteDance's Vue-Lynx. Pre-alpha.
---

::u-page-hero{class="bg-gradient-to-b from-(--color-warm-mist)/40 to-canvas dark:bg-none"}
---
orientation: vertical
---
#headline
  :::div{class="inline-flex items-center gap-2 rounded-full bg-(--color-warm-mist) text-(--color-terracotta) px-3 py-1 text-xs font-medium tracking-tight"}
  :u-icon{name="i-lucide-flask-conical" class="size-3.5"}
  Pre-alpha — expect breaking changes
  :::

#title
Headless components for Vue-Lynx.

#description
Vy UI brings Radix-style primitives and an opinionated styled kit to ByteDance's native cross-platform framework. The packages exist, the demos run, and most things are still broken. This page is a preview of what's being built.

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/KealanAU/vyui
  target: _blank
  ---
  Star on GitHub
  :::
::

::u-page-section{class="border-t border-default"}
#headline
Packages

#title
Two layers, one ecosystem

#description
Pick the level of opinion you want. Drop down to primitives whenever you need to.

#features
  :::u-page-feature
  ---
  icon: i-lucide-box
  ---
  #title
  @vyui/core — Headless

  #description
  47 behavioral primitives — Dialog, Sheet, Popover, Combobox, Slider, Swiper, Sortable, and more. State, focus, keyboard, gestures. You bring the styles.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  @vyui/kit — Styled

  #description
  44 styled components on top of @vyui/core — VyButton, VyDrawer, VyModal, VyToast, VyIsland, and more. Themeable via Tailwind Variants and an app-config object.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-blocks
  ---
  #title
  Mix them freely

  #description
  Kit re-exports everything you need from core. Start with kit, drop down to primitives anywhere you need bespoke styling.
  :::
::

::u-page-section{class="border-t border-default bg-(--color-fog)"}
#headline
Targets

#title
One codebase, three targets

#description
Vue-Lynx is ByteDance's open-source native cross-platform framework — the same one powering parts of TikTok.

#features
  :::u-page-feature
  ---
  icon: i-simple-icons-apple
  ---
  #title
  iOS

  #description
  Native UIView rendering via Lynx Explorer or your own LynxView host.
  :::

  :::u-page-feature
  ---
  icon: i-simple-icons-android
  ---
  #title
  Android

  #description
  Native View rendering — ship inside your Android app via the Lynx runtime.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-globe
  ---
  #title
  Web

  #description
  Lynx Web target compiles to a browser bundle for previews and progressive rollouts.
  :::
::

::u-page-section{class="border-t border-default"}
  :::u-page-c-t-a
  ---
  title: Component docs are on the way
  description: A per-component reference with props, slots, events, and live demos is the next thing being built. Until then, the source is the documentation.
  variant: subtle
  links:
    - label: Read the docs
      to: /getting-started
      trailingIcon: i-lucide-arrow-right
    - label: Browse on GitHub
      to: https://github.com/KealanAU/vyui
      target: _blank
      variant: outline
      color: neutral
      icon: i-simple-icons-github
  ---
  :::
::
