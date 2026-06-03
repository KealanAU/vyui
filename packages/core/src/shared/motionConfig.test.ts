import { afterEach, describe, expect, it } from 'vitest'
import { motionAnimationStyle, motionConfig } from './motionConfig'

const defaults = { ...motionConfig }
afterEach(() => {
  Object.assign(motionConfig, defaults)
})

describe('motionConfig', () => {
  it('exposes reactive timing defaults', () => {
    expect(typeof motionConfig.enterMs).toBe('number')
    expect(typeof motionConfig.exitMs).toBe('number')
    expect(typeof motionConfig.easing).toBe('string')
  })

  it('motionAnimationStyle picks the enter duration + current easing', () => {
    motionConfig.enterMs = 200
    motionConfig.exitMs = 120
    motionConfig.easing = 'ease-out'
    expect(motionAnimationStyle(false)).toEqual({
      animationDuration: '200ms',
      animationTimingFunction: 'ease-out',
    })
  })

  it('motionAnimationStyle picks the exit duration when leaving', () => {
    motionConfig.enterMs = 200
    motionConfig.exitMs = 120
    motionConfig.easing = 'linear'
    expect(motionAnimationStyle(true)).toEqual({
      animationDuration: '120ms',
      animationTimingFunction: 'linear',
    })
  })
})
