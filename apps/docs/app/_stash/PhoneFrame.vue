<script setup lang="ts">
defineProps<{ dark?: boolean }>()
</script>

<template>
  <div class="relative shrink-0" style="width:224px">
    <div
      class="relative rounded-[52px]"
      style="
        background: linear-gradient(160deg, #3a3a3c 0%, #1c1c1e 45%, #111113 100%);
        padding: 10px;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0.13),
          inset 0 1px 0 rgba(255,255,255,0.07),
          0 40px 80px rgba(0,0,0,0.55),
          0 15px 30px rgba(0,0,0,0.35);
      "
    >
      <!-- silent switch -->
      <div class="absolute" style="left:-3px;top:66px;width:3px;height:16px;background:#111;border-radius:0 0 2px 2px;" />
      <!-- volume up -->
      <div class="absolute" style="left:-3px;top:92px;width:3px;height:36px;background:#111;border-radius:2px 0 0 2px;" />
      <!-- volume down -->
      <div class="absolute" style="left:-3px;top:138px;width:3px;height:36px;background:#111;border-radius:2px 0 0 2px;" />
      <!-- power -->
      <div class="absolute" style="right:-3px;top:128px;width:3px;height:58px;background:#111;border-radius:0 2px 2px 0;" />

      <!-- screen -->
      <div
        class="relative overflow-hidden flex flex-col"
        style="height:470px;border-radius:42px;"
        :style="{ background: dark ? '#0a0a0a' : 'white' }"
      >
        <!-- dynamic island -->
        <div
          class="absolute z-20 rounded-full"
          style="top:14px;left:50%;transform:translateX(-50%);width:96px;height:28px;background:#000;"
        />

        <!-- status bar -->
        <div
          class="absolute z-10 flex items-center justify-between px-6"
          style="top:0;left:0;right:0;height:52px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:600;"
          :style="{ color: dark ? 'rgba(255,255,255,0.9)' : '#000' }"
        >
          <span style="padding-top:2px;">9:41</span>
          <div class="flex items-center gap-1.5" style="padding-top:2px;">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
              <rect x="0" y="7" width="3" height="4" rx="1" opacity="0.3" />
              <rect x="4.5" y="4.5" width="3" height="6.5" rx="1" opacity="0.3" />
              <rect x="9" y="2" width="3" height="9" rx="1" opacity="0.6" />
              <rect x="13.5" y="0" width="3" height="11" rx="1" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 2.5C10.1 2.5 12 3.4 13.4 4.8L14.8 3.4C13 1.6 10.6.5 8 .5S3 1.6 1.2 3.4l1.4 1.4C4 3.4 5.9 2.5 8 2.5Z" opacity="0.3" />
              <path d="M8 5.5c1.4 0 2.6.6 3.5 1.5l1.4-1.4C11.5 4.1 9.9 3.5 8 3.5S4.5 4.1 3.1 5.6l1.4 1.4C5.4 6.1 6.6 5.5 8 5.5Z" opacity="0.6" />
              <circle cx="8" cy="10.5" r="1.5" />
            </svg>
            <div class="flex items-center gap-px">
              <div class="relative rounded-sm" style="width:22px;height:11px;border:1.5px solid currentColor;border-radius:3px;">
                <div class="absolute inset-0" style="left:2px;top:2px;bottom:2px;width:65%;background:currentColor;border-radius:1px;" />
              </div>
              <div style="width:2px;height:5px;background:currentColor;border-radius:0 2px 2px 0;opacity:0.35;" />
            </div>
          </div>
        </div>

        <!-- content slot -->
        <div class="absolute overflow-hidden" style="top:52px;left:0;right:0;bottom:20px;">
          <slot />
        </div>

        <!-- home indicator -->
        <div
          class="absolute rounded-full"
          style="bottom:7px;left:50%;transform:translateX(-50%);width:100px;height:4px;"
          :style="{ background: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)' }"
        />
      </div>
    </div>
  </div>
</template>
