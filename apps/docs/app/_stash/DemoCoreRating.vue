<script setup lang="ts">
import { ref } from 'vue'

const rating = ref(0)
const hovering = ref(0)
const submitted = ref(false)

function submit() {
  if (rating.value > 0) submitted.value = true
}

const labels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent']

const reviews = [
  { name: 'Alex R.', stars: 5, text: 'Absolutely love this app!' },
  { name: 'Sam K.', stars: 4, text: 'Works great, minor issues.' },
  { name: 'Jordan M.', stars: 5, text: 'Best in class, no contest.' },
]
</script>

<template>
  <div
    style="
      height: 100%;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    "
  >
    <!-- Header -->
    <div style="padding: 10px 14px 10px; border-bottom: 1px solid #f3f4f6;">
      <div style="font-size: 11px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">
        @vyui/core
      </div>
      <div style="font-size: 17px; font-weight: 700; color: #111827;">Rating</div>
    </div>

    <!-- App card -->
    <div style="padding: 14px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f3f4f6;">
      <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #42b883, #059669); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div>
        <div style="font-size: 14px; font-weight: 600; color: #111827;">Vy UI Demo</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 1px;">Developer Tools</div>
        <div style="display: flex; align-items: center; gap: 3px; margin-top: 3px;">
          <template v-for="n in 5" :key="n">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </template>
          <span style="font-size: 10px; color: #6b7280; margin-left: 3px;">4.8 · 2.4k ratings</span>
        </div>
      </div>
    </div>

    <!-- Rating prompt -->
    <div v-if="!submitted" style="padding: 14px; text-align: center; border-bottom: 1px solid #f3f4f6;">
      <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px;">Tap to rate this app</div>
      <div style="font-size: 11px; color: #9ca3af; margin-bottom: 12px; min-height: 14px;">
        {{ hovering > 0 ? labels[hovering] : (rating > 0 ? labels[rating] : 'How would you rate it?') }}
      </div>

      <!-- Stars -->
      <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 12px;">
        <button
          v-for="n in 5"
          :key="n"
          style="background: transparent; border: none; padding: 2px; cursor: pointer;"
          @mouseenter="hovering = n"
          @mouseleave="hovering = 0"
          @click="rating = n"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            :fill="(hovering > 0 ? n <= hovering : n <= rating) ? '#f59e0b' : 'none'"
            :stroke="(hovering > 0 ? n <= hovering : n <= rating) ? '#f59e0b' : '#d1d5db'"
            style="transition: fill 0.15s, stroke 0.15s;"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>

      <button
        style="
          padding: 8px 24px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600;
          transition: background 0.15s, opacity 0.15s;
        "
        :style="{
          background: rating > 0 ? '#42b883' : '#e5e7eb',
          color: rating > 0 ? 'white' : '#9ca3af',
          opacity: rating > 0 ? 1 : 0.7,
        }"
        :disabled="rating === 0"
        @click="submit"
      >
        Submit
      </button>
    </div>

    <!-- Submitted state -->
    <div v-else style="padding: 14px; text-align: center; border-bottom: 1px solid #f3f4f6;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#42b883" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #111827;">Thanks for rating!</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">{{ labels[rating] }} · {{ rating }} stars</div>
    </div>

    <!-- Reviews -->
    <div style="flex: 1; overflow: hidden; padding: 10px 14px 0;">
      <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">
        Recent Reviews
      </div>
      <div v-for="(r, i) in reviews" :key="i" style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
          <span style="font-size: 12px; font-weight: 600; color: #111827;">{{ r.name }}</span>
          <div style="display: flex; gap: 1px; margin-left: 4px;">
            <svg v-for="n in r.stars" :key="n" width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
        <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">{{ r.text }}</div>
      </div>
    </div>
  </div>
</template>
