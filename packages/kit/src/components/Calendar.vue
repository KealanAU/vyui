<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/calendar'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

export const buildCalendar = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).calendar as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type CalendarVariants = VariantProps<ReturnType<typeof buildCalendar>>

export interface CalendarDay {
  iso: string
  day: number
  month: number
  year: number
  inMonth: boolean
  selected: boolean
  today: boolean
  disabled: boolean
}

export interface CalendarProps {
  /** Selected date as `YYYY-MM-DD`. */
  modelValue?: string
  /** Initial selected date for uncontrolled usage. */
  defaultValue?: string
  /** Visible month as `YYYY-MM`. */
  month?: string
  /** Initial visible month as `YYYY-MM`. */
  defaultMonth?: string
  /** Start weeks on Sunday (`0`) through Saturday (`6`). */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Always render six weeks to avoid height changes between months. */
  fixedWeeks?: boolean
  /** Disable every selectable day. */
  disabled?: boolean
  /** ISO dates that cannot be selected. */
  disabledDates?: string[]
  /** Show the Lynx date-runtime caveat banner. */
  caveat?: boolean
  caveatTitle?: string
  caveatDescription?: string
  color?: CalendarVariants['color']
  size?: CalendarVariants['size']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildCalendar>['slots'], any>>
}

export interface CalendarSlots {
  day(props: { day: CalendarDay }): any
  caveat(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import VyAlert from './Alert.vue'

const props = withDefaults(defineProps<CalendarProps>(), {
  weekStartsOn: 0,
  fixedWeeks: true,
  caveat: true,
  caveatTitle: 'Calendar date handling is experimental',
  caveatDescription: 'VyCalendar stores ISO strings and avoids host Date objects at the public boundary. Verify date formatting and timezone behavior on your Lynx targets before shipping.',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:month', value: string): void
}>()
defineSlots<CalendarSlots>()

const appConfig = useAppConfig()
const localValue = ref(props.modelValue ?? props.defaultValue)
const localMonth = ref(resolveInitialMonth())

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const ui = computed(() => buildCalendar(appConfig)({
  color: props.color,
  size: props.size,
}))

const selectedValue = computed(() => props.modelValue ?? localValue.value)
const visibleMonth = computed(() => parseMonth(props.month ?? localMonth.value))
const disabledSet = computed(() => new Set(props.disabledDates ?? []))
const title = computed(() => `${MONTHS[visibleMonth.value.month - 1]} ${visibleMonth.value.year}`)
const orderedWeekdays = computed(() => [...WEEKDAYS.slice(props.weekStartsOn), ...WEEKDAYS.slice(0, props.weekStartsOn)])
const weeks = computed(() => buildMonthGrid(visibleMonth.value.year, visibleMonth.value.month))

watch(() => props.modelValue, (value) => {
  if (value !== undefined) localValue.value = value
})

watch(() => props.month, (value) => {
  if (value) localMonth.value = normalizeMonth(value)
})

function resolveInitialMonth() {
  const source = props.month ?? props.defaultMonth ?? props.modelValue ?? props.defaultValue ?? todayIso()
  return normalizeMonth(source)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function todayIso() {
  // Internal fallback only. The public model stays an ISO string.
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{2})/.exec(value)
  const year = match ? Number(match[1]) : 2026
  const month = match ? Number(match[2]) : 1
  return {
    year: Number.isFinite(year) ? year : 2026,
    month: Number.isFinite(month) ? Math.min(12, Math.max(1, month)) : 1,
  }
}

function normalizeMonth(value: string) {
  const { year, month } = parseMonth(value)
  return `${year}-${pad(month)}`
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function dayOfWeek(year: number, month: number, day: number) {
  // Sakamoto algorithm, returns 0-6 for Sun-Sat without constructing Date.
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const adjustedYear = month < 3 ? year - 1 : year
  return (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400) + offsets[month - 1] + day) % 7
}

function addMonths(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta
  return {
    year: Math.floor(total / 12),
    month: total % 12 + 1,
  }
}

function buildDay(year: number, month: number, day: number, inMonth: boolean): CalendarDay {
  const iso = toIso(year, month, day)
  return {
    iso,
    day,
    month,
    year,
    inMonth,
    selected: selectedValue.value === iso,
    today: todayIso() === iso,
    disabled: !!props.disabled || disabledSet.value.has(iso),
  }
}

function buildMonthGrid(year: number, month: number) {
  const days: CalendarDay[] = []
  const currentDays = daysInMonth(year, month)
  const firstWeekday = dayOfWeek(year, month, 1)
  const leadingCount = (firstWeekday - props.weekStartsOn + 7) % 7
  const previous = addMonths(year, month, -1)
  const previousDays = daysInMonth(previous.year, previous.month)

  for (let i = leadingCount; i > 0; i--) {
    days.push(buildDay(previous.year, previous.month, previousDays - i + 1, false))
  }

  for (let day = 1; day <= currentDays; day++) {
    days.push(buildDay(year, month, day, true))
  }

  const targetLength = props.fixedWeeks ? 42 : Math.ceil(days.length / 7) * 7
  const next = addMonths(year, month, 1)
  for (let day = 1; days.length < targetLength; day++) {
    days.push(buildDay(next.year, next.month, day, false))
  }

  const rows: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7))
  }
  return rows
}

