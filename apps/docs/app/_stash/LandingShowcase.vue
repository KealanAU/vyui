<template>
  <section style="border-top: 1px solid var(--ui-border); overflow: hidden;">
    <div class="max-w-7xl mx-auto px-4 py-20 sm:py-28">
      <!-- Heading -->
      <div class="text-center mb-16">
        <p class="text-xs font-semibold tracking-widest uppercase text-(--color-vue) mb-3">
          Components
        </p>
        <h2 class="text-3xl sm:text-4xl font-bold text-(--color-ink) tracking-tight">
          See it running.
        </h2>
        <p class="mt-3 text-base text-(--color-hint-of-grey) max-w-lg mx-auto">
          Two layers — a styled kit and headless primitives. Every interaction works across iOS, Android, and web.
        </p>
      </div>

      <!-- Phone grid -->
      <div class="flex gap-5 justify-center items-start overflow-x-auto pb-6" style="scrollbar-width: none;">
        <!-- Kit → Switch -->
        <div class="flex flex-col items-center gap-4 shrink-0">
          <PhoneFrame>
            <DemoKitSwitch />
          </PhoneFrame>
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-vue-100) text-(--color-vue-700)">
              @vyui/kit
            </span>
            <p class="mt-1.5 text-xs font-semibold text-(--color-ink)">Switch</p>
          </div>
        </div>

        <!-- Kit → Tabs (shifted down) -->
        <div class="flex flex-col items-center gap-4 shrink-0 mt-10">
          <PhoneFrame :dark="true">
            <DemoKitTabs />
          </PhoneFrame>
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-vue-100) text-(--color-vue-700)">
              @vyui/kit
            </span>
            <p class="mt-1.5 text-xs font-semibold text-(--color-ink)">Tabs</p>
          </div>
        </div>

        <!-- Core → Accordion -->
        <div class="flex flex-col items-center gap-4 shrink-0">
          <PhoneFrame>
            <DemoCoreAccordion />
          </PhoneFrame>
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-ink-100) text-(--color-ink-600)">
              @vyui/core
            </span>
            <p class="mt-1.5 text-xs font-semibold text-(--color-ink)">Accordion</p>
          </div>
        </div>

        <!-- Core → Rating (shifted down) -->
        <div class="flex flex-col items-center gap-4 shrink-0 mt-10">
          <PhoneFrame>
            <DemoCoreRating />
          </PhoneFrame>
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-ink-100) text-(--color-ink-600)">
              @vyui/core
            </span>
            <p class="mt-1.5 text-xs font-semibold text-(--color-ink)">Rating</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
