<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Icon,
  CheckboxRoot,
  CheckboxIndicator,
  SwitchRoot,
  SwitchThumb,
  ToggleRoot,
  ToggleGroupRoot,
  ToggleGroupItem,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupIndicator,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
  ProgressRoot,
  ProgressIndicator,
  SliderRoot,
  SliderTrack,
  SliderRange,
  SliderThumb,
  StepperRoot,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  PaginationRoot,
  PaginationListItem,
  PaginationPrev,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
  RatingRoot,
  RatingItem,
  RatingItemIndicator,
} from '@vyui/core'
import { transform, getRange } from '@/components/Pagination/utils'
import {  ACCENT, ACCENT_LIGHT, DemoCard, DemoLabel, DemoBadge, DemoSwitcher } from './_shared'

const checked = ref(false)
const switchOn = ref(false)
const toggled = ref(false)
const toggleGroup = ref<string[]>(['B'])
const radio = ref('b')
const activeTab = ref('tab1')
const collapsibleOpen = ref(false)
const progress = ref(68)
const sliderValue = ref([40])
const stepperValue = ref(2)
const ratingValue = ref(3)
const paginationPage = ref(1)
const paginationPageCount = computed(() => Math.max(1, Math.ceil(50 / 5)))
const paginationItems = computed(() =>
  transform(getRange(paginationPage.value, paginationPageCount.value, 1, true)),
)

