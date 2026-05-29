---
seo:
  title: Vy UI — Headless components for Vue-Lynx
  description: The component library for Vue-Lynx. Behavioral primitives and a styled kit for native iOS, Android, and web — from one Vue codebase.
---

::u-page-hero{class="hero-full-height"}
---
orientation: vertical
---
#headline
  :::div{class="inline-flex items-center gap-2 rounded-full badge-aurora text-(--color-ink) px-3 py-1 text-xs font-medium tracking-tight"}
  :u-icon{name="i-lucide-flask-conical" class="size-3.5"}
  Pre-alpha — expect breaking changes
  :::

#title
Headless components for Vue-Lynx.

#description
The component library for Vue-Lynx. Behavioral primitives, a styled kit, and native rendering across iOS, Android, and web — all from one Vue codebase. Pre-alpha. Shipping fast.
::

::u-page-section{class="border-t border-default"}
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

::u-page-section{class="border-t border-default"}
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
