import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'
import type { Placement, ReferenceElement } from '@floating-ui/dom'

export function observeMenuPosition(options: {
  element: HTMLElement
  anchor: ReferenceElement
  placement: Placement
  offset: number
  push: boolean
  parent: HTMLElement | null
  positioned: (scrolling: boolean) => void
}) {
  const { element, anchor, parent, push } = options
  let active = true
  let sequence = 0

  async function update() {
    const ticket = ++sequence
    const view = element.ownerDocument.defaultView
    const viewport = view?.visualViewport
    const viewportWidth = viewport?.width ?? view?.innerWidth ?? 0
    const viewportHeight = viewport?.height ?? view?.innerHeight ?? 0
    const boundedWidth = Math.max(0, viewportWidth - 16)
    const boundedHeight = Math.max(0, viewportHeight - 16)
    element.style.setProperty('--mdv-menu-available-width', `${boundedWidth}px`)
    if (push && parent) element.style.width = `${parent.getBoundingClientRect().width}px`
    const result = await computePosition(push && parent ? parent : anchor, element, {
      strategy: 'fixed',
      placement: push ? 'bottom-start' : options.placement,
      middleware: [
        offset(push && parent ? -parent.getBoundingClientRect().height : options.offset),
        ...(!push ? [flip({ padding: 8 })] : []),
        shift({ padding: 8, crossAxis: true }),
        size({
          padding: 8,
          apply({ availableHeight, availableWidth }) {
            if (!active || ticket !== sequence) return
            element.style.setProperty(
              '--mdv-menu-available-width',
              `${Math.max(0, Math.min(boundedWidth, availableWidth))}px`,
            )
            element.style.setProperty(
              '--mdv-menu-available-height',
              `${Math.max(0, Math.min(boundedHeight, availableHeight))}px`,
            )
          },
        }),
      ],
    })
    if (!active || ticket !== sequence) return
    element.style.left = `${result.x}px`
    element.style.top = `${result.y}px`
    const box = anchor.getBoundingClientRect()
    const width = element.offsetWidth
    const height = element.offsetHeight
    const pivotX = Math.max(0, Math.min(width, (box.left + box.right) / 2 - result.x))
    const pivotY = Math.max(0, Math.min(height, (box.top + box.bottom) / 2 - result.y))
    element.style.transformOrigin = `${pivotX}px ${pivotY}px`
    const viewportElement = element.querySelector<HTMLElement>('.mdv-menu__viewport')
    options.positioned(
      !!viewportElement && viewportElement.scrollHeight > viewportElement.clientHeight + 1,
    )
  }

  const cleanup = autoUpdate(anchor, element, () => void update(), {
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
