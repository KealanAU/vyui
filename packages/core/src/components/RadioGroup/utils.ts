import type { VyCustomEvent } from '@/shared/handleAndDispatchCustomEvent'
import type { AcceptableValue } from '@/shared/types'
import { handleAndDispatchCustomEvent } from '@/shared'

export type SelectEvent = VyCustomEvent<{ originalEvent: any, value?: AcceptableValue }>
export const RADIO_SELECT = 'radio.select'

export function handleSelect(event: any, value: AcceptableValue | undefined, callback: (event: SelectEvent) => void) {
  const eventDetail = { originalEvent: event, value }
  handleAndDispatchCustomEvent(RADIO_SELECT, callback, eventDetail)
}
