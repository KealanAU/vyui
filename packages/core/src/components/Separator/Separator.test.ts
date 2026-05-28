// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Separator from './story/_Separator.vue'

describe('given a default Separator', () => {
  it('should render', () => {
    const { container } = render(Separator)
    expect(container).toBeTruthy()
  })
})

describe('given a vertical Separator', () => {
  it('should render', () => {
    const { container } = render(Separator, { orientation: 'vertical' })
    expect(container).toBeTruthy()
  })
})
