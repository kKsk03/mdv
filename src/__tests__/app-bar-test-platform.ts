import { vi } from 'vitest'

/** 只补足 jsdom 缺少的几何与浏览器通知，不模拟组件的滚动算法。 */
export function mockAppBarPlatform() {
  const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
  let expandedContent = 0
  let compactContent = 0
  let imageHeight = 0
  let leadingWidth = 48
  let actionsWidth = 96
  let notifyResize: ResizeObserverCallback | undefined
  const disconnect = vi.fn<() => void>()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = callback
      }
      observe() {}
      unobserve() {}
      disconnect = disconnect
    },
  )
  const media = {
    matches: true,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
    addListener: vi.fn<MediaQueryList['addListener']>(),
    removeListener: vi.fn<MediaQueryList['removeListener']>(),
    dispatchEvent: vi.fn<MediaQueryList['dispatchEvent']>(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn<Window['matchMedia']>(() => media),
  )
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const root = this.closest('.mdv-app-bar')
    let width = 400
    let height = 0
    if (this.classList.contains('mdv-app-bar__leading')) width = leadingWidth
    if (this.classList.contains('mdv-app-bar__actions')) width = actionsWidth
    if (this.classList.contains('mdv-app-bar__content'))
      height = root?.classList.contains('mdv-app-bar--measure-small')
        ? compactContent
        : expandedContent
    if (this.classList.contains('mdv-app-bar__title')) height = 28
    if (this.classList.contains('mdv-app-bar__image')) height = imageHeight
    return new DOMRect(0, 0, width, height)
  })

  return {
    media,
    disconnect,
    content(expanded: number, compact = 28, image = 0) {
      expandedContent = expanded
      compactContent = compact
      imageHeight = image
    },
    sides(leading: number, actions: number) {
      leadingWidth = leading
      actionsWidth = actions
    },
    resize() {
      notifyResize?.([], {} as ResizeObserver)
    },
    restore() {
      if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY)
    },
  }
}

export function appBarScroll(target: HTMLElement | Window, y: number) {
  if ('scrollY' in target)
    Object.defineProperty(target, 'scrollY', { configurable: true, value: y })
  else target.scrollTop = y
  target.dispatchEvent(new Event('scroll'))
}
