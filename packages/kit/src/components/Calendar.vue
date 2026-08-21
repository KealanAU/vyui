<script lang="ts">
import theme from '../theme/calendar'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type CalendarTV = ThemeTV<typeof theme>
type CalendarVariants = VariantProps<CalendarTV>

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
  class?: ClassValue
  ui?: Partial<Record<keyof CalendarTV['slots'], ClassValue>>
}

export interface CalendarSlots {
  day(props: { day: CalendarDay }): any
  caveat(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon as VyIcon } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'
import { addMonths, buildMonthGrid, type IsoDayCell, normalizeMonth, pad, parseMonth, toIso } from '../utils/date-iso'
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

const localValue = ref(props.modelValue ?? props.defaultValue)
const localMonth = ref(resolveInitialMonth())

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const { ui } = useStyledComponent('calendar', theme, () => ({
  color: props.color,
  size: props.size,
}))

const selectedValue = computed(() => props.modelValue ?? localValue.value)
const visibleMonth = computed(() => parseMonth(props.month ?? localMonth.value))
const disabledSet = computed(() => new Set(props.disabledDates ?? []))
const title = computed(() => `${MONTHS[visibleMonth.value.month - 1]} ${visibleMonth.value.year}`)
const orderedWeekdays = computed(() => [...WEEKDAYS.slice(props.weekStartsOn), ...WEEKDAYS.slice(0, props.weekStartsOn)])
const weeks = computed(() =>
  buildMonthGrid(visibleMonth.value.year, visibleMonth.value.month, {
    weekStartsOn: props.weekStartsOn,
    fixedWeeks: props.fixedWeeks,
  }).map(row => row.map(decorateDay)))

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

function todayIso() {
  // Internal fallback only. The public model stays an ISO string.
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function decorateDay(cell: IsoDayCell): CalendarDay {
  return {
    ...cell,
    selected: selectedValue.value === cell.iso,
    today: todayIso() === cell.iso,
    disabled: !!props.disabled || disabledSet.value.has(cell.iso),
  }
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
