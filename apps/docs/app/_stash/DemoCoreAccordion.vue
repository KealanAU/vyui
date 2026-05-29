<script setup lang="ts">
import { ref } from 'vue'

const items = [
  {
    q: 'What is @vyui/core?',
    a: 'Headless behavioral primitives for Vue-Lynx. State, gestures, and accessibility — zero styles included.',
  },
  {
    q: 'Can I use it without the kit?',
    a: 'Yes. Core is completely standalone. Bring your own CSS, Tailwind, or any styling system you prefer.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'iOS, Android via Lynx native rendering, and web via the Lynx web target.',
  },
  {
    q: 'Is it production ready?',
    a: 'Pre-alpha. APIs are stabilising fast. Follow the roadmap for release milestones.',
  },
]

const open = ref<number | null>(0)

function toggle(i: number) {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <div
    style="
      height: 100%;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      overflow: hidden;
    "
  >
    <!-- Header -->
    <div style="padding: 10px 14px 10px; border-bottom: 1px solid #f3f4f6;">
      <div style="font-size: 11px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">
        @vyui/core
      </div>
      <div style="font-size: 17px; font-weight: 700; color: #111827;">FAQ</div>
    </div>

    <!-- Accordion items -->
    <div style="overflow: hidden;">
      <div
        v-for="(item, i) in items"
        :key="i"
        style="border-bottom: 1px solid #f3f4f6;"
      >
        <!-- Trigger -->
        <button
          style="
            width: 100%; padding: 12px 14px;
            background: transparent; border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            text-align: left;
          "
          @click="toggle(i)"
        >
          <span
            style="font-size: 13px; font-weight: 500; line-height: 1.35; flex: 1;"
            :style="{ color: open === i ? '#42b883' : '#111827' }"
          >
            {{ item.q }}
          </span>
          <!-- Chevron -->
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"
            style="flex-shrink: 0; transition: transform 0.2s ease;"
            :style="{
              transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
              color: open === i ? '#42b883' : '#9ca3af',
            }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <!-- Content -->
        <div
          style="overflow: hidden; transition: max-height 0.25s ease, opacity 0.2s ease; padding: 0 14px;"
          :style="{
            maxHeight: open === i ? '100px' : '0px',
            opacity: open === i ? 1 : 0,
            paddingBottom: open === i ? '12px' : '0px',
          }"
        >
          <div style="font-size: 12px; color: #6b7280; line-height: 1.55;">
            {{ item.a }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
