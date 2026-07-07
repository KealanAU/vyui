<script setup lang="ts">
import { ref } from 'vue'
import {
  VyButton,
  VyCheckbox,
  VyForm,
  VyFormField,
  VyIcon,
  VyInput,
  VyKeyboardAwareResponder,
  VyKeyboardAwareRoot,
  VyLabel,
  VyNumberField,
  VyPinInput,
  VyRadioGroup,
  VySlider,
  VyStepper,
  VySwitch,
  VyTextarea,
  VyToggleGroup,
} from '@vyui/kit'

const name = ref('')
const ringDefault = ref('')
const ringError = ref('')
const ringSoft = ref('')
// Keyboard-avoidance comparison — same inputs, one card bare and one wrapped
// in KeyboardAwareRoot/Responder. Inputs self-register (no Trigger wrapping).
const kaOff = ref('')
const kaOn = ref('')
const bio = ref('')
const wifiOn = ref(true)
const bluetoothOn = ref(false)
const agreed = ref<boolean | 'indeterminate'>(false)
const loading = ref(false)
const sliderValue = ref(40)
const quantity = ref<number | null>(1)
const price = ref<number | null>(9.5)
const stepperStep = ref(1)
const pin = ref('')
const radioPlan = ref('pro')
const toggleAlign = ref('center')

const radioItems = [
  { value: 'free',  label: 'Free',  description: 'For personal use.' },
  { value: 'pro',   label: 'Pro',   description: 'Best for individuals.' },
  { value: 'team',  label: 'Team',  description: 'For small teams.' },
]
const toggleItems = [
  { value: 'left',   icon: 'icon-park-outline:align-text-left'   },
  { value: 'center', icon: 'icon-park-outline:align-text-center' },
  { value: 'right',  icon: 'icon-park-outline:align-text-right'  },
]
const stepperItems = [
  { title: 'Plan',    description: 'Pick a tier' },
  { title: 'Account', description: 'Sign up' },
  { title: 'Payment', description: 'Add card'  },
  { title: 'Done',    description: 'Confirm'   },
]

function submit() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 1500)
}

