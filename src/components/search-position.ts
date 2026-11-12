import { autoUpdate, computePosition, offset, shift } from '@floating-ui/dom'
import type { MdvSearchLayout, MdvSearchVariant } from './search.types'

/** 原生 dialog 保留在组件位置继承主题；top layer 中的面板按视口定位。 */
export function observeSearchPosition(options: {
  anchor: () => HTMLElement | null
  panel: HTMLElement
  dialog: HTMLDialogElement
  layout: () => Exclude<MdvSearchLayout, 'auto'>
  variant: () => MdvSearchVariant
}) {
  const { panel, dialog } = options
  const view = dialog.ownerDocument.defaultView!
  let sequence = 0
  let active = true
  let stopAnchor: (() => void) | undefined
  let previous: HTMLElement | null = null

  async function update() {
    if (!active) return
    const ticket = ++sequence
    const viewport = view.visualViewport
    const width = viewport?.width ?? view.innerWidth
    const height = viewport?.height ?? view.innerHeight
    const left = viewport?.offsetLeft ?? 0
    const top = viewport?.offsetTop ?? 0
    for (const [name, value] of Object.entries({ left, top, width, height }))
      dialog.style.setProperty(`--mdv-search-viewport-${name}`, `${value}px`)
    const anchor = options.anchor()
    if (options.layout() === 'fullscreen') {
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
      panel.style.setProperty('--mdv-search-target-width', `${width}px`)
      panel.style.setProperty('--mdv-search-available-height', `${height}px`)
      return
    }
    const box = anchor?.getBoundingClientRect()
    const expansion =
      options.variant() === 'contained'
        ? Number.parseFloat(
            view.getComputedStyle(panel).getPropertyValue('--mdv-search-expand-inline'),
          ) || 0
        : 0
    panel.style.setProperty(
      '--mdv-search-target-width',
      `${Math.max(0, Math.min(720, width - 24, Math.max(360, (box?.width ?? 360) + expansion * 2)))}px`,
    )
    panel.style.setProperty('--mdv-search-available-height', `${Math.max(0, (height * 2) / 3)}px`)
    if (!anchor || !box) {
      panel.style.left = `${left + Math.max(12, (width - panel.offsetWidth) / 2)}px`
      panel.style.top = `${top + 12}px`
      return
    }
    const result = await computePosition(anchor, panel, {
      strategy: 'fixed',
      placement: 'bottom-start',
      middleware: [
        offset({ mainAxis: -box.height, crossAxis: -expansion }),
        shift({ padding: 12, crossAxis: true }),
      ],
    })
    if (!active || ticket !== sequence) return
    panel.style.left = `${Math.max(left + 12, Math.min(left + width - panel.offsetWidth - 12, result.x))}px`
    const y = Math.max(top + 12, result.y)
    panel.style.top = `${y}px`
    panel.style.setProperty(
      '--mdv-search-available-height',
      `${Math.max(0, Math.min((height * 2) / 3, top + height - y - 12))}px`,
    )
  }

  function refresh() {
    if (!active) return Promise.resolve()
    const anchor = options.anchor()
    if (anchor !== previous) {
      stopAnchor?.()
      previous = anchor
      stopAnchor = anchor
        ? autoUpdate(anchor, panel, () => void update(), {
            elementResize: typeof view.ResizeObserver === 'function',
            layoutShift: typeof view.IntersectionObserver === 'function',
          })
        : undefined
    }
    return update()
  }
  view.addEventListener('resize', refresh)
  view.visualViewport?.addEventListener('resize', refresh)
  view.visualViewport?.addEventListener('scroll', refresh)
  void refresh()
  return {
    refresh,
    stop() {
      active = false
      sequence++
      stopAnchor?.()
      view.removeEventListener('resize', refresh)
      view.visualViewport?.removeEventListener('resize', refresh)
      view.visualViewport?.removeEventListener('scroll', refresh)
    },
  }
}
