import type { MdvCircularProgressProps } from './progress.types'

export interface ProgressOptions {
  kind: 'linear' | 'circular'
  value: number
  max: number
  progress: number
  indeterminate: boolean
  wavy: boolean
  thickness: number
  size: number
  height: number
}

export interface ProgressFrame {
  progress: number
  amplitude: number
  phase: number
  elapsed: number
  rotation: number
}

export interface ProgressDrawing {
  active: string
  track: string
  stopX: number
  stopRadius: number
  width: number
  height: number
  thickness: number
}

const TAU = Math.PI * 2

function positiveNumber(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

export function progressOptions(
  props: MdvCircularProgressProps,
  kind: ProgressOptions['kind'],
): ProgressOptions {
  const max = positiveNumber(props.max, 100)
  const value = Number.isFinite(props.value) ? Math.max(0, Math.min(max, props.value!)) : 0
  const wavy = props.variant === 'wavy'
  const size = positiveNumber(props.size, wavy ? 48 : 40)
  // A stroke must leave space for the inside of a custom-sized circle.
  const stroke = positiveNumber(props.thickness, 4)
  const thickness = kind === 'circular' ? Math.min(stroke, size / 2) : stroke
  return {
    kind,
    value,
    max,
    progress: value / max,
    indeterminate: props.indeterminate === true,
    wavy,
    thickness,
    size,
    height: kind === 'circular' ? size : thickness + (wavy ? 6 : 0),
  }
}

export function progressAmplitude(options: ProgressOptions) {
  return options.wavy &&
    (options.indeterminate || (options.progress > 0.1 && options.progress < 0.95))
    ? 1
    : 0
}

/** Evaluate a cubic Bézier timing curve by solving its x coordinate first. */
export function progressEasing(x: number, x1: number, y1: number, x2: number, y2: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const coordinate = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3
  let low = 0
  let high = 1
  for (let i = 0; i < 12; i += 1) {
    const t = (low + high) / 2
    if (coordinate(t, x1, x2) < x) low = t
    else high = t
  }
  return coordinate((low + high) / 2, y1, y2)
}

const format = (value: number) => String(Number(value.toFixed(3)))
const point = (x: number, y: number) => `${format(x)} ${format(y)}`

function line(start: number, end: number, height: number) {
  return end > start ? `M${point(start, height / 2)}H${format(end)}` : ''
}

function linearWave(
  start: number,
  end: number,
  height: number,
  amplitude: number,
  wavelength: number,
  phase: number,
) {
  if (amplitude <= 0) return line(start, end, height)
  // Quadratic half-waves match the official sine-like contour. Trim the first
  // and last curve analytically, so each moving endpoint remains round.
  const half = Math.max(wavelength / 2, (end - start) / 2046)
  const shift = (phase / TAU) * wavelength
  const offset = (start + shift) / half
  let segment = Math.floor(offset)
  let local = offset - segment
  let x = start
  const y = (t: number, direction: number) => height / 2 + 4 * amplitude * direction * t * (1 - t)
  const direction = () => (segment % 2 === 0 ? 1 : -1)
  const points: string[] = [`M${point(x, y(local, direction()))}`]
  const count = Math.min(2048, Math.ceil((end - start) / half) + 2)
  for (let i = 0; i < count && x < end; i += 1) {
    const next = Math.min(end, x + (1 - local) * half)
    const to = local + (next - x) / half
    const controlY =
      y(local, direction()) + 2 * amplitude * direction() * (1 - 2 * local) * (to - local)
    points.push(`Q${point((x + next) / 2, controlY)} ${point(next, y(to, direction()))}`)
    x = next
    local = 0
    segment += 1
  }
  return points.join('')
}

function circularPath(
  size: number,
  radius: number,
  start: number,
  sweep: number,
  amplitude = 0,
  waves = 0,
  phase = 0,
) {
  if (sweep <= 0) return ''
  const full = sweep >= TAU - 0.000001
  const center = size / 2
  if (amplitude <= 0) {
    const at = (angle: number) =>
      point(center + radius * Math.cos(angle), center + radius * Math.sin(angle))
    const middle = start + sweep / 2
    return `M${at(start)}A${format(radius)} ${format(radius)} 0 0 1 ${at(middle)}A${format(radius)} ${format(radius)} 0 0 1 ${at(start + sweep)}${full ? 'Z' : ''}`
  }
  const count = Math.max(2, Math.min(2048, Math.ceil((sweep / TAU) * waves * 24)))
  const points: string[] = []
  for (let i = 0; i <= count; i += 1) {
    const angle = start + (sweep * i) / count
    const r = radius - amplitude + amplitude * Math.cos(angle * waves + phase)
    points.push(
      `${i ? 'L' : 'M'}${point(center + r * Math.cos(angle), center + r * Math.sin(angle))}`,
    )
  }
  return points.join('') + (full ? 'Z' : '')
}

function indeterminateLines(elapsed: number) {
  const time = elapsed % 1750
  const position = (delay: number, duration: number) =>
    progressEasing((time - delay) / duration, 0.3, 0, 0.8, 0.15)
  return [
    [position(250, 1000), position(0, 1000)],
    [position(900, 850), position(650, 850)],
  ] as const
}

export function indeterminateCircle(elapsed: number) {
  const time = elapsed % 6000
  const half = time < 3000 ? time / 3000 : (time - 3000) / 3000
  // Official keyframe easing applies to the interval after its timestamp:
  // growth is linear; only contraction uses the standard easing curve.
  const progress =
    time < 3000 ? 0.1 + 0.77 * half : 0.87 - 0.77 * progressEasing(half, 0.2, 0, 0, 1)
  const step = Math.floor(time / 1500)
  // Each 90-degree advance is linear over 300ms, followed by a 1200ms hold.
  // Applying deceleration here concentrates almost half the turn in one frame.
  const additional = step + Math.min((time % 1500) / 300, 1)
  return { progress, rotation: (time / 6000) * TAU * 3 + (additional * Math.PI) / 2 }
}

export function drawProgress(
  options: ProgressOptions,
  frame: ProgressFrame,
  linearWidth = 240,
): ProgressDrawing {
  const width = options.kind === 'circular' ? options.size : Math.max(1, linearWidth)
  const height = options.height
  const thickness = Math.min(options.thickness, width)
  const result: ProgressDrawing = {
    active: '',
    track: '',
    stopX: 0,
    stopRadius: 0,
    width,
    height,
    thickness,
  }
  if (options.kind === 'circular') {
    const radius = (options.size - thickness) / 2
    if (radius <= 0) return result
    const current = options.indeterminate ? indeterminateCircle(frame.elapsed) : frame
    const sweep = current.progress * TAU
    const start = -Math.PI / 2 + current.rotation
    const gap = Math.min((4 + thickness) / radius, sweep)
    const amplitude = Math.min(1.6, radius / 4) * frame.amplitude
    const waves = Math.max(5, Math.min(256, Math.round((TAU * radius) / 15)))
    result.active = circularPath(width, radius, start, sweep, amplitude, waves, frame.phase)
    // Flat indeterminate circles use a transparent track in the official defaults.
    if (!options.indeterminate || options.wavy) {
      result.track = circularPath(width, radius, start + sweep + gap, TAU - sweep - gap * 2)
    }
    return result
  }

  const segments = options.indeterminate ? indeterminateLines(frame.elapsed) : [[0, frame.progress]]
  const cap = thickness / 2
  const wavelength = options.indeterminate ? 20 : 40
  const active: string[] = []
  const tracks: string[] = []
  let trackStart = cap
  for (const [from = 0, to = 0] of [...segments].sort((a, b) => a[0]! - b[0]!)) {
    if (to <= from) continue
    const start = Math.max(cap, Math.min(width - cap, from * width))
    const end = Math.max(cap, Math.min(width - cap, to * width))
    // Open the gap gradually as the first cap enters the track, rather than
    // removing a full 4px of track on the first nonzero animation frame.
    const spacing = options.wavy
      ? Math.min(4, Math.max(0, to * width - cap)) + (to * width >= cap ? thickness : 0)
      : Math.min(to * width, thickness + 4)
    const before = options.wavy ? start - spacing : from * width - spacing
    if (before > trackStart) {
      tracks.push(line(trackStart, before, height))
    }
    // A very small positive progress draws a round cap, while zero draws nothing.
    active.push(
      end === start
        ? `M${point(start, height / 2)}h0.001`
        : linearWave(start, end, height, 3 * frame.amplitude, wavelength, frame.phase),
    )
    trackStart = Math.max(trackStart, (options.wavy ? end : to * width) + spacing)
  }
  if (trackStart < width - cap) tracks.push(line(trackStart, width - cap, height))
  result.active = active.join('')
  result.track = tracks.join('')
  if (!options.indeterminate) {
    const stopSize = Math.min(4, thickness)
    const stopOffset = Math.min(6, (thickness - stopSize) / 2)
    const right = width - stopOffset
    const left = Math.max(right - stopSize, Math.min(width, frame.progress * width + cap))
    result.stopRadius = Math.max(0, right - left) / 2
    result.stopX = left + result.stopRadius
  }
  return result
}
