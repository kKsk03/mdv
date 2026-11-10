import { autoUpdate, computePosition, flip, hide, offset, shift, size } from '@floating-ui/dom'
import type { MdvTooltipPlacement } from './tooltip.types'

export function observeTooltipPosition(options: {
  element: HTMLElement
  trigger: HTMLElement
  placement: MdvTooltipPlacement
  offset: number
  hidden: () => void
}) {
  const { element, trigger } = options
  let active = true
  let sequence = 0

  async function update() {
    const ticket = ++sequence
    const view = element.ownerDocument.defaultView
    const viewport = view?.visualViewport
    const width = Math.max(0, (viewport?.width ?? view?.innerWidth ?? 0) - 16)
    const height = Math.max(0, (viewport?.height ?? view?.innerHeight ?? 0) - 16)
    element.style.setProperty('--mdv-tooltip-available-width', `${width}px`)
    element.style.setProperty('--mdv-tooltip-available-height', `${height}px`)
    const result = await computePosition(trigger, element, {
      strategy: 'fixed',
      placement: options.placement,
      middleware: [
        offset(options.offset),
        flip({ padding: 8 }),
        // 仅沿对齐轴位移，避免把提示移到触发器上。
        shift({ padding: 8 }),
        size({
          padding: 8,
          apply({ availableWidth, availableHeight }) {
            if (!active || ticket !== sequence) return
            element.style.setProperty(
              '--mdv-tooltip-available-width',
              `${Math.max(0, Math.min(width, availableWidth))}px`,
            )
            element.style.setProperty(
              '--mdv-tooltip-available-height',
              `${Math.max(0, Math.min(height, availableHeight))}px`,
            )
          },
        }),
        hide({ strategy: 'referenceHidden' }),
      ],
    })
    if (!active || ticket !== sequence) return
    const box = trigger.getBoundingClientRect()
    if (result.middlewareData.hide?.referenceHidden && (box.width > 0 || box.height > 0)) {
      options.hidden()
      return
    }
    element.style.left = `${result.x}px`
    element.style.top = `${result.y}px`
    element.dataset.placement = result.placement
    element.style.transformOrigin = `${Math.max(0, Math.min(element.offsetWidth, (box.left + box.right) / 2 - result.x))}px ${Math.max(0, Math.min(element.offsetHeight, (box.top + box.bottom) / 2 - result.y))}px`
  }

  const cleanup = autoUpdate(trigger, element, () => void update(), {
    elementResize: typeof element.ownerDocument.defaultView?.ResizeObserver === 'function',
    layoutShift: typeof element.ownerDocument.defaultView?.IntersectionObserver === 'function',
  })
  const viewport = element.ownerDocument.defaultView?.visualViewport
  const refresh = () => void update()
  viewport?.addEventListener('resize', refresh)
  viewport?.addEventListener('scroll', refresh)
  return {
    update,
    stop() {
      active = false
      sequence++
      cleanup()
      viewport?.removeEventListener('resize', refresh)
      viewport?.removeEventListener('scroll', refresh)
    },
  }
}