function setMonth(year: number, month: number) {
  localMonth.value = `${year}-${pad(month)}`
  emit('update:month', localMonth.value)
}

function moveMonth(delta: number) {
  const next = addMonths(visibleMonth.value.year, visibleMonth.value.month, delta)
  setMonth(next.year, next.month)
}

function selectDay(day: CalendarDay) {
  if (day.disabled) return
  localValue.value = day.iso
  emit('update:modelValue', day.iso)
  if (!day.inMonth) {
    setMonth(day.year, day.month)
  }
}
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <slot v-if="caveat" name="caveat">
      <VyAlert
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="caveatTitle"
        :description="caveatDescription"
        :class="ui.caveat({ class: props.ui?.caveat })"
      />
    </slot>

    <view :class="ui.header({ class: props.ui?.header })">
      <text :class="ui.title({ class: props.ui?.title })">{{ title }}</text>

      <view :class="ui.nav({ class: props.ui?.nav })">
        <view :class="ui.navButton({ class: props.ui?.navButton })" @tap="moveMonth(-1)">
          <VyIcon name="i-lucide-chevron-left" :class="ui.navIcon({ class: props.ui?.navIcon })" />
        </view>
        <view :class="ui.navButton({ class: props.ui?.navButton })" @tap="moveMonth(1)">
          <VyIcon name="i-lucide-chevron-right" :class="ui.navIcon({ class: props.ui?.navIcon })" />
        </view>
      </view>
    </view>

    <view :class="ui.weekdays({ class: props.ui?.weekdays })">
      <text
        v-for="weekday in orderedWeekdays"
        :key="weekday"
        :class="ui.weekday({ class: props.ui?.weekday })"
      >{{ weekday }}</text>
    </view>

    <view :class="ui.weeks({ class: props.ui?.weeks })">
      <view
        v-for="(week, weekIndex) in weeks"
        :key="weekIndex"
        :class="ui.week({ class: props.ui?.week })"
      >
        <view
          v-for="day in week"
          :key="day.iso"
          :class="ui.day({ class: [day.selected && ui.selectedDay(), props.ui?.day] })"
          :data-selected="day.selected ? '' : undefined"
          :data-disabled="day.disabled ? '' : undefined"
          @tap="selectDay(day)"
        >
          <slot name="day" :day="day">
            <text
              :class="ui.dayText({
                class: [
                  !day.inMonth && ui.outsideDayText(),
                  day.today && ui.todayText(),
                  day.selected && ui.selectedDayText(),
                  props.ui?.dayText,
                ],
              })"
            >{{ day.day }}</text>
          </slot>
        </view>
      </view>
    </view>
  </view>
</template>
