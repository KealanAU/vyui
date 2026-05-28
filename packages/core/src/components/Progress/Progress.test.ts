// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import { sleep } from '@/test'
import Progress from './story/_Progress.vue'

describe('given a default Progress', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Progress))
  })

  it('should render', () => {
    expect(container).toBeTruthy()
  })

  it('should contain correct initial value', () => {
    expect(container.innerHTML).toContain('data-value="0"')
  })

  describe('after 200ms', () => {
    beforeEach(async () => {
      await sleep(200)
      await waitForUpdate()
    })

    it('should contain updated value', () => {
      expect(container.innerHTML).toContain('data-value="50"')
    })
  })
})
