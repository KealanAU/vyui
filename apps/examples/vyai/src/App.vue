<script setup lang="ts">
import { OverlayRoot } from '@vyui/core'
import ChatThread from './sections/ChatThread.vue'
import TopBar from './sections/TopBar.vue'
import Composer from './sections/Composer.vue'
import ConversationsDrawer from './components/ConversationsDrawer.vue'
import SettingsSheet from './components/SettingsSheet.vue'
import { useDrawer } from './composables/useDrawer'

const { open: drawerOpen, close: closeDrawer } = useDrawer()
</script>

<template>
  <!-- Root clips the shell's off-screen overhang when it slides right. -->
  <view class="w-full h-full bg-white relative overflow-hidden">
    <!-- Under-sheet menu, parked behind the shell on the left. -->
    <ConversationsDrawer />

    <!-- The whole app rides in an opaque shell that slides right to reveal the
         under-sheet. OverlayRoot stays the first child inside so portalled
         surfaces (island panels) render above the thread; the composer sits
         below the thread in flow so its keyboard spacer can push it up. -->
    <view class="vyai-shell flex flex-col" :class="drawerOpen ? 'vyai-shell--open' : ''">
      <OverlayRoot />

      <ChatThread class="w-full flex-1 min-h-0" />

      <TopBar />
      <Composer />

      <!-- Tap-to-close catch layer. Only mounted while the drawer is open, so
           it can't swallow taps when closed. Covers the slid-over shell (the
           visible app area on the right) — tapping it slides everything back.
           z-40 keeps it under the fixed top pills (z-50) so the burger still
           toggles. -->
      <view
        v-if="drawerOpen"
        class="absolute inset-0 z-40"
        @tap="closeDrawer"
      />
    </view>

    <!-- Settings sheet floats above the shell (z-60) so it covers the whole
         screen, including the slid-over app. -->
    <SettingsSheet />
  </view>
</template>
