<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  componentPlaygroundExamples,
  normalizePlaygroundName,
} from './componentPlaygroundExamples'

const props = defineProps<{
  name: string
}>()

const activeView = ref<'preview' | 'code'>('preview')
const copied = ref(false)
const switchEnabled = ref(true)
const activeTab = ref('Overview')
const openAccordion = ref(0)
const rating = ref(4)
const saved = ref(false)
const email = ref('')
const sliderValue = ref(64)
const progressValue = ref(68)
const checked = ref(false)
const alertVisible = ref(true)
const togglePressed = ref(false)
const views = ['preview', 'code'] as const

const normalizedName = computed(() => normalizePlaygroundName(props.name))
const example = computed(() => componentPlaygroundExamples[normalizedName.value])
const title = computed(() => example.value?.label ?? (props.name.trim() || 'Component'))
const fallbackCode = computed(() => `<script setup lang="ts">
import { Vy${toPascalCase(title.value)} } from '@vyui/kit'
<\/script>

<template>
  <Vy${toPascalCase(title.value)} />
</template>`)
const sourceCode = computed(() => example.value?.code ?? fallbackCode.value)

const accordionItems = [
  ['Is it accessible?', 'Keyboard and screen reader behavior are built in.'],
  ['Does it work on Lynx?', 'Yes — the same component runs on iOS, Android, and web.'],
  ['Can I theme it?', 'Every visual slot can be customized with the kit theme.'],
]

watch(normalizedName, () => {
  activeView.value = 'preview'
  copied.value = false
  alertVisible.value = true
})

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

