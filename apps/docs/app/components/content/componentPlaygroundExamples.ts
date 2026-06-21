export interface ComponentPlaygroundExample {
  label: string
  package: '@vyui/core' | '@vyui/kit'
  description: string
  code: string
}

export const componentPlaygroundExamples: Record<string, ComponentPlaygroundExample> = {
  switch: {
    label: 'Switch',
    package: '@vyui/kit',
    description: 'Toggle a setting on and off.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VySwitch } from '@vyui/kit'

const enabled = ref(true)
<\/script>

<template>
  <VySwitch
    v-model="enabled"
    label="Notifications"
    description="Receive product updates"
  />
</template>`,
  },
  tabs: {
    label: 'Tabs',
    package: '@vyui/kit',
    description: 'Move between related views.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyTabs } from '@vyui/kit'

const active = ref('overview')
const items = [
  { label: 'Overview', value: 'overview' },
  { label: 'Activity', value: 'activity' },
  { label: 'Settings', value: 'settings' },
]
<\/script>

<template>
  <VyTabs v-model="active" :items="items" />
</template>`,
  },
  accordion: {
    label: 'Accordion',
    package: '@vyui/kit',
    description: 'Reveal one section of content at a time.',
    code: `<script setup lang="ts">
import { VyAccordion } from '@vyui/kit'

const items = [
  { label: 'Is it accessible?', content: 'Keyboard and screen reader support are built in.' },
  { label: 'Does it run on Lynx?', content: 'Yes — on iOS, Android, and web.' },
]
<\/script>

<template>
  <VyAccordion :items="items" />
</template>`,
  },
  rating: {
    label: 'Rating',
    package: '@vyui/kit',
    description: 'Capture a one-to-five star score.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyRating } from '@vyui/kit'

const rating = ref(4)
<\/script>

<template>
  <VyRating v-model="rating" :max="5" />
</template>`,
  },
  button: {
    label: 'Button',
    package: '@vyui/kit',
    description: 'Trigger an action with a clear call to action.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit'

const saved = ref(false)
<\/script>

<template>
  <VyButton icon="lucide:check" @tap="saved = true">
    {{ saved ? 'Saved' : 'Save changes' }}
  </VyButton>
</template>`,
  },
  input: {
    label: 'Input',
    package: '@vyui/kit',
    description: 'Collect a short piece of text.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyInput } from '@vyui/kit'

const email = ref('')
<\/script>

<template>
  <VyInput
    v-model="email"
    type="email"
    label="Email"
    placeholder="you@example.com"
  />
</template>`,
  },
  slider: {
    label: 'Slider',
    package: '@vyui/kit',
    description: 'Choose a value from a continuous range.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VySlider } from '@vyui/kit'

const volume = ref(64)
<\/script>

<template>
  <VySlider v-model="volume" :min="0" :max="100" />
</template>`,
  },
  progress: {
    label: 'Progress',
    package: '@vyui/kit',
    description: 'Show how much of a task is complete.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyProgress } from '@vyui/kit'

const progress = ref(68)
<\/script>

<template>
  <VyProgress v-model="progress" :max="100" />
</template>`,
  },
  checkbox: {
    label: 'Checkbox',
    package: '@vyui/kit',
    description: 'Select an independent option.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyCheckbox } from '@vyui/kit'

const accepted = ref(false)
<\/script>

<template>
  <VyCheckbox v-model="accepted" label="Accept the terms" />
</template>`,
  },
  alert: {
    label: 'Alert',
    package: '@vyui/kit',
    description: 'Surface timely information and actions.',
    code: `<script setup lang="ts">
import { VyAlert } from '@vyui/kit'
<\/script>

<template>
  <VyAlert
    color="success"
    title="Deployment complete"
    description="Version 1.4 is live in production."
    close
  />
</template>`,
  },
  card: {
    label: 'Card',
    package: '@vyui/kit',
    description: 'Group related content and actions.',
    code: `<script setup lang="ts">
import { VyButton, VyCard } from '@vyui/kit'
<\/script>

<template>
  <VyCard>
    <template #header>Team plan</template>
    Collaborate with unlimited projects.
    <template #footer>
      <VyButton>Upgrade</VyButton>
    </template>
  </VyCard>
</template>`,
  },
  badge: {
    label: 'Badge',
    package: '@vyui/kit',
    description: 'Add compact status or metadata.',
    code: `<script setup lang="ts">
import { VyBadge } from '@vyui/kit'
<\/script>

<template>
  <VyBadge color="success" icon="lucide:circle-check">
    Production
  </VyBadge>
</template>`,
  },
  toggle: {
    label: 'Toggle',
    package: '@vyui/kit',
    description: 'Turn a toolbar option on or off.',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import { VyToggle } from '@vyui/kit'

const bold = ref(false)
<\/script>

<template>
  <VyToggle v-model="bold" icon="lucide:bold" aria-label="Bold" />
</template>`,
  },
  separator: {
    label: 'Separator',
    package: '@vyui/kit',
    description: 'Visually divide related groups.',
    code: `<script setup lang="ts">
import { VySeparator } from '@vyui/kit'
<\/script>

<template>
  <div>
    <span>Profile</span>
    <VySeparator label="Account" />
    <span>Security</span>
  </div>
</template>`,
  },
}

export function normalizePlaygroundName(name: string): string {
  return name.trim().toLowerCase().replace(/^vy/, '').replace(/[\s_]+/g, '-')
}