// Form + FormField demo — validates email + password locally and surfaces the
// FormField label/description/error scaffold around `VyInput`.
const formRef = ref<{ submit: () => void, reset: () => void } | null>(null)
const formSubmitted = ref<Record<string, unknown> | null>(null)
const showPassword = ref(false)
const emailValidators = [
  (v: unknown) => (!v || String(v).trim() === '' ? 'Email is required' : null),
  (v: unknown) => (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? 'Enter a valid email' : null),
]
const passwordValidators = [
  (v: unknown) => (!v || String(v).length < 8 ? 'Min 8 characters' : null),
]
function onFormSubmit(values: Record<string, unknown>) {
  formSubmitted.value = values
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Button -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Button</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton :loading="loading" label="Submit" @tap="submit" />
        <VyButton leading-icon="icon-park-outline:like" label="With icon" />
        <VyButton color="neutral" size="sm" label="Small" />
        <VyButton color="info" size="lg" label="Large" />
      </view>
    </view>

    <!-- Button variants -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Button variants</text>

      <text class="text-slate-500 text-xs">solid</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton variant="solid" color="primary" label="Primary" />
        <VyButton variant="solid" color="success" label="Success" />
        <VyButton variant="solid" color="error"   label="Error" />
      </view>

      <text class="text-slate-500 text-xs pt-1">outline</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton variant="outline" color="primary" label="Primary" />
        <VyButton variant="outline" color="warning" label="Warning" />
        <VyButton variant="outline" color="info"    label="Info" />
      </view>

      <text class="text-slate-500 text-xs pt-1">soft</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton variant="soft" color="primary" label="Primary" />
        <VyButton variant="soft" color="success" label="Success" />
        <VyButton variant="soft" color="error"   label="Error" />
      </view>

      <text class="text-slate-500 text-xs pt-1">subtle</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton variant="subtle" color="primary" label="Primary" />
        <VyButton variant="subtle" color="warning" label="Warning" />
        <VyButton variant="subtle" color="info"    label="Info" />
      </view>

      <text class="text-slate-500 text-xs pt-1">ghost</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton variant="ghost" color="primary" label="Primary" />
        <VyButton variant="ghost" color="error"   label="Error" />
        <VyButton variant="ghost" color="neutral" label="Neutral" />
      </view>

      <text class="text-slate-500 text-xs pt-1">link</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton variant="link" color="primary" label="Primary" />
        <VyButton variant="link" color="info"    label="Info" />
        <VyButton variant="link" color="error"   label="Error" />
      </view>
    </view>

    <!-- Input + Label -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Input / Label</text>
      <VyLabel for="name-input">Display name</VyLabel>
      <VyInput
        id="name-input"
        v-model="name"
        placeholder="Enter your name"
        leading-icon="icon-park-outline:user"
      />
      <text v-if="name" class="text-slate-500 text-xs pt-1">Hello, {{ name }}!</text>
    </view>

    <!-- Input focus ring -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Input focus ring</text>
      <text class="text-slate-500 text-xs">Tap an input — colored border + shadow ring should follow focus, and drop on blur.</text>
      <VyInput v-model="ringDefault" placeholder="color=primary (default)" />
      <VyInput v-model="ringError" color="error" placeholder="color=error" />
      <VyInput v-model="ringSoft" variant="soft" placeholder="variant=soft (borderless at rest)" />
      <VyInput highlight placeholder="highlight (static ring, no focus needed)" />
    </view>

    <!-- Keyboard avoidance: off vs on. Scroll these two cards toward the
         bottom of the screen first so the keyboard would cover them. -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Keyboard avoidance — off</text>
      <text class="text-slate-500 text-xs">
        Bare input: scroll this card near the bottom, focus, Cmd+K — the
        keyboard covers it and nothing moves.
      </text>
      <VyInput v-model="kaOff" placeholder="I stay behind the keyboard" />
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Keyboard avoidance — on</text>
      <text class="text-slate-500 text-xs">
        Same input wrapped in KeyboardAwareRoot + Responder (no per-input
        wrapping — it self-registers). Focus + Cmd+K: the responder should
        translate up so the field clears the keyboard, and settle back on
        dismiss.
      </text>
      <VyKeyboardAwareRoot>
        <VyKeyboardAwareResponder>
          <VyInput v-model="kaOn" placeholder="I should ride above the keyboard" />
        </VyKeyboardAwareResponder>
      </VyKeyboardAwareRoot>
    </view>

    <!-- Textarea -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Textarea</text>
      <VyTextarea v-model="bio" placeholder="Tell us about yourself" :rows="3" />
      <text v-if="bio" class="text-slate-500 text-xs pt-1">{{ bio.length }} chars</text>
    </view>

    <!-- Switch -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4">
      <text class="text-slate-900 text-base font-semibold">Switch</text>
      <view class="flex flex-row items-center justify-between">
        <view class="flex flex-row items-center gap-2">
          <VyIcon name="icon-park-outline:wifi" :size="18" color="#0f172a" />
          <text class="text-slate-900 text-sm">Wi-Fi</text>
        </view>
        <VySwitch v-model="wifiOn" />
      </view>
      <view class="flex flex-row items-center justify-between">
        <view class="flex flex-row items-center gap-2">
          <VyIcon name="icon-park-outline:bluetooth" :size="18" color="#0f172a" />
          <text class="text-slate-900 text-sm">Bluetooth</text>
        </view>
        <VySwitch v-model="bluetoothOn" color="info" />
      </view>
    </view>

    <!-- Checkbox -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-row items-center gap-3">
      <VyCheckbox v-model="agreed" />
      <text class="text-slate-900 text-sm">I agree to the terms and conditions</text>
    </view>

    <!-- RadioGroup -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">RadioGroup</text>
      <VyRadioGroup v-model="radioPlan" :items="radioItems" />
      <text class="text-slate-500 text-xs">Selected: {{ radioPlan }}</text>
    </view>

    <!-- ToggleGroup -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">ToggleGroup</text>
      <VyToggleGroup v-model="toggleAlign" :items="toggleItems" type="single" />
      <text class="text-slate-500 text-xs">Align: {{ toggleAlign }}</text>
    </view>

    <!-- Slider -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Slider</text>
      <VySlider v-model="sliderValue" :min="0" :max="100" :step="1" />
      <text class="text-slate-500 text-xs">Value: {{ sliderValue }}</text>
    </view>

    <!-- NumberField -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">NumberField</text>

      <view class="flex flex-col gap-2">
        <VyLabel for="qty-field">Quantity (0–10)</VyLabel>
        <VyNumberField id="qty-field" v-model="quantity" :min="0" :max="10" :step="1" />
        <text class="text-slate-500 text-xs">Value: {{ quantity ?? '—' }}</text>
      </view>

      <view class="flex flex-col gap-2 pt-1">
        <VyLabel for="price-field">Price (step 0.5)</VyLabel>
        <VyNumberField
          id="price-field"
          v-model="price"
          :min="0"
          :step="0.5"
          color="success"
          variant="soft"
          placeholder="0.00"
        />
        <text class="text-slate-500 text-xs">Value: {{ price ?? '—' }}</text>
      </view>

      <view class="flex flex-col gap-2 pt-1">
        <VyLabel>Disabled</VyLabel>
        <VyNumberField :model-value="5" disabled />
      </view>
    </view>

    <!-- Stepper -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Stepper</text>
      <VyStepper v-model="stepperStep" :items="stepperItems" />
      <view class="flex flex-row gap-2 pt-2">
        <VyButton variant="soft" color="neutral" size="sm" label="Back" @tap="stepperStep = Math.max(0, stepperStep - 1)" />
        <VyButton size="sm" label="Next" @tap="stepperStep = Math.min(stepperItems.length - 1, stepperStep + 1)" />
      </view>
    </view>

    <!-- PinInput -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">PinInput</text>
      <VyPinInput v-model="pin" :length="6" />
      <text class="text-slate-500 text-xs">Entered: {{ pin || '—' }}</text>
    </view>

    <!-- Form + FormField (sync validators, label/description/error scaffold) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Form + FormField</text>
      <VyForm
        ref="formRef"
        v-slot="{ submitting }"
        :default-values="{ email: '', password: '' }"
        class="flex flex-col gap-3"
        @submit="onFormSubmit"
      >
        <VyFormField
          name="email"
          label="Email"
          description="We'll never share it."
          hint="Required"
          required
          :validators="emailValidators"
        >
          <template #default="{ value, setValue, error }">
            <VyInput
              :model-value="value as string"
              type="email"
              placeholder="you@example.com"
              leading-icon="icon-park-outline:mail"
              :color="error ? 'error' : undefined"
              @update:model-value="setValue"
            />
          </template>
        </VyFormField>

        <VyFormField
          name="password"
          label="Password"
          help="Use at least 8 characters."
          required
          :validators="passwordValidators"
        >
          <template #default="{ value, setValue, error }">
            <VyInput
              :model-value="value as string"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              leading-icon="icon-park-outline:lock"
              :color="error ? 'error' : undefined"
              @update:model-value="setValue"
            >
              <template #trailing="{ iconColor }">
                <VyIcon
                  :name="showPassword ? 'icon-park-outline:preview-close' : 'icon-park-outline:preview-open'"
                  :size="18"
                  :color="iconColor"
                  @tap="showPassword = !showPassword"
                />
              </template>
            </VyInput>
          </template>
        </VyFormField>

        <view class="flex flex-row gap-2 pt-1">
          <VyButton
            label="Submit"
            :loading="submitting"
            @tap="formRef?.submit()"
          />
        </view>
      </VyForm>
      <text v-if="formSubmitted" class="text-success-600 text-xs">
        Submitted: {{ JSON.stringify(formSubmitted) }}
      </text>
    </view>
  </view>
</template>
