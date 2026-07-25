<script setup lang="ts">
// Branded social card rendered to PNG at build time by nuxt-og-image.
// title/description are passed per-route via defineOgImage so each
// page gets its own card. Styles are inline because the renderer (takumi)
// supports only a flexbox/inline-style subset — no external CSS or classes.
withDefaults(defineProps<{ title?: string, description?: string }>(), {
  title: 'Vy UI',
  description: 'Headless, accessible components for Vue-Lynx.',
})
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '80px',
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #dcfce7 100%)',
      fontFamily: 'sans-serif',
    }"
  >
    <div :style="{ display: 'flex', alignItems: 'center', fontSize: '40px', fontWeight: 700, color: '#17191c' }">
      <div :style="{ width: '44px', height: '44px', backgroundColor: '#059669', borderRadius: '10px', marginRight: '20px' }" />
      Vy UI
    </div>

    <div :style="{ display: 'flex', flexDirection: 'column' }">
      <div :style="{ display: 'flex', fontSize: '72px', fontWeight: 800, color: '#17191c', lineHeight: 1.1 }">
        {{ title }}
      </div>
      <div :style="{ display: 'flex', fontSize: '34px', color: '#4c4c4c', marginTop: '24px' }">
        {{ description }}
      </div>
    </div>

    <div :style="{ display: 'flex', fontSize: '28px', color: '#059669', fontWeight: 600 }">
      vyui.dev — components for Vue-Lynx
    </div>
  </div>
</template>
