// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Pagination from './story/_Pagination.vue'

describe('default Pagination', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Pagination))
  })

  it('selects the first page by default', () => {
    expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBe('true')
    expect(container.querySelector('[accessibility-label="Page 2"]')?.getAttribute('data-selected')).toBeNull()
  })

  describe('after tapping Next Page', () => {
    beforeEach(async () => {
      fireEvent.tap(container.querySelector('[accessibility-label="Next Page"]')!)
      await waitForUpdate()
    })

    it('advances to page 2', () => {
      expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBeNull()
      expect(container.querySelector('[accessibility-label="Page 2"]')?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('after tapping Page 3', () => {
    beforeEach(async () => {
      fireEvent.tap(container.querySelector('[accessibility-label="Page 3"]')!)
      await waitForUpdate()
    })

    it('selects page 3', () => {
      expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBeNull()
      expect(container.querySelector('[accessibility-label="Page 3"]')?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('after tapping Last Page', () => {
    beforeEach(async () => {
      fireEvent.tap(container.querySelector('[accessibility-label="Last Page"]')!)
      await waitForUpdate()
    })

    it('selects page 10', () => {
      expect(container.querySelector('[accessibility-label="Page 1"]')).toBeNull()
      expect(container.querySelector('[accessibility-label="Page 10"]')?.getAttribute('data-selected')).toBe('true')
    })
  })
})

describe('Pagination with disabled root', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Pagination, { root: { disabled: true } }))
  })

  it('ignores tapping Next Page', async () => {
    fireEvent.tap(container.querySelector('[accessibility-label="Next Page"]')!)
    await waitForUpdate()
    expect(container.querySelector('[data-selected="true"]')?.getAttribute('accessibility-label')).toBe('Page 1')
  })

  it('ignores tapping Last Page', async () => {
    fireEvent.tap(container.querySelector('[accessibility-label="Last Page"]')!)
    await waitForUpdate()
    expect(container.querySelector('[data-selected="true"]')?.getAttribute('accessibility-label')).toBe('Page 1')
  })

  it('ignores tapping a non-selected page', async () => {
    fireEvent.tap(container.querySelector('[accessibility-label="Page 2"]')!)
    await waitForUpdate()
    expect(container.querySelector('[data-selected="true"]')?.getAttribute('accessibility-label')).toBe('Page 1')
  })
})

describe('show-edges Pagination', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Pagination, { showEdges: true }))
  })

  it('selects the first page by default', () => {
    expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBe('true')
  })

  it('always shows first and last page', () => {
    expect(container.querySelector('[accessibility-label="Page 1"]')).not.toBeNull()
    expect(container.querySelector('[accessibility-label="Page 2"]')).not.toBeNull()
  })

  describe('after tapping Next Page', () => {
    beforeEach(async () => {
      fireEvent.tap(container.querySelector('[accessibility-label="Next Page"]')!)
      await waitForUpdate()
    })

    it('selects page 2', () => {
      expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBeNull()
      expect(container.querySelector('[accessibility-label="Page 2"]')?.getAttribute('data-selected')).toBe('true')
    })
  })
})

describe('0 total value', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Pagination, { root: { total: 0 } }))
  })

  it('selects the first page by default', () => {
    expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBe('true')
  })
})

describe('small total value', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Pagination, { root: { total: 13 } }))
  })

  it('shows only 2 page buttons', () => {
    expect(container.querySelectorAll('[data-type="page"]').length).toBe(2)
  })

  describe('after tapping Next Page', () => {
    beforeEach(async () => {
      fireEvent.tap(container.querySelector('[accessibility-label="Next Page"]')!)
      await waitForUpdate()
    })

    it('advances to page 2', () => {
      expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('data-selected')).toBeNull()
      expect(container.querySelector('[accessibility-label="Page 2"]')?.getAttribute('data-selected')).toBe('true')
    })
  })
})
