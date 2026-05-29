<script setup lang="ts">
import { reactive } from 'vue'

const settings = reactive([
  { label: 'Push Notifications', description: 'Alerts for new messages', on: true, color: '#42b883' },
  { label: 'Location Services', description: 'While using the app', on: true, color: '#42b883' },
  { label: 'Background Refresh', description: 'Update content in background', on: false, color: '#42b883' },
  { label: 'Analytics', description: 'Share anonymous usage data', on: true, color: '#42b883' },
  { label: 'Dark Mode', description: 'Use dark appearance', on: false, color: '#42b883' },
])
</script>

<template>
  <div
    style="
      height: 100%;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      overflow: hidden;
    "
  >
    <!-- Page header -->
    <div style="background: #f9fafb; padding: 10px 14px 6px; border-bottom: 1px solid #e5e7eb;">
      <div style="font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">
        @vyui/kit
      </div>
      <div style="font-size: 17px; font-weight: 700; color: #111827;">
        Settings
      </div>
    </div>

    <!-- Rows -->
    <div style="padding: 10px 10px 0; display: flex; flex-direction: column; gap: 1px;">
      <div
        v-for="(item, i) in settings"
        :key="i"
        style="
          background: white;
          padding: 10px 12px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-radius: 4px;
        "
        :style="{
          borderRadius: i === 0 ? '10px 10px 4px 4px' : i === settings.length - 1 ? '4px 4px 10px 10px' : '4px',
        }"
      >
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ item.label }}
          </div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ item.description }}
          </div>
        </div>

        <!-- Switch -->
        <button
          style="
            flex-shrink: 0;
            width: 44px; height: 26px;
            border: none; border-radius: 13px;
            padding: 3px; cursor: pointer;
            transition: background 0.2s ease;
            display: flex; align-items: center;
          "
          :style="{ background: item.on ? item.color : '#d1d5db', justifyContent: item.on ? 'flex-end' : 'flex-start' }"
          @click="item.on = !item.on"
        >
          <div
            style="
              width: 20px; height: 20px;
              background: white;
              border-radius: 50%;
              box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.12);
              transition: transform 0.2s ease;
            "
          />
        </button>
      </div>
    </div>

    <!-- Hint -->
    <div style="padding: 8px 14px 0; font-size: 10px; color: #9ca3af; line-height: 1.4;">
      Label, description &amp; color props built in.
    </div>
  </div>
</template>