const showComponent = ref(0)
const CARDS = 14
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', gap: '12px', alignSelf: 'stretch' }">
    <DemoSwitcher v-model="showComponent" :total="CARDS" />


    <text :style="{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '4px' }">
      Primitives ship unstyled — minimal shapes below are added by this demo.
    </text>

    <!-- Icon -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 1">
      <DemoLabel>ICON</DemoLabel>

      <text :style="{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px' }">SIMPLE-ICONS (brand)</text>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: '10px' }">
        <view
          v-for="brand in [
            { name: 'simple-icons:bytedance', label: 'ByteDance', color: '#0f172a' },
            { name: 'simple-icons:tiktok', label: 'TikTok', color: '#000000' },
            { name: 'simple-icons:byte', label: 'Byte', color: '#1c5cff' },
          ]"
          :key="brand.name"
          :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '76px' }"
        >
          <view :style="{
            width: '56px', height: '56px', borderRadius: '14px',
            backgroundColor: '#f8fafc', borderWidth: '1px', borderColor: '#e2e8f0',
            alignItems: 'center', justifyContent: 'center',
          }">
            <Icon :name="brand.name" :size="32" :color="brand.color" />
          </view>
          <text :style="{ fontSize: '11px', fontWeight: '600', color: '#0f172a' }">{{ brand.label }}</text>
        </view>
      </view>

      <view :style="{ height: '1px', backgroundColor: '#e2e8f0', marginTop: '4px', marginBottom: '4px' }" />

      <text :style="{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px' }">LUCIDE (bundled)</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }">
        <view
          v-for="ico in [
            { name: 'i-lucide-home', label: 'home', color: '#0f172a' },
            { name: 'i-lucide-search', label: 'search', color: '#0f172a' },
            { name: 'i-lucide-settings', label: 'settings', color: '#0f172a' },
            { name: 'i-lucide-bell', label: 'bell', color: '#0f172a' },
            { name: 'i-lucide-heart', label: 'heart', color: '#ef4444' },
            { name: 'i-lucide-star', label: 'star', color: '#f59e0b' },
            { name: 'i-lucide-check', label: 'check', color: '#10b981' },
            { name: 'i-lucide-x', label: 'x', color: '#ef4444' },
          ]"
          :key="ico.name"
          :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '56px' }"
        >
          <view :style="{
            width: '40px', height: '40px', borderRadius: '8px',
            backgroundColor: '#f8fafc', borderWidth: '1px', borderColor: '#e2e8f0',
            alignItems: 'center', justifyContent: 'center',
          }">
            <Icon :name="ico.name" :size="20" :color="ico.color" />
          </view>
          <text :style="{ fontSize: '10px', color: '#94a3b8' }">{{ ico.label }}</text>
        </view>
      </view>

      <text :style="{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px', marginTop: '4px' }">SIZES</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
        <Icon name="i-lucide-zap" :size="16" :color="ACCENT" />
        <Icon name="i-lucide-zap" :size="24" :color="ACCENT" />
        <Icon name="i-lucide-zap" :size="32" :color="ACCENT" />
        <Icon name="i-lucide-zap" :size="48" :color="ACCENT" />
      </view>

      <DemoBadge :color="ACCENT">Iconify · SVG → &lt;image&gt;</DemoBadge>
    </DemoCard>

    <!-- Checkbox -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 2">
      <DemoLabel>CHECKBOX</DemoLabel>
      <CheckboxRoot v-model="checked" :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
        <view :style="{
          width: '22px', height: '22px', borderRadius: '6px', borderWidth: '2px',
          borderColor: checked ? ACCENT : '#cbd5e1',
          backgroundColor: checked ? ACCENT : '#fff',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: checked ? '0px 1px 3px rgba(59, 130, 246, 0.3)' : '0px 1px 3px rgba(15, 23, 42, 0.08)',
        }">
          <CheckboxIndicator>
            <text :style="{ fontSize: '13px', fontWeight: '700', color: '#fff' }">✓</text>
          </CheckboxIndicator>
        </view>
        <text :style="{ fontSize: '15px', color: '#0f172a' }">Accept terms &amp; conditions</text>
      </CheckboxRoot>
      <DemoBadge :color="checked ? ACCENT : '#64748b'">
        {{ checked ? 'Checked' : 'Unchecked' }}
      </DemoBadge>
    </DemoCard>

    <!-- Switch -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 3">
      <DemoLabel>SWITCH</DemoLabel>
      <SwitchRoot v-model="switchOn" :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }">
        <view :style="{
          width: '48px', height: '28px', borderRadius: '14px',
          backgroundColor: switchOn ? ACCENT : '#e2e8f0',
          justifyContent: 'center', padding: '3px',
          boxShadow: switchOn ? '0px 1px 3px rgba(59, 130, 246, 0.3)' : '0px 1px 3px rgba(15, 23, 42, 0.06)',
        }">
          <SwitchThumb :style="{
            width: '22px', height: '22px', borderRadius: '11px',
            backgroundColor: '#fff',
            marginLeft: switchOn ? '20px' : '0px',
            boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.15)',
          }" />
        </view>
        <text :style="{ fontSize: '15px', color: '#0f172a' }">Push notifications</text>
      </SwitchRoot>
      <DemoBadge :color="switchOn ? '#10b981' : '#64748b'">
        {{ switchOn ? 'On' : 'Off' }}
      </DemoBadge>
    </DemoCard>

    <!-- Toggle -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 4">
      <DemoLabel>TOGGLE</DemoLabel>
      <ToggleRoot v-model="toggled" :style="{
        paddingLeft: '16px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px',
        borderWidth: '2px',
        borderColor: toggled ? ACCENT : '#e2e8f0',
        backgroundColor: toggled ? ACCENT_LIGHT : '#f8fafc',
        borderRadius: '8px', alignSelf: 'flex-start',
      }">
        <text :style="{ fontSize: '15px', fontWeight: toggled ? '700' : '500', color: toggled ? ACCENT : '#64748b' }">Bold</text>
      </ToggleRoot>
      <DemoBadge :color="toggled ? ACCENT : '#64748b'">
        {{ toggled ? 'Pressed' : 'Unpressed' }}
      </DemoBadge>
    </DemoCard>

    <!-- Toggle Group -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 5">
      <DemoLabel>TOGGLE GROUP</DemoLabel>
      <ToggleGroupRoot v-model="toggleGroup" type="multiple" :style="{ display: 'flex', flexDirection: 'row', gap: '6px' }">
        <ToggleGroupItem
          v-for="item in ['B', 'I', 'U', 'S']"
          :key="item"
          :value="item"
          :style="{
            width: '40px', height: '40px', borderRadius: '8px', borderWidth: '2px',
            borderColor: toggleGroup.includes(item) ? ACCENT : '#e2e8f0',
            backgroundColor: toggleGroup.includes(item) ? ACCENT_LIGHT : '#f8fafc',
            alignItems: 'center', justifyContent: 'center',
          }"
        >
          <text :style="{
            fontSize: '15px',
            fontWeight: toggleGroup.includes(item) ? '700' : '500',
            color: toggleGroup.includes(item) ? ACCENT : '#94a3b8',
          }">{{ item }}</text>
        </ToggleGroupItem>
      </ToggleGroupRoot>
      <DemoBadge>
        Active: {{ toggleGroup.join(', ') || 'none' }}
      </DemoBadge>
    </DemoCard>

    <!-- Radio Group -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 6">
      <DemoLabel>RADIO GROUP</DemoLabel>
      <RadioGroupRoot v-model="radio" :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
        <view
          v-for="opt in [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }, { value: 'c', label: 'Option C' }]"
          :key="opt.value"
          :style="{
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px',
            paddingTop: '8px', paddingBottom: '8px', paddingLeft: '10px', paddingRight: '10px',
            borderRadius: '8px',
            backgroundColor: radio === opt.value ? ACCENT_LIGHT : 'transparent',
          }"
        >
          <RadioGroupItem
            :value="opt.value"
            :style="{
              width: '20px', height: '20px', borderRadius: '10px', borderWidth: '2px',
              borderColor: radio === opt.value ? ACCENT : '#cbd5e1',
              alignItems: 'center', justifyContent: 'center',
            }"
          >
            <RadioGroupIndicator>
              <view :style="{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: ACCENT }" />
            </RadioGroupIndicator>
          </RadioGroupItem>
          <text :style="{ fontSize: '15px', fontWeight: radio === opt.value ? '600' : '400', color: radio === opt.value ? '#0f172a' : '#64748b' }">{{ opt.label }}</text>
        </view>
      </RadioGroupRoot>
      <DemoBadge :color="ACCENT">
        {{ radio.toUpperCase() }}
      </DemoBadge>
    </DemoCard>

    <!-- Tabs -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 7">
      <DemoLabel>TABS</DemoLabel>
      <TabsRoot v-model="activeTab">
        <TabsList>
          <view :style="{
            display: 'flex', flexDirection: 'row', gap: '2px',
            backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '3px',
          }">
            <TabsTrigger
              v-for="tab in [{ value: 'tab1', label: 'Account' }, { value: 'tab2', label: 'Password' }, { value: 'tab3', label: 'Settings' }]"
              :key="tab.value"
              :value="tab.value"
              :style="{
                flex: 1,
                paddingTop: '7px', paddingBottom: '7px',
                borderRadius: '8px',
                alignItems: 'center',
                backgroundColor: activeTab === tab.value ? '#ffffff' : 'transparent',
                boxShadow: activeTab === tab.value ? '0px 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              }"
            >
              <text :style="{
                fontSize: '13px',
                fontWeight: activeTab === tab.value ? '700' : '500',
                color: activeTab === tab.value ? '#0f172a' : '#94a3b8',
              }">{{ tab.label }}</text>
            </TabsTrigger>
          </view>
        </TabsList>
        <view :style="{ marginTop: '12px', paddingLeft: '4px', paddingRight: '4px' }">
          <TabsContent value="tab1"><text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">Manage your account settings and preferences.</text></TabsContent>
          <TabsContent value="tab2"><text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">Change your password and security settings.</text></TabsContent>
          <TabsContent value="tab3"><text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">Configure app preferences and notifications.</text></TabsContent>
        </view>
      </TabsRoot>
      <DemoBadge :color="ACCENT">{{ activeTab }}</DemoBadge>
    </DemoCard>

    <!-- Collapsible -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 8">
      <DemoLabel>COLLAPSIBLE</DemoLabel>
      <CollapsibleRoot v-model:open="collapsibleOpen" :style="{ borderWidth: '1px', borderColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }">
        <CollapsibleTrigger :style="{
          paddingLeft: '14px', paddingRight: '14px', paddingTop: '12px', paddingBottom: '12px',
          backgroundColor: collapsibleOpen ? '#f8fafc' : '#fff',
        }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }">
              <view :style="{
                width: '6px', height: '6px', borderRadius: '3px',
                backgroundColor: collapsibleOpen ? ACCENT : '#cbd5e1',
              }" />
              <text :style="{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }">Release notes v0.1.0</text>
            </view>
            <text :style="{ color: '#94a3b8', fontSize: '12px' }">{{ collapsibleOpen ? '▲' : '▼' }}</text>
          </view>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <view :style="{ height: '1px', backgroundColor: '#e2e8f0' }" />
          <view :style="{ display: 'flex', flexDirection: 'column', paddingLeft: '14px', paddingRight: '14px', paddingTop: '12px', paddingBottom: '12px', gap: '8px' }">
            <text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">· Phase 1 components complete</text>
            <text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">· Lynx tap events wired throughout</text>
            <text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">· accessibility-traits on all interactive elements</text>
          </view>
        </CollapsibleContent>
      </CollapsibleRoot>
    </DemoCard>

    <!-- Progress -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 9">
      <DemoLabel>PROGRESS</DemoLabel>
      <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }">
        <text :style="{ fontSize: '14px', color: '#64748b' }">Upload progress</text>
        <view :style="{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', borderRadius: '20px', backgroundColor: ACCENT_LIGHT }">
          <text :style="{ fontSize: '13px', fontWeight: '700', color: ACCENT }">{{ progress }}%</text>
        </view>
      </view>
      <ProgressRoot v-model="progress" :max="100" :style="{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden' }">
        <ProgressIndicator :style="{ height: '8px', borderRadius: '4px', backgroundColor: ACCENT, width: `${progress}%` }" />
      </ProgressRoot>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
        <view @tap="progress = Math.max(0, progress - 10)" :style="{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          minHeight: '36px',
          backgroundColor: '#f1f5f9', borderWidth: '1px', borderColor: '#e2e8f0',
          paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px',
        }">
          <text :style="{ fontSize: '13px', fontWeight: '600', lineHeight: '18px', color: '#64748b' }">− 10</text>
        </view>
        <view @tap="progress = Math.min(100, progress + 10)" :style="{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          minHeight: '36px',
          backgroundColor: ACCENT,
          paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px',
        }">
          <text :style="{ fontSize: '13px', fontWeight: '600', lineHeight: '18px', color: '#fff' }">+ 10</text>
        </view>
      </view>
    </DemoCard>

    <!-- Slider -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 10">
      <DemoLabel>SLIDER</DemoLabel>
      <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }">
        <text :style="{ fontSize: '14px', color: '#64748b' }">Tap or drag the track</text>
        <view :style="{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', borderRadius: '20px', backgroundColor: ACCENT_LIGHT }">
          <text :style="{ fontSize: '13px', fontWeight: '700', color: ACCENT }">{{ sliderValue[0] }}</text>
        </view>
      </view>
      <SliderRoot
        v-model="sliderValue"
        :max="100"
        :step="1"
        :style="{ position: 'relative', width: '100%', height: '24px', display: 'flex', flexDirection: 'row', alignItems: 'center' }"
      >
        <SliderTrack :style="{ position: 'relative', width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#e2e8f0' }">
          <SliderRange :style="{ position: 'absolute', height: '6px', borderRadius: '3px', backgroundColor: ACCENT }" />
        </SliderTrack>
        <SliderThumb :style="{
          top: '2px',
          width: '20px', height: '20px', borderRadius: '10px',
          backgroundColor: '#ffffff', borderWidth: '2px', borderColor: ACCENT,
        }" />
      </SliderRoot>
    </DemoCard>

    <!-- Rating -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 11">
      <DemoLabel>RATING</DemoLabel>
      <RatingRoot v-model="ratingValue" :length="5" clearable>
        <template #default="{ items }">
          <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
            <RatingItem v-for="i in items" :key="i" :item="i">
              <template #default="{ steps }">
                <RatingItemIndicator
                  v-for="s in steps"
                  :key="s"
                  :step="s"
                  :style="{ width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center' }"
                >
                  <text :style="{
                    fontSize: '26px',
                    lineHeight: '30px',
                    color: s <= ratingValue ? '#f59e0b' : '#cbd5e1',
                  }">★</text>
                </RatingItemIndicator>
              </template>
            </RatingItem>
          </view>
        </template>
      </RatingRoot>
      <DemoBadge :color="ACCENT">
        {{ ratingValue }} / 5
      </DemoBadge>
    </DemoCard>

    <!-- Stepper -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 12">
      <DemoLabel>STEPPER</DemoLabel>
      <StepperRoot v-model="stepperValue">
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0px' }">
          <view
            v-for="(step, i) in [{ step: 1, title: 'Account' }, { step: 2, title: 'Profile' }, { step: 3, title: 'Done' }]"
            :key="step.step"
            :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: i < 2 ? 1 : 0 }"
          >
            <StepperItem :step="step.step">
              <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }">
                <StepperTrigger>
                  <StepperIndicator>
                    <view :style="{
                      width: '32px', height: '32px', borderRadius: '16px', borderWidth: '2px',
                      borderColor: step.step <= stepperValue ? ACCENT : '#e2e8f0',
                      backgroundColor: step.step < stepperValue ? ACCENT : (step.step === stepperValue ? ACCENT_LIGHT : '#fff'),
                      alignItems: 'center', justifyContent: 'center',
                    }">
                      <text :style="{
                        fontSize: '13px', fontWeight: '700',
                        color: step.step < stepperValue ? '#fff' : (step.step === stepperValue ? ACCENT : '#cbd5e1'),
                      }">
                        {{ step.step < stepperValue ? '✓' : step.step }}
                      </text>
                    </view>
                  </StepperIndicator>
                </StepperTrigger>
                <StepperTitle>
                  <text :style="{
                    fontSize: '11px',
                    color: step.step <= stepperValue ? ACCENT : '#94a3b8',
                    fontWeight: step.step === stepperValue ? '700' : '400',
                  }">{{ step.title }}</text>
                </StepperTitle>
              </view>
            </StepperItem>
            <view v-if="i < 2" :style="{
              flex: 1, height: '2px', marginBottom: '18px',
              backgroundColor: step.step < stepperValue ? ACCENT : '#e2e8f0',
            }" />
          </view>
        </view>
      </StepperRoot>
      <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px' }">
        <view @tap="stepperValue = Math.max(1, stepperValue - 1)" :style="{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          minHeight: '36px',
          borderWidth: '1px', borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
          paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px',
        }">
          <text :style="{ fontSize: '13px', fontWeight: '600', lineHeight: '18px', color: '#64748b' }">← Back</text>
        </view>
        <view @tap="stepperValue = Math.min(3, stepperValue + 1)" :style="{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          minHeight: '36px',
          backgroundColor: ACCENT,
          paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px',
        }">
          <text :style="{ fontSize: '13px', fontWeight: '600', lineHeight: '18px', color: '#fff' }">Next →</text>
        </view>
      </view>
      <DemoBadge :color="ACCENT">Step {{ stepperValue }} of 3</DemoBadge>
    </DemoCard>

    <!-- Accordion (via Collapsible) -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 13">
      <DemoLabel>ACCORDION</DemoLabel>
      <view :style="{ borderWidth: '1px', borderColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }">
        <CollapsibleRoot
          v-for="(item, i) in [
            { key: 'q1', q: 'What is vyui?', a: 'Lynx-native UI primitives for Vue.' },
            { key: 'q2', q: 'What is Lynx?', a: 'A cross-platform UI framework by ByteDance.' },
            { key: 'q3', q: 'Unstyled?', a: 'Yes. You own the visual layer entirely.' },
          ]"
          :key="item.key"
          :style="{ borderTopWidth: i > 0 ? '1px' : '0px', borderTopColor: '#e2e8f0' }"
        >
          <CollapsibleTrigger :style="{ paddingLeft: '16px', paddingRight: '16px' }">
            <view :style="{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: '13px', paddingBottom: '13px' }">
              <text :style="{ fontSize: '14px', fontWeight: '600', color: '#0f172a', flex: 1 }">{{ item.q }}</text>
              <text :style="{ color: '#94a3b8', fontSize: '16px', marginLeft: '8px' }">+</text>
            </view>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <view :style="{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '13px', backgroundColor: '#f8fafc' }">
              <text :style="{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }">{{ item.a }}</text>
            </view>
          </CollapsibleContent>
        </CollapsibleRoot>
      </view>
    </DemoCard>

    <!-- Pagination -->
    <DemoCard shadow v-if="showComponent === 0 || showComponent === 14">
      <DemoLabel>PAGINATION</DemoLabel>
      <PaginationRoot as="view" v-model:page="paginationPage" :total="50" :items-per-page="5" :sibling-count="1" show-edges>
        <view :style="{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }">
          <PaginationFirst>
            <view :style="{
              width: '34px', height: '34px', borderRadius: '8px', borderWidth: '1px',
              borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
              alignItems: 'center', justifyContent: 'center',
            }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">«</text>
            </view>
          </PaginationFirst>
          <PaginationPrev>
            <view :style="{
              width: '34px', height: '34px', borderRadius: '8px', borderWidth: '1px',
              borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
              alignItems: 'center', justifyContent: 'center',
            }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">‹</text>
            </view>
          </PaginationPrev>
          <template v-for="(item, i) in paginationItems" :key="i">
            <PaginationListItem v-if="item.type === 'page'" :value="item.value">
              <view :style="{
                width: '34px', height: '34px', borderRadius: '8px',
                borderWidth: item.value === paginationPage ? '0px' : '1px',
                borderColor: '#e2e8f0',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: item.value === paginationPage ? ACCENT : '#f8fafc',
                boxShadow: item.value === paginationPage ? '0px 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
              }">
                <text :style="{
                  fontSize: '13px', fontWeight: '600',
                  color: item.value === paginationPage ? '#fff' : '#64748b',
                }">{{ item.value }}</text>
              </view>
            </PaginationListItem>
            <PaginationEllipsis v-else-if="item.type === 'ellipsis'" :index="i">
              <view :style="{ width: '34px', height: '34px', alignItems: 'center', justifyContent: 'center' }">
                <text :style="{ color: '#94a3b8', fontSize: '14px' }">…</text>
              </view>
            </PaginationEllipsis>
          </template>
          <PaginationNext>
            <view :style="{
              width: '34px', height: '34px', borderRadius: '8px', borderWidth: '1px',
              borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
              alignItems: 'center', justifyContent: 'center',
            }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">›</text>
            </view>
          </PaginationNext>
          <PaginationLast>
            <view :style="{
              width: '34px', height: '34px', borderRadius: '8px', borderWidth: '1px',
              borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
              alignItems: 'center', justifyContent: 'center',
            }">
              <text :style="{ fontSize: '14px', color: '#64748b' }">»</text>
            </view>
          </PaginationLast>
        </view>
      </PaginationRoot>
      <DemoBadge>Page {{ paginationPage }} of 10</DemoBadge>
    </DemoCard>

  </view>
</template>
