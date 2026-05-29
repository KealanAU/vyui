<script setup lang="ts">
import { ref } from 'vue'

const tabs = ['Songs', 'Albums', 'Artists']
const active = ref(0)

const content = {
  0: [
    { title: 'Blinding Lights', sub: 'The Weeknd · 3:22' },
    { title: 'Levitating', sub: 'Dua Lipa · 3:23' },
    { title: 'Stay', sub: 'The Kid LAROI · 2:21' },
    { title: 'Bad Guy', sub: 'Billie Eilish · 3:14' },
  ],
  1: [
    { title: 'After Hours', sub: 'The Weeknd · 2020' },
    { title: 'Future Nostalgia', sub: 'Dua Lipa · 2020' },
    { title: 'When We All Fall Asleep', sub: 'Billie Eilish · 2019' },
  ],
  2: [
    { title: 'The Weeknd', sub: '84.2M monthly listeners' },
    { title: 'Dua Lipa', sub: '62.1M monthly listeners' },
    { title: 'Billie Eilish', sub: '71.5M monthly listeners' },
    { title: 'Taylor Swift', sub: '92.1M monthly listeners' },
  ],
} as Record<number, { title: string; sub: string }[]>
</script>

<template>
  <div
    style="
      height: 100%;
      background: #0f0f0f;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    "
  >
    <!-- App header -->
    <div style="padding: 10px 14px 8px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 11px; color: #42b883; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;">@vyui/kit</div>
        <div style="font-size: 18px; font-weight: 700; color: white; line-height: 1.2;">Library</div>
      </div>
      <div style="width: 30px; height: 30px; border-radius: 50%; background: #1f1f1f; display: flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>
    </div>

    <!-- Pill tabs -->
    <div style="padding: 0 12px 8px;">
      <div style="position: relative; background: #1a1a1a; border-radius: 10px; padding: 4px; display: flex; flex-direction: row;">
        <!-- Indicator -->
        <div
          style="
            position: absolute;
            top: 4px; bottom: 4px;
            border-radius: 7px;
            background: #42b883;
            transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          "
          :style="{
            left: `calc(${active} * (100% / 3) + 4px)`,
            width: 'calc(100% / 3 - 8px)',
          }"
        />
        <button
          v-for="(tab, i) in tabs"
          :key="tab"
          style="
            flex: 1; position: relative; z-index: 1;
            border: none; background: transparent;
            padding: 6px 0; border-radius: 7px;
            font-size: 12px; font-weight: 600; cursor: pointer;
            transition: color 0.2s;
          "
          :style="{ color: active === i ? 'white' : '#6b7280' }"
          @click="active = i"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div style="flex: 1; overflow: hidden; padding: 0 12px;">
      <div
        v-for="(item, j) in content[active]"
        :key="`${active}-${j}`"
        style="
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid #1f1f1f;
        "
      >
        <div
          style="
            width: 36px; height: 36px; border-radius: 8px;
            flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 700; color: white;
          "
          :style="{ background: `hsl(${(j * 67 + active * 40) % 360}, 55%, 35%)` }"
        >
          {{ item.title[0] }}
        </div>
        <div style="min-width: 0;">
          <div style="font-size: 13px; font-weight: 500; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.title }}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.sub }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
