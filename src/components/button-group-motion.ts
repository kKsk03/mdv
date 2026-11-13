import type { ButtonGroupMember } from './button-group-context'
import type { MdvButtonGroupVariant } from './button-group.types'

interface GroupMotionOptions {
  element(): HTMLElement | null
  row(): HTMLElement | null
  members(): ButtonGroupMember[]
  variant(): MdvButtonGroupVariant
}

interface MemberGeometry {
  member: ButtonGroupMember
  element: HTMLElement
  surface: HTMLElement
  width: number
  height: number
  inset: number
  capacity: number
  growth: number
  position: number[]
  velocity: number[]
  target: number[]
}

const corners = { xs: 4, s: 8, m: 8, l: 16, xl: 20 }
const pressedCorners = { xs: 4, s: 4, m: 4, l: 12, xl: 16 }
const buttonCorners = { xs: 12, s: 12, m: 16, l: 28, xl: 28 }
const buttonPressed = { xs: 8, s: 8, m: 12, l: 16, xl: 16 }
const number = (value: string | undefined) => Number.parseFloat(value ?? '') || 0

/** 官网 15% 宽度联动；按成员保存弹簧状态，快速反向时保留速度。 */
export function createButtonGroupMotion(options: GroupMotionOptions) {
  let geometries: MemberGeometry[] = []
  let frame: number | undefined
  let view: Window | null = null
  let initialized = false

  function targets() {
    const rtl =
      options.element()?.ownerDocument.defaultView?.getComputedStyle(options.element()!)
        .direction === 'rtl'
    geometries.forEach((geometry, index) => {
      const member = geometry.member
      const size = member.size()
      const full = Math.min(geometry.height, Math.max(0, geometry.width - geometry.inset * 2)) / 2
      let radii: number[]
      if (options.variant() === 'standard') {
        const radius = member.pressed()
          ? buttonPressed[size]
          : member.selected() === (member.shape() === 'round')
            ? buttonCorners[size]
            : full
        radii = [radius, radius, radius, radius]
      } else if (member.selected() && !member.pressed()) {
        radii = [full, full, full, full]
      } else {
        const inner = member.pressed() ? pressedCorners[size] : corners[size]
        const outer = member.shape() === 'round' ? full : corners[size]
        const start = index === 0 ? outer : inner
        const end = index === geometries.length - 1 ? outer : inner
        radii = rtl ? [end, start, start, end] : [start, end, end, start]
      }
      geometry.target = [options.variant() === 'standard' && member.pressed() ? 1 : 0, ...radii]
    })
  }

  function paint() {
    const widths = geometries.map((geometry) => geometry.width)
    const available = geometries.map((geometry) => geometry.capacity)
    geometries.forEach((geometry, index) => {
      const progress = Math.min(1, Math.max(0, geometry.position[0] ?? 0))
      if (!progress || options.variant() !== 'standard') return
      const neighbors = [index - 1, index + 1].filter((i) => i >= 0 && i < geometries.length)
      const requested =
        Math.min(geometry.width * 0.15 * progress, geometry.growth) / Math.max(1, neighbors.length)
      for (const neighbor of neighbors) {
        const amount = Math.min(requested, available[neighbor] ?? 0)
        widths[index] = (widths[index] ?? 0) + amount
        widths[neighbor] = (widths[neighbor] ?? 0) - amount
        available[neighbor] = (available[neighbor] ?? 0) - amount
      }
    })
    const moving = geometries.some((geometry) => Math.abs(geometry.position[0] ?? 0) > 0.0001)
    geometries.forEach((geometry, index) => {
      if (moving)
        geometry.element.style.setProperty('--mdv-group-motion-width', `${widths[index]}px`)
      else geometry.element.style.removeProperty('--mdv-group-motion-width')
      geometry.surface.style.borderRadius = geometry.position
        .slice(1)
        .map((radius) => `${Math.max(0, radius)}px`)
        .join(' ')
    })
  }

  function cancel() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = undefined
  }
  function finish() {
    cancel()
    targets()
    for (const geometry of geometries) {
      geometry.position = [...geometry.target]
      geometry.velocity = geometry.target.map(() => 0)
    }
    paint()
  }
  function play() {
    targets()
    if (!initialized) return
    if (
      geometries.every((geometry) =>
        geometry.target.every(
          (target, index) => target === geometry.position[index] && geometry.velocity[index] === 0,
        ),
      )
    )
      return
    if (
      !view?.requestAnimationFrame ||
      view.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      finish()
      return
    }
    if (frame !== undefined) return
    let previous: number | undefined
    let elapsed = 0
    function step(time: number) {
      let remaining =
        previous === undefined ? 1 / 60 : Math.min(0.064, Math.max(0, (time - previous) / 1000))
      previous = time
      elapsed += remaining
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 240)
        for (const geometry of geometries) {
          geometry.position.forEach((position, index) => {
            const velocity =
              (geometry.velocity[index] ?? 0) +
              ((geometry.target[index]! - position) * 800 -
                2 * 0.6 * Math.sqrt(800) * (geometry.velocity[index] ?? 0)) *
                dt
            geometry.velocity[index] = velocity
            geometry.position[index] = position + velocity * dt
          })
        }
        remaining -= dt
      }
      paint()
      const settled = geometries.every((geometry) =>
        geometry.target.every(
          (target, index) =>
            Math.abs(target - geometry.position[index]!) < 0.001 &&
            Math.abs(geometry.velocity[index]!) < 0.01,
        ),
      )
      if (settled || elapsed > 2) finish()
      else frame = view!.requestAnimationFrame(step)
    }
    frame = view.requestAnimationFrame(step)
  }

  function measure(jump = false) {
    const root = options.element()
    const row = options.row()
    view = root?.ownerDocument.defaultView ?? null
    if (!root || !row || !view) return
    const previous = new Map(geometries.map((geometry) => [geometry.element, geometry]))
    const members = options.members()
    for (const geometry of geometries) {
      if (!members.includes(geometry.member)) {
        geometry.element.style.removeProperty('--mdv-group-motion-width')
        geometry.element.style.removeProperty('margin-inline-start')
        geometry.surface.style.removeProperty('border-radius')
      }
    }
    for (const member of members) member.element()?.style.removeProperty('--mdv-group-motion-width')
    const gap = number(view.getComputedStyle(row).columnGap)
    // 只扣除实际命中区留白；窄图标之间空间不足时保留 48px 目标，不让相邻目标重叠。
    let previousInset = 0
    members.forEach((member, index) => {
      const element = member.element()!
      const inset = number(view!.getComputedStyle(element).paddingInlineStart)
      element.style.marginInlineStart = index ? `${-Math.min(gap, previousInset + inset)}px` : ''
      previousInset = inset
    })
    geometries = members.flatMap((member) => {
      const element = member.element()
      const surface = member.surface()
      const content = member.content()
      if (!element || !surface || !content) return []
      const bounds = element.getBoundingClientRect()
      const style = view!.getComputedStyle(surface)
      const rootStyle = view!.getComputedStyle(element)
      const inset = number(rootStyle.paddingInlineStart)
      const minimum = Math.max(48, number(rootStyle.minInlineSize), number(rootStyle.minWidth))
      const maximum = Math.min(
        ...[rootStyle.maxInlineSize, rootStyle.maxWidth].map((value) =>
          value?.endsWith('px') ? number(value) : Infinity,
        ),
      )
      const contentWidth = Math.max(content.scrollWidth, content.getBoundingClientRect().width)
      const padding = number(style.paddingInlineStart) + number(style.paddingInlineEnd)
      const border = number(style.borderInlineStartWidth) + number(style.borderInlineEndWidth)
      const old = previous.get(element)
      return [
        {
          member,
          element,
          surface,
          width: bounds.width,
          height: surface.getBoundingClientRect().height,
          inset,
          capacity: Math.max(
            0,
            Math.min(
              padding / 2,
              bounds.width - Math.max(minimum, contentWidth + border + inset * 2),
            ),
          ),
          growth: Math.max(0, maximum - bounds.width),
          position: old?.position ?? [0, 0, 0, 0, 0],
          velocity: old?.velocity ?? [0, 0, 0, 0, 0],
          target: [],
        },
      ]
    })
    targets()
    for (const geometry of geometries) {
      if (jump || !previous.has(geometry.element)) {
        geometry.position = [...geometry.target]
        geometry.velocity.fill(0)
      }
    }
    initialized = true
    if (jump) finish()
    else {
      paint()
      play()
    }
  }
  function reset() {
    cancel()
    initialized = false
    for (const geometry of geometries) {
      geometry.element.style.removeProperty('--mdv-group-motion-width')
      geometry.element.style.removeProperty('margin-inline-start')
      geometry.surface.style.removeProperty('border-radius')
    }
    geometries = []
  }
  return { measure, play, finish, reset }
}
