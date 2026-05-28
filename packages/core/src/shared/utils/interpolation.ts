// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/interpolation.ts`.
//
// Adapted for vyui: the upstream module redeclares an identical `Extrapolation`
// enum and friends — duplicating those across the JS and main-thread variants
// would force callers to pick a side at import time. Here we re-export the
// shared shape from `./interpolationJS` so both `interpolate` (main thread) and
// `interpolateJS` (background) share one set of types.

import {
  type ExtrapolationConfig,
  Extrapolation,
  type ExtrapolationType,
  interpolateJS,
} from './interpolationJS'

export { Extrapolation, type ExtrapolationConfig, type ExtrapolationType, interpolateJS }

interface InterpolationNarrowedInput {
  leftEdgeInput: number
  rightEdgeInput: number
  leftEdgeOutput: number
  rightEdgeOutput: number
}

interface RequiredExtrapolationConfig {
  extrapolateLeft: Extrapolation
  extrapolateRight: Extrapolation
}

function getVal(
  type: Extrapolation,
  coefficient: number,
  val: number,
  leftEdgeOutput: number,
  rightEdgeOutput: number,
  x: number,
): number {
  'main thread'

  switch (type) {
    case Extrapolation.IDENTITY:
      return x
    case Extrapolation.CLAMP:
      if (coefficient * val < coefficient * leftEdgeOutput) {
        return leftEdgeOutput
      }
      return rightEdgeOutput
    default:
      return val
  }
}

function isExtrapolate(value: string): value is Extrapolation {
  'main thread'

  return (
    value === Extrapolation.EXTEND
    || value === Extrapolation.CLAMP
    || value === Extrapolation.IDENTITY
  )
}

// validates extrapolations type
// if type is correct, converts it to ExtrapolationConfig
function validateType(type: ExtrapolationType): RequiredExtrapolationConfig {
  'main thread'
  // initialize extrapolationConfig with default extrapolation
  const extrapolationConfig: RequiredExtrapolationConfig = {
    extrapolateLeft: Extrapolation.EXTEND,
    extrapolateRight: Extrapolation.EXTEND,
  }

  if (!type) {
    return extrapolationConfig
  }

  if (typeof type === 'string') {
    if (!isExtrapolate(type)) {
      throw new Error(
        `Unsupported value for "interpolate" \nSupported values: ["extend", "clamp", "identity", Extrapolation.CLAMP, Extrapolation.EXTEND, Extrapolation.IDENTITY]\n Valid example:
        interpolate(value, [inputRange], [outputRange], "clamp")`,
      )
    }
    extrapolationConfig.extrapolateLeft = type
    extrapolationConfig.extrapolateRight = type
    return extrapolationConfig
  }

  // otherwise type is extrapolation config object
  if (
    (type.extrapolateLeft && !isExtrapolate(type.extrapolateLeft))
    || (type.extrapolateRight && !isExtrapolate(type.extrapolateRight))
  ) {
    throw new Error(
      `Unsupported value for "interpolate" \nSupported values: ["extend", "clamp", "identity", Extrapolation.CLAMP, Extrapolation.EXTEND, Extrapolation.IDENTITY]\n Valid example:
      interpolate(value, [inputRange], [outputRange], {
        extrapolateLeft: Extrapolation.CLAMP,
        extrapolateRight: Extrapolation.IDENTITY
      }})`,
    )
  }

  Object.assign(extrapolationConfig, type)
  return extrapolationConfig
}

function internalInterpolate(
  x: number,
  narrowedInput: InterpolationNarrowedInput,
  extrapolationConfig: RequiredExtrapolationConfig,
) {
  'main thread'
  const { leftEdgeInput, rightEdgeInput, leftEdgeOutput, rightEdgeOutput }
    = narrowedInput
  if (rightEdgeInput - leftEdgeInput === 0) {
    return leftEdgeOutput
  }
  const progress = (x - leftEdgeInput) / (rightEdgeInput - leftEdgeInput)
  const val = leftEdgeOutput + progress * (rightEdgeOutput - leftEdgeOutput)
  const coefficient = rightEdgeOutput >= leftEdgeOutput ? 1 : -1

  if (coefficient * val < coefficient * leftEdgeOutput) {
    return getVal(
      extrapolationConfig.extrapolateLeft,
      coefficient,
      val,
      leftEdgeOutput,
      rightEdgeOutput,
      x,
    )
  }
  else if (coefficient * val > coefficient * rightEdgeOutput) {
    return getVal(
      extrapolationConfig.extrapolateRight,
      coefficient,
      val,
      leftEdgeOutput,
      rightEdgeOutput,
      x,
    )
  }

  return val
}

/**
 * Lets you map a value from one range to another using linear interpolation.
 *
 * Main-thread worklet variant — carries the `'main thread'` directive so it
 * runs in-thread when invoked via `runOnMainThread`. For the background-thread
 * variant see {@link interpolateJS}.
 *
 * @param x - A number from the `input` range that is going to be mapped to
 *   the `output` range.
 * @param inputRange - An array of numbers specifying the input range of the
 *   interpolation.
 * @param outputRange - An array of numbers specifying the output range of the
 *   interpolation.
 * @param type - Determines what happens when the `value` goes beyond the
 *   `input` range. Defaults to `Extrapolation.EXTEND` -
 *   {@link ExtrapolationType}.
 * @returns A mapped value within the output range.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolate
 */
export function interpolate(
  x: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  type?: ExtrapolationType,
): number {
  'main thread'
  if (inputRange.length < 2 || outputRange.length < 2) {
    throw new Error(
      'Interpolation input and output ranges should contain at least two values.',
    )
  }

  const extrapolationConfig = validateType(type)
  const length = inputRange.length
  const narrowedInput: InterpolationNarrowedInput = {
    leftEdgeInput: inputRange[0]!,
    rightEdgeInput: inputRange[1]!,
    leftEdgeOutput: outputRange[0]!,
    rightEdgeOutput: outputRange[1]!,
  }
  if (length > 2) {
    if (x > inputRange[length - 1]!) {
      narrowedInput.leftEdgeInput = inputRange[length - 2]!
      narrowedInput.rightEdgeInput = inputRange[length - 1]!
      narrowedInput.leftEdgeOutput = outputRange[length - 2]!
      narrowedInput.rightEdgeOutput = outputRange[length - 1]!
    }
    else {
      for (let i = 1; i < length; ++i) {
        if (x <= inputRange[i]!) {
          narrowedInput.leftEdgeInput = inputRange[i - 1]!
          narrowedInput.rightEdgeInput = inputRange[i]!
          narrowedInput.leftEdgeOutput = outputRange[i - 1]!
          narrowedInput.rightEdgeOutput = outputRange[i]!
          break
        }
      }
    }
  }

  return internalInterpolate(x, narrowedInput, extrapolationConfig)
}
