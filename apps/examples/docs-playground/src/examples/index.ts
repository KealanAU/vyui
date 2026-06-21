import type { Component } from 'vue'

import AccordionExample from './accordion/AccordionExample.vue'
import AccordionMultiple from './accordion/AccordionMultiple.vue'
import AccordionDisabled from './accordion/AccordionDisabled.vue'
import AccordionControlled from './accordion/AccordionControlled.vue'
import AccordionAnatomy from './accordion/AccordionAnatomy.vue'

/**
 * Registry of every embeddable docs example, keyed by the id passed from the
 * docs host via `<lynx-view global-props='{"example":"<id>"}'>`. Ids are the
 * kebab-case file basename; keep them in sync with the docs markdown.
 */
export const examples: Record<string, Component> = {
  'accordion-example': AccordionExample,
  'accordion-multiple': AccordionMultiple,
  'accordion-disabled': AccordionDisabled,
  'accordion-controlled': AccordionControlled,
  'accordion-anatomy': AccordionAnatomy,
}