async function copyCode() {
  if (!import.meta.client)
    return

  let didCopy = false

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(sourceCode.value)
      didCopy = true
    }
  }
  catch {
    didCopy = false
  }

  if (!didCopy) {
    const textarea = document.createElement('textarea')
    textarea.value = sourceCode.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    didCopy = document.execCommand('copy')
    textarea.remove()
  }

  if (!didCopy)
    return

  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <section class="component-playground not-prose">
    <header class="playground-header">
      <div class="playground-heading">
        <span class="playground-dot" />
        <div>
          <div class="playground-title">
            {{ title }}
          </div>
          <div class="playground-subtitle">
            {{ example?.package ?? '@vyui/kit' }} · Interactive example
          </div>
        </div>
      </div>

      <div class="playground-tabs" role="tablist" aria-label="Playground view">
        <button
          v-for="view in views"
          :key="view"
          type="button"
          role="tab"
          class="playground-tab"
          :class="{ 'is-active': activeView === view }"
          :aria-selected="activeView === view"
          @click="activeView = view"
        >
          <UIcon :name="view === 'preview' ? 'i-lucide-eye' : 'i-lucide-code-2'" />
          {{ view === 'preview' ? 'Preview' : 'Code' }}
        </button>
      </div>
    </header>

    <div v-if="activeView === 'preview'" class="preview-canvas">
      <div class="preview-glow preview-glow-one" />
      <div class="preview-glow preview-glow-two" />

      <div v-if="example" class="preview-stage">
        <div v-if="normalizedName === 'switch'" class="settings-card">
          <div>
            <strong>Notifications</strong>
            <span>Receive product updates</span>
          </div>
          <button
            type="button"
            role="switch"
            class="switch-control"
            :class="{ 'is-on': switchEnabled }"
            :aria-checked="switchEnabled"
            @click="switchEnabled = !switchEnabled"
          >
            <span />
          </button>
        </div>

        <div v-else-if="normalizedName === 'tabs'" class="tabs-demo">
          <div class="segmented-control">
            <button
              v-for="tab in ['Overview', 'Activity', 'Settings']"
              :key="tab"
              type="button"
              :class="{ 'is-active': activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
          <div class="tab-panel">
            <span class="demo-icon"><UIcon name="i-lucide-layout-dashboard" /></span>
            <div>
              <strong>{{ activeTab }}</strong>
              <span>{{ activeTab }} content appears here.</span>
            </div>
          </div>
        </div>

        <div v-else-if="normalizedName === 'accordion'" class="accordion-demo">
          <div v-for="(item, index) in accordionItems" :key="item[0]" class="accordion-item">
            <button
              type="button"
              :aria-expanded="openAccordion === index"
              @click="openAccordion = openAccordion === index ? -1 : index"
            >
              <span>{{ item[0] }}</span>
              <UIcon name="i-lucide-chevron-down" :class="{ 'is-open': openAccordion === index }" />
            </button>
            <p v-if="openAccordion === index">
              {{ item[1] }}
            </p>
          </div>
        </div>

        <div v-else-if="normalizedName === 'rating'" class="rating-demo">
          <span>How was your experience?</span>
          <div class="stars" aria-label="Rating">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              :aria-label="`${star} stars`"
              :class="{ 'is-active': star <= rating }"
              @click="rating = star"
            >
              <UIcon name="i-lucide-star" />
            </button>
          </div>
          <strong>{{ rating }}.0 — {{ ['Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating - 1] }}</strong>
        </div>

        <div v-else-if="normalizedName === 'button'" class="button-demo">
          <button type="button" class="primary-button" @click="saved = !saved">
            <UIcon :name="saved ? 'i-lucide-check' : 'i-lucide-save'" />
            {{ saved ? 'Saved' : 'Save changes' }}
          </button>
          <span>{{ saved ? 'Your changes are safe.' : 'Try the button.' }}</span>
        </div>

        <label v-else-if="normalizedName === 'input'" class="input-demo">
          <span>Email address</span>
          <div :class="{ 'has-value': email }">
            <UIcon name="i-lucide-mail" />
            <input v-model="email" type="email" placeholder="you@example.com">
            <UIcon v-if="email" name="i-lucide-circle-check" class="input-check" />
          </div>
          <small>{{ email ? `We'll write to ${email}` : 'Used only for account updates.' }}</small>
        </label>

        <div v-else-if="normalizedName === 'slider'" class="range-demo">
          <div class="range-heading">
            <span><UIcon name="i-lucide-volume-2" /> Volume</span>
            <strong>{{ sliderValue }}%</strong>
          </div>
          <input v-model="sliderValue" type="range" min="0" max="100">
          <div class="range-labels"><span>0</span><span>100</span></div>
        </div>

        <div v-else-if="normalizedName === 'progress'" class="progress-demo">
          <div class="progress-ring" :style="{ '--progress': `${progressValue * 3.6}deg` }">
            <div>{{ progressValue }}%</div>
          </div>
          <div>
            <strong>Uploading release</strong>
            <span>Documentation bundle</span>
            <button type="button" @click="progressValue = progressValue >= 100 ? 12 : Math.min(100, progressValue + 16)">
              Advance progress
            </button>
          </div>
        </div>

        <label v-else-if="normalizedName === 'checkbox'" class="checkbox-demo">
          <input v-model="checked" type="checkbox">
          <span class="checkbox-box"><UIcon v-if="checked" name="i-lucide-check" /></span>
          <span>
            <strong>Accept the terms</strong>
            <small>I agree to the acceptable use policy.</small>
          </span>
        </label>

        <div v-else-if="normalizedName === 'alert'" class="alert-demo">
          <Transition name="alert">
            <div v-if="alertVisible">
              <span class="alert-icon"><UIcon name="i-lucide-circle-check" /></span>
              <span><strong>Deployment complete</strong><small>Version 1.4 is live in production.</small></span>
              <button type="button" aria-label="Dismiss alert" @click="alertVisible = false"><UIcon name="i-lucide-x" /></button>
            </div>
            <button v-else type="button" class="restore-alert" @click="alertVisible = true">Restore alert</button>
          </Transition>
        </div>

        <article v-else-if="normalizedName === 'card'" class="card-demo">
          <span class="card-icon"><UIcon name="i-lucide-sparkles" /></span>
          <span class="card-badge">POPULAR</span>
          <h3>Team plan</h3>
          <p>Unlimited projects and thoughtful collaboration tools.</p>
          <div><strong>$24</strong><span>/ month</span></div>
          <button type="button">Upgrade plan <UIcon name="i-lucide-arrow-right" /></button>
        </article>

        <div v-else-if="normalizedName === 'badge'" class="badge-demo">
          <span class="status-badge"><i /><UIcon name="i-lucide-cloud" /> Production</span>
          <span class="status-badge neutral"><UIcon name="i-lucide-git-branch" /> main</span>
          <span class="status-badge warning"><UIcon name="i-lucide-clock-3" /> Pending</span>
        </div>

        <div v-else-if="normalizedName === 'toggle'" class="toggle-demo">
          <span>Format</span>
          <div>
            <button type="button" :class="{ 'is-active': togglePressed }" aria-label="Bold" @click="togglePressed = !togglePressed">
              <UIcon name="i-lucide-bold" />
            </button>
            <button type="button" aria-label="Italic"><UIcon name="i-lucide-italic" /></button>
            <button type="button" aria-label="Underline"><UIcon name="i-lucide-underline" /></button>
          </div>
          <p :class="{ 'font-bold': togglePressed }">Make every word count.</p>
        </div>

        <div v-else-if="normalizedName === 'separator'" class="separator-demo">
          <div><UIcon name="i-lucide-user-round" /><span><strong>Profile</strong><small>Personal details</small></span></div>
          <div class="separator-line"><span>ACCOUNT</span></div>
          <div><UIcon name="i-lucide-shield-check" /><span><strong>Security</strong><small>Password and devices</small></span></div>
        </div>
      </div>

      <div v-else class="unknown-demo">
        <span><UIcon name="i-lucide-blocks" /></span>
        <strong>{{ title }} example</strong>
        <p>No curated preview exists yet, but here is a safe starting point.</p>
        <button type="button" @click="activeView = 'code'">
          View starter code
          <UIcon name="i-lucide-arrow-right" />
        </button>
      </div>
    </div>

    <div v-else class="code-view">
      <div class="code-toolbar">
        <span><i /><i /><i /></span>
        <span>{{ normalizedName || 'component' }}.vue</span>
        <button type="button" :aria-label="copied ? 'Code copied' : 'Copy code'" @click="copyCode">
          <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <pre><code>{{ sourceCode }}</code></pre>
    </div>

    <footer class="playground-footer">
      <span>{{ example?.description ?? `Starter example for ${title}.` }}</span>
      <button v-if="activeView === 'preview'" type="button" @click="activeView = 'code'">
        View source <UIcon name="i-lucide-arrow-up-right" />
      </button>
    </footer>
  </section>
</template>

<style scoped>
.component-playground {
  --pg-accent: #42b883;
  margin: 1.75rem 0;
  overflow: hidden;
  color: var(--ui-text);
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 1.5rem;
  box-shadow: 0 24px 70px -42px rgb(23 25 28 / 45%);
}

button, input { font: inherit; }
button { color: inherit; }

.playground-header, .playground-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .9rem 1rem;
}
.playground-header { border-bottom: 1px solid var(--ui-border); }
.playground-heading { display: flex; align-items: center; gap: .65rem; min-width: 0; }
.playground-dot { width: .55rem; height: .55rem; border-radius: 999px; background: var(--pg-accent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--pg-accent) 14%, transparent); }
.playground-title { font-size: .875rem; font-weight: 700; line-height: 1.15; }
.playground-subtitle { margin-top: .2rem; color: var(--ui-text-muted); font-size: .7rem; }
.playground-tabs { display: flex; padding: .2rem; background: var(--ui-bg-muted); border-radius: .75rem; }
.playground-tab { display: flex; align-items: center; gap: .35rem; padding: .42rem .65rem; border: 0; border-radius: .58rem; background: transparent; color: var(--ui-text-muted); cursor: pointer; font-size: .75rem; font-weight: 600; }
.playground-tab.is-active { color: var(--ui-text); background: var(--ui-bg); box-shadow: 0 1px 3px rgb(0 0 0 / 9%); }
.playground-tab svg { width: .85rem; height: .85rem; }

.preview-canvas {
  position: relative;
  min-height: 21rem;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 2.5rem 1.25rem;
  background:
    linear-gradient(var(--ui-border-muted) 1px, transparent 1px),
    linear-gradient(90deg, var(--ui-border-muted) 1px, transparent 1px),
    color-mix(in srgb, var(--ui-bg-muted) 55%, var(--ui-bg));
  background-size: 26px 26px;
}
.preview-glow { position: absolute; width: 14rem; height: 14rem; border-radius: 999px; filter: blur(55px); opacity: .2; pointer-events: none; }
.preview-glow-one { top: -6rem; left: 8%; background: #42b883; }
.preview-glow-two { right: 5%; bottom: -7rem; background: #818cf8; }
.preview-stage { position: relative; width: min(100%, 28rem); z-index: 1; }

.settings-card, .tab-panel, .accordion-demo, .rating-demo, .button-demo, .input-demo, .range-demo, .progress-demo, .checkbox-demo, .alert-demo > div, .card-demo, .separator-demo {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  box-shadow: 0 22px 50px -28px rgb(0 0 0 / 32%);
}
.settings-card { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.1rem; border-radius: 1.1rem; }
.settings-card strong, .settings-card span { display: block; }
.settings-card strong { font-size: .9rem; }
.settings-card div > span { margin-top: .2rem; color: var(--ui-text-muted); font-size: .75rem; }
.switch-control { width: 3rem; height: 1.75rem; padding: .2rem; border: 0; border-radius: 999px; background: var(--ui-bg-accented); cursor: pointer; transition: background .2s; }
.switch-control span { display: block; width: 1.35rem; height: 1.35rem; border-radius: 999px; background: white; box-shadow: 0 2px 5px rgb(0 0 0 / 22%); transition: transform .2s; }
.switch-control.is-on { background: var(--pg-accent); }
.switch-control.is-on span { transform: translateX(1.25rem); }

.segmented-control { display: grid; grid-template-columns: repeat(3, 1fr); gap: .25rem; padding: .25rem; margin-bottom: .75rem; border: 1px solid var(--ui-border); background: var(--ui-bg-muted); border-radius: .9rem; }
.segmented-control button { padding: .55rem; border: 0; border-radius: .65rem; background: transparent; color: var(--ui-text-muted); cursor: pointer; font-size: .76rem; font-weight: 600; }
.segmented-control button.is-active { color: var(--ui-text); background: var(--ui-bg); box-shadow: 0 2px 7px rgb(0 0 0 / 10%); }
.tab-panel { display: flex; align-items: center; gap: .8rem; padding: 1rem; border-radius: 1rem; }
.demo-icon, .card-icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; color: #047857; background: #dcfce7; border-radius: .8rem; }
.tab-panel strong, .tab-panel span { display: block; }
.tab-panel div > span { margin-top: .15rem; color: var(--ui-text-muted); font-size: .74rem; }

.accordion-demo { overflow: hidden; border-radius: 1rem; }
.accordion-item + .accordion-item { border-top: 1px solid var(--ui-border-muted); }
.accordion-item button { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; border: 0; background: transparent; cursor: pointer; font-size: .8rem; font-weight: 650; text-align: left; }
.accordion-item button svg { width: .95rem; transition: transform .2s; }
.accordion-item button svg.is-open { transform: rotate(180deg); }
.accordion-item p { padding: 0 1rem .85rem; margin: 0; color: var(--ui-text-muted); font-size: .74rem; line-height: 1.5; }

.rating-demo { padding: 1.4rem; border-radius: 1.2rem; text-align: center; }
.rating-demo > span { color: var(--ui-text-muted); font-size: .78rem; }
.rating-demo > strong { display: block; margin-top: .6rem; font-size: .78rem; }
.stars { display: flex; justify-content: center; gap: .25rem; margin-top: .65rem; }
.stars button { padding: .15rem; border: 0; background: transparent; color: var(--ui-border-accented); cursor: pointer; }
.stars button.is-active { color: #f59e0b; }
.stars svg { width: 1.7rem; height: 1.7rem; fill: currentColor; transition: transform .15s; }
.stars button:hover svg { transform: translateY(-2px) scale(1.08); }

.button-demo { display: flex; flex-direction: column; align-items: center; gap: .65rem; padding: 1.7rem; border-radius: 1.2rem; }
.primary-button, .card-demo button { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; padding: .7rem 1rem; border: 0; border-radius: 999px; background: #17191c; color: white; cursor: pointer; font-size: .8rem; font-weight: 650; box-shadow: 0 8px 18px -10px #000; }
.primary-button svg { width: 1rem; }
.button-demo > span { color: var(--ui-text-muted); font-size: .72rem; }

.input-demo { display: block; padding: 1.1rem; border-radius: 1rem; }
.input-demo > span { display: block; margin-bottom: .45rem; font-size: .75rem; font-weight: 650; }
.input-demo > div { display: flex; align-items: center; gap: .5rem; padding: .65rem .75rem; border: 1px solid var(--ui-border-accented); border-radius: .8rem; background: var(--ui-bg); transition: border-color .2s, box-shadow .2s; }
.input-demo > div:focus-within { border-color: var(--pg-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--pg-accent) 15%, transparent); }
.input-demo svg { width: 1rem; color: var(--ui-text-muted); }
.input-demo input { min-width: 0; flex: 1; border: 0; outline: 0; color: var(--ui-text); background: transparent; font-size: .78rem; }
.input-demo .input-check { color: var(--pg-accent); }
.input-demo small { display: block; margin-top: .45rem; color: var(--ui-text-muted); font-size: .68rem; }

.range-demo { padding: 1.2rem; border-radius: 1rem; }
.range-heading, .range-heading span { display: flex; align-items: center; justify-content: space-between; gap: .4rem; }
.range-heading { font-size: .78rem; }
.range-heading svg { width: .95rem; }
.range-demo input { width: 100%; margin: 1rem 0 .2rem; accent-color: var(--pg-accent); cursor: pointer; }
.range-labels { display: flex; justify-content: space-between; color: var(--ui-text-muted); font-size: .65rem; }

.progress-demo { display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem; border-radius: 1.1rem; }
.progress-ring { width: 5rem; height: 5rem; display: grid; place-items: center; flex: 0 0 auto; border-radius: 999px; background: conic-gradient(var(--pg-accent) var(--progress), var(--ui-bg-accented) 0); }
.progress-ring div { width: 3.9rem; height: 3.9rem; display: grid; place-items: center; border-radius: inherit; background: var(--ui-bg); font-size: .8rem; font-weight: 750; }
.progress-demo strong, .progress-demo span { display: block; }
.progress-demo strong { font-size: .82rem; }
.progress-demo span { margin-top: .15rem; color: var(--ui-text-muted); font-size: .7rem; }
.progress-demo button { margin-top: .65rem; padding: .35rem .55rem; border: 1px solid var(--ui-border); border-radius: .55rem; background: var(--ui-bg-muted); cursor: pointer; font-size: .68rem; font-weight: 600; }

.checkbox-demo { position: relative; display: flex; align-items: flex-start; gap: .7rem; padding: 1rem; border-radius: 1rem; cursor: pointer; }
.checkbox-demo input { position: absolute; opacity: 0; }
.checkbox-box { width: 1.25rem; height: 1.25rem; display: grid; place-items: center; flex: 0 0 auto; border: 1px solid var(--ui-border-accented); border-radius: .38rem; }
.checkbox-demo input:checked + .checkbox-box { color: white; background: var(--pg-accent); border-color: var(--pg-accent); }
.checkbox-box svg { width: .85rem; stroke-width: 3; }
.checkbox-demo strong, .checkbox-demo small { display: block; }
.checkbox-demo strong { font-size: .8rem; }
.checkbox-demo small { margin-top: .15rem; color: var(--ui-text-muted); font-size: .7rem; }

.alert-demo > div { display: flex; align-items: flex-start; gap: .7rem; padding: .9rem; border-color: #a7f3d0; border-radius: 1rem; background: color-mix(in srgb, #ecfdf5 82%, var(--ui-bg)); color: #064e3b; }
.alert-icon { display: grid; place-items: center; flex: 0 0 auto; width: 1.8rem; height: 1.8rem; border-radius: .55rem; background: #d1fae5; color: #059669; }
.alert-demo strong, .alert-demo small { display: block; }
.alert-demo strong { font-size: .78rem; }
.alert-demo small { margin-top: .15rem; color: #047857; font-size: .7rem; }
.alert-demo div > button { margin-left: auto; padding: .15rem; border: 0; background: transparent; cursor: pointer; color: #047857; }
.restore-alert { display: block; margin: auto; padding: .55rem .8rem; border: 1px solid var(--ui-border); border-radius: .7rem; background: var(--ui-bg); cursor: pointer; font-size: .75rem; }
.alert-enter-active, .alert-leave-active { transition: opacity .2s, transform .2s; }
.alert-enter-from, .alert-leave-to { opacity: 0; transform: translateY(5px); }

.card-demo { position: relative; max-width: 20rem; padding: 1.3rem; margin: auto; border-radius: 1.3rem; }
.card-badge { position: absolute; top: 1.15rem; right: 1.15rem; padding: .28rem .45rem; border-radius: 999px; color: #047857; background: #dcfce7; font-size: .56rem; font-weight: 800; letter-spacing: .08em; }
.card-demo h3 { margin: 1rem 0 .25rem; font-size: 1rem; }
.card-demo p { margin: 0; color: var(--ui-text-muted); font-size: .74rem; line-height: 1.5; }
.card-demo > div { margin: 1rem 0; }
.card-demo > div strong { font-size: 1.6rem; }
.card-demo > div span { color: var(--ui-text-muted); font-size: .7rem; }
.card-demo button { width: 100%; }
.card-demo button svg { width: .9rem; }

.badge-demo { display: flex; flex-wrap: wrap; justify-content: center; gap: .55rem; }
.status-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .4rem .6rem; color: #047857; background: #dcfce7; border: 1px solid #a7f3d0; border-radius: 999px; font-size: .7rem; font-weight: 650; box-shadow: 0 10px 25px -18px #000; }
.status-badge i { width: .4rem; height: .4rem; border-radius: 999px; background: #10b981; box-shadow: 0 0 0 3px #a7f3d0; }
.status-badge svg { width: .8rem; }
.status-badge.neutral { color: var(--ui-text-toned); background: var(--ui-bg); border-color: var(--ui-border); }
.status-badge.warning { color: #92400e; background: #fffbeb; border-color: #fde68a; }

.toggle-demo { text-align: center; }
.toggle-demo > span { display: block; margin-bottom: .45rem; color: var(--ui-text-muted); font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; }
.toggle-demo > div { display: inline-flex; gap: .25rem; padding: .3rem; border: 1px solid var(--ui-border); border-radius: .8rem; background: var(--ui-bg); box-shadow: 0 15px 35px -25px #000; }
.toggle-demo button { display: grid; place-items: center; width: 2.3rem; height: 2.3rem; border: 0; border-radius: .55rem; background: transparent; cursor: pointer; }
.toggle-demo button:hover { background: var(--ui-bg-muted); }
.toggle-demo button.is-active { color: #047857; background: #dcfce7; }
.toggle-demo p { margin: 1rem 0 0; font-size: .82rem; }

.separator-demo { padding: 1rem; border-radius: 1rem; }
.separator-demo > div:not(.separator-line) { display: flex; align-items: center; gap: .65rem; }
.separator-demo > div > svg { width: 1rem; color: var(--ui-text-muted); }
.separator-demo strong, .separator-demo small { display: block; }
.separator-demo strong { font-size: .76rem; }
.separator-demo small { color: var(--ui-text-muted); font-size: .67rem; }
.separator-line { display: flex; align-items: center; gap: .6rem; margin: .9rem 0; color: var(--ui-text-dimmed); font-size: .55rem; letter-spacing: .1em; }
.separator-line::before, .separator-line::after { content: ''; height: 1px; flex: 1; background: var(--ui-border); }

.unknown-demo { position: relative; z-index: 1; max-width: 22rem; text-align: center; }
.unknown-demo > span { width: 3rem; height: 3rem; display: grid; place-items: center; margin: auto; color: #047857; background: #dcfce7; border-radius: 1rem; }
.unknown-demo strong { display: block; margin-top: .8rem; font-size: .9rem; }
.unknown-demo p { margin: .35rem 0 .8rem; color: var(--ui-text-muted); font-size: .74rem; }
.unknown-demo button { display: inline-flex; align-items: center; gap: .35rem; padding: .55rem .75rem; border: 1px solid var(--ui-border); border-radius: .7rem; background: var(--ui-bg); cursor: pointer; font-size: .72rem; font-weight: 650; }

.code-view { min-height: 21rem; background: #111318; color: #e5e7eb; }
.code-toolbar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: .7rem .85rem; border-bottom: 1px solid #262a32; background: #171a20; color: #9ca3af; font-size: .7rem; }
.code-toolbar > span:first-child { display: flex; gap: .35rem; }
.code-toolbar i { width: .55rem; height: .55rem; border-radius: 999px; background: #ef4444; }
.code-toolbar i:nth-child(2) { background: #f59e0b; }
.code-toolbar i:nth-child(3) { background: #22c55e; }
.code-toolbar button { justify-self: end; display: flex; align-items: center; gap: .35rem; padding: .35rem .5rem; border: 1px solid #30343d; border-radius: .5rem; background: #20242c; color: #d1d5db; cursor: pointer; font-size: .68rem; }
.code-toolbar button svg { width: .8rem; }
.code-view pre { max-height: 25rem; overflow: auto; padding: 1.2rem; margin: 0; background: transparent; }
.code-view code { color: #dbeafe; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .72rem; line-height: 1.65; white-space: pre; }

.playground-footer { min-height: 2.8rem; border-top: 1px solid var(--ui-border); color: var(--ui-text-muted); font-size: .7rem; }
.playground-footer button { display: flex; align-items: center; gap: .25rem; flex: 0 0 auto; padding: 0; border: 0; background: transparent; color: var(--ui-text); cursor: pointer; font-size: .7rem; font-weight: 650; }
.playground-footer button svg { width: .75rem; }

@media (max-width: 520px) {
  .playground-header { align-items: flex-start; flex-direction: column; }
  .playground-tabs { width: 100%; }
  .playground-tab { flex: 1; justify-content: center; }
  .preview-canvas { min-height: 19rem; padding: 1.75rem .8rem; }
  .progress-demo { align-items: flex-start; }
  .playground-footer > span { display: none; }
  .playground-footer { justify-content: flex-end; }
}
</style>
