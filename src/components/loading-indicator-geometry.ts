/**
 * Shape sampling and spring/rotation adapted from m3ui-vue MLoadingIndicator.vue.
 * Copyright (c) 2026 Fadel. MIT license; see THIRD_PARTY_NOTICES.md.
 *
 * These are analytic silhouettes, rather than a port of Android's polygon vertex data.
 * MDV normalizes their circular bounds and closes each spring segment exactly so
 * the final-to-first morph and quarter turns remain continuous at every boundary.
 */

const SAMPLE_COUNT = 120
const CENTER = 50
const RADIUS = 46
const MAX_RADIUS = 49
const MORPH_DURATION = 650
const ROTATION_DURATION = 4666
const DAMPING_RATIO = 0.6
const FREQUENCY = Math.sqrt(200)
const DAMPED_FREQUENCY = FREQUENCY * Math.sqrt(1 - DAMPING_RATIO ** 2)
const TAU = Math.PI * 2

type Silhouette = (angle: number) => number

function ellipse(horizontal: number, vertical: number): Silhouette {
  return (angle) =>
    (horizontal * vertical) / Math.hypot(vertical * Math.cos(angle), horizontal * Math.sin(angle))
}

// Soft burst → nine-sided cookie → pentagon → pill → sunny → four-sided cookie → oval.
const silhouettes: readonly Silhouette[] = [
  (angle) => 1 + 0.07 * Math.cos(10 * angle),
  (angle) => 1 + 0.15 * Math.cos(9 * angle),
  (angle) => 1 + 0.1 * Math.cos(5 * angle) + 0.02 * Math.cos(10 * angle),
  ellipse(1.3, 0.7),
  (angle) => 1 + 0.22 * Math.cos(8 * angle),
  (angle) => 1 + 0.16 * Math.cos(4 * angle),
  ellipse(1.2, 0.8),
]

/** Each path has matching cubic control points, making interpolation deterministic. */
const shapes = silhouettes.map((silhouette) => {
  const radii = Array.from({ length: SAMPLE_COUNT }, (_, index) =>
    silhouette((index / SAMPLE_COUNT) * TAU - Math.PI / 2),
  )
  const scale = RADIUS / Math.max(...radii)
  const points = radii.map((radius, index) => {
    const angle = (index / SAMPLE_COUNT) * TAU - Math.PI / 2
    return [Math.cos(angle) * radius * scale, Math.sin(angle) * radius * scale] as const
  })
  const coordinates: number[] = [...points[0]!]
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const previous = points[(index + SAMPLE_COUNT - 1) % SAMPLE_COUNT]!
    const current = points[index]!
    const next = points[(index + 1) % SAMPLE_COUNT]!
    const after = points[(index + 2) % SAMPLE_COUNT]!
    coordinates.push(
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
      next[0] - (after[0] - current[0]) / 6,
      next[1] - (after[1] - current[1]) / 6,
      next[0],
      next[1],
    )
  }
  return coordinates
})

function spring(time: number) {
  const decay = Math.exp(-DAMPING_RATIO * FREQUENCY * time)
  return (
    1 -
    decay *
      (Math.cos(DAMPED_FREQUENCY * time) +
        ((DAMPING_RATIO * FREQUENCY) / DAMPED_FREQUENCY) * Math.sin(DAMPED_FREQUENCY * time))
  )
}

const springEnd = spring(MORPH_DURATION / 1000)

export interface LoadingIndicatorFrame {
  path: string
  rotation: number
}

export function loadingIndicatorSize(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) ? Math.max(24, Math.min(240, value)) : 48
}

export function loadingIndicatorFrame(milliseconds: number): LoadingIndicatorFrame {
  const time = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0
  const segment = Math.floor(time / MORPH_DURATION)
  const progress = spring((time % MORPH_DURATION) / 1000) / springEnd
  const from = shapes[segment % shapes.length]!
  const to = shapes[(segment + 1) % shapes.length]!
  let path = ''

  for (let index = 0; index < from.length; index += 2) {
    const x = from[index]! + (to[index]! - from[index]!) * progress
    const y = from[index + 1]! + (to[index + 1]! - from[index + 1]!) * progress
    // Bounds include the Bézier handles, so rotation and spring overshoot cannot clip the SVG.
    const scale = Math.min(1, MAX_RADIUS / Math.max(1, Math.hypot(x, y)))
    const command = index === 0 ? 'M' : (index - 2) % 6 === 0 ? 'C' : ' '
    path += `${command}${(CENTER + x * scale).toFixed(2)},${(CENTER + y * scale).toFixed(2)}`
  }

  const rotation =
    ((segment % 4) * 90 + progress * 90 + ((time % ROTATION_DURATION) / ROTATION_DURATION) * 360) %
    360
  return { path: `${path}Z`, rotation }
}
