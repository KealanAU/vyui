<script setup lang="ts">
import { ref } from 'vue'
import { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent, OverlayRoot } from '@vyui/core'
import AppHeader from './components/AppHeader.vue'
import Phase1 from './components/Phase1.vue'
import Phase2 from './components/Phase2.vue'
import Phase3 from './components/Phase3.vue'
import Phase4 from './components/Phase4.vue'
import Phase5 from './components/Phase5.vue'

const phase1Open = ref(true)
const phase2Open = ref(false)
const phase3Open = ref(false)
const phase4Open = ref(false)
const phase5Open = ref(false)
</script>

<template>
  <view :style="{ width: '100%', height: '100%', position: 'relative' }">
  <scroll-view scroll-orientation="vertical" :style="{ width: '100%', height: '100%', backgroundColor: '#f8fafc' }">


    <AppHeader />

    <view :style="{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }">

      <!-- Phase 1 -->
      <CollapsibleRoot v-model:open="phase1Open" :style="{
        borderRadius: '14px', overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: '1px', borderColor: '#e2e8f0',
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)'
      }">
        <CollapsibleTrigger :style="{
          paddingLeft: '18px', paddingRight: '18px', paddingTop: '16px', paddingBottom: '16px',
          backgroundColor: phase1Open ? '#f8fafc' : '#ffffff'
        }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
              <view :style="{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: '#eff6ff',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '18px' }">⚙</text>
              </view>
              <view :style="{ display: 'flex', flexDirection: 'column', gap: '2px' }">
                <text :style="{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }">Phase 1 — Primitives</text>
                <text :style="{ fontSize: '12px', color: '#64748b' }">Checkbox · Switch · Toggle · Tabs · more</text>
              </view>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
              <view :style="{
                width: '28px', height: '28px', borderRadius: '14px',
                backgroundColor: phase1Open ? '#3b82f6' : '#f1f5f9',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '12px', color: phase1Open ? '#fff' : '#64748b', fontWeight: '700' }">{{ phase1Open ? '▲' : '▼' }}</text>
              </view>
            </view>
          </view>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <view :style="{
            height: '1px', backgroundColor: '#e2e8f0', marginLeft: '18px', marginRight: '18px'
          }" />
          <view :style="{ padding: '18px' }">
            <Phase1 />
          </view>
        </CollapsibleContent>
      </CollapsibleRoot>

      <!-- Phase 2 -->
      <CollapsibleRoot v-model:open="phase2Open" :style="{
        borderRadius: '14px', overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: '1px', borderColor: '#e2e8f0',
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)'
      }">
        <CollapsibleTrigger :style="{
          paddingLeft: '18px', paddingRight: '18px', paddingTop: '16px', paddingBottom: '16px',
          backgroundColor: phase2Open ? '#f8fafc' : '#ffffff'
        }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
              <view :style="{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '18px' }">◈</text>
              </view>
              <view :style="{ display: 'flex', flexDirection: 'column', gap: '2px' }">
                <text :style="{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }">Phase 2 — Overlays</text>
                <text :style="{ fontSize: '12px', color: '#64748b' }">Dialog · AlertDialog · Popover · DropdownMenu · Select</text>
              </view>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
              <view :style="{
                width: '28px', height: '28px', borderRadius: '14px',
                backgroundColor: phase2Open ? '#3b82f6' : '#f1f5f9',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '12px', color: phase2Open ? '#fff' : '#64748b', fontWeight: '700' }">{{ phase2Open ? '▲' : '▼' }}</text>
              </view>
            </view>
          </view>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <view :style="{
            height: '1px', backgroundColor: '#e2e8f0', marginLeft: '18px', marginRight: '18px'
          }" />
          <view :style="{ padding: '18px' }">
            <Phase2 />
          </view>
        </CollapsibleContent>
      </CollapsibleRoot>

      <!-- Phase 3 -->
      <CollapsibleRoot v-model:open="phase3Open" :style="{
        borderRadius: '14px', overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: '1px', borderColor: '#e2e8f0',
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)'
      }">
        <CollapsibleTrigger :style="{
          paddingLeft: '18px', paddingRight: '18px', paddingTop: '16px', paddingBottom: '16px',
          backgroundColor: phase3Open ? '#f8fafc' : '#ffffff'
        }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
              <view :style="{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: '#fef3c7',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '18px' }">◇</text>
              </view>
              <view :style="{ display: 'flex', flexDirection: 'column', gap: '2px' }">
                <text :style="{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }">Phase 3 — Complex stateful</text>
                <text :style="{ fontSize: '12px', color: '#64748b' }">Combobox</text>
              </view>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
              <view :style="{
                width: '28px', height: '28px', borderRadius: '14px',
                backgroundColor: phase3Open ? '#3b82f6' : '#f1f5f9',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '12px', color: phase3Open ? '#fff' : '#64748b', fontWeight: '700' }">{{ phase3Open ? '▲' : '▼' }}</text>
              </view>
            </view>
          </view>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <view :style="{
            height: '1px', backgroundColor: '#e2e8f0', marginLeft: '18px', marginRight: '18px'
          }" />
          <view :style="{ padding: '18px' }">
            <Phase3 />
          </view>
        </CollapsibleContent>
      </CollapsibleRoot>

      <!-- Phase 4 -->
      <CollapsibleRoot v-model:open="phase4Open" :style="{
        borderRadius: '14px', overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: '1px', borderColor: '#e2e8f0',
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)'
      }">
        <CollapsibleTrigger :style="{
          paddingLeft: '18px', paddingRight: '18px', paddingTop: '16px', paddingBottom: '16px',
          backgroundColor: phase4Open ? '#f8fafc' : '#ffffff'
        }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
              <view :style="{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: '#fce7f3',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '18px' }">✦</text>
              </view>
              <view :style="{ display: 'flex', flexDirection: 'column', gap: '2px' }">
                <text :style="{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }">Phase 4 — Inputs &amp; feedback</text>
                <text :style="{ fontSize: '12px', color: '#64748b' }">PinInput · Toast</text>
              </view>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
              <view :style="{
                width: '28px', height: '28px', borderRadius: '14px',
                backgroundColor: phase4Open ? '#3b82f6' : '#f1f5f9',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '12px', color: phase4Open ? '#fff' : '#64748b', fontWeight: '700' }">{{ phase4Open ? '▲' : '▼' }}</text>
              </view>
            </view>
          </view>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <view :style="{
            height: '1px', backgroundColor: '#e2e8f0', marginLeft: '18px', marginRight: '18px'
          }" />
          <view :style="{ padding: '18px' }">
            <Phase4 />
          </view>
        </CollapsibleContent>
      </CollapsibleRoot>

      <!-- Phase 5 -->
      <CollapsibleRoot v-model:open="phase5Open" :style="{
        borderRadius: '14px', overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: '1px', borderColor: '#e2e8f0',
        boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)'
      }">
        <CollapsibleTrigger :style="{
          paddingLeft: '18px', paddingRight: '18px', paddingTop: '16px', paddingBottom: '16px',
          backgroundColor: phase5Open ? '#f8fafc' : '#ffffff'
        }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
              <view :style="{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: '#eef2ff',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '18px' }">◷</text>
              </view>
              <view :style="{ display: 'flex', flexDirection: 'column', gap: '2px' }">
                <text :style="{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }">Phase 5 — Mobile-native</text>
                <text :style="{ fontSize: '12px', color: '#64748b' }">Sheet · Swiper · SwipeAction · Draggable · Sortable · ScrollView · LazyComponent · FeedList</text>
              </view>
            </view>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
              <view :style="{
                width: '28px', height: '28px', borderRadius: '14px',
                backgroundColor: phase5Open ? '#3b82f6' : '#f1f5f9',
                alignItems: 'center', justifyContent: 'center'
              }">
                <text :style="{ fontSize: '12px', color: phase5Open ? '#fff' : '#64748b', fontWeight: '700' }">{{ phase5Open ? '▲' : '▼' }}</text>
              </view>
            </view>
          </view>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <view :style="{
            height: '1px', backgroundColor: '#e2e8f0', marginLeft: '18px', marginRight: '18px'
          }" />
          <view :style="{ padding: '18px' }">
            <Phase5 />
          </view>
        </CollapsibleContent>
      </CollapsibleRoot>

      <!-- Footer -->
      <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', paddingBottom: '20px', gap: '4px' }">
        <text :style="{ fontSize: '12px', color: '#94a3b8' }">vyui · Lynx + Vue 3</text>
        <text :style="{ fontSize: '11px', color: '#cbd5e1' }">iOS · Android · Web</text>
      </view>

    </view>
  </scroll-view>
  <!-- Teleport target for all Phase 2 overlay components (Dialog, Popover, etc.) -->
  <OverlayRoot />
  </view>
</template>
