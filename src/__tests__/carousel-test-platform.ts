import { vi } from 'vitest'

/** 仅替代布局测量／平台时钟，不替代组件的滚动、模型或焦点逻辑。 */
export function mockCarouselPlatform(
  initialWidth = 348,
  initialHeight = 200,
  initialReduced = true,
) {
  let width = initialWidth
  let height = initialHeight
  let reduced = initialReduced
  let now = 0
  let frameId = 0
  const frames = new Map<number, FrameRequestCallback>()
  const preference = new EventTarget()
  const observers = new Set<Observer>()
  class Observer {
    readonly callback: ResizeObserverCallback
    connected = false
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
      observers.add(this)
    }
    observe() {
      this.connected = true
    }
    unobserve() {
      this.connected = false
    }
    disconnect() {
      this.connected = false
    }
  }
  vi.stubGlobal('ResizeObserver', Observer)
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => MediaQueryList>((query) => ({
      media: query,
      get matches() {
        return query === '(prefers-reduced-motion: reduce)' && reduced
      },
      onchange: null,
      addEventListener: preference.addEventListener.bind(preference),
      removeEventListener: preference.removeEventListener.bind(preference),
      dispatchEvent: preference.dispatchEvent.bind(preference),
      addListener: () => {},
      removeListener: () => {},
    })),
  )
  const widthGetter = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!.get!
  const heightGetter = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')!.get!
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains('mdv-carousel__track') ? width : widthGetter.call(this)
  })
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains('mdv-carousel__track') ? height : heightGetter.call(this)
  })
  const computedStyle = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = computedStyle(element, pseudo)
    if (element.classList.contains('mdv-carousel__track'))
      style.direction = element.closest('[dir]')?.getAttribute('dir') ?? 'ltr'
    return style
  })
  vi.spyOn(window.performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = ++frameId
    frames.set(id, callback)
    return id
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id)
  })
  return {
    frames(limit = 240) {
      for (let index = 0; index < limit && frames.size; index++) {
        now += 16
        const callbacks = [...frames.values()]
        frames.clear()
        callbacks.forEach((callback) => callback(now))
      }
    },
    resize(nextWidth: number, nextHeight = height) {
      width = nextWidth
      height = nextHeight
      for (const observer of observers)
        if (observer.connected) observer.callback([], observer as unknown as ResizeObserver)
    },
    reduce(value: boolean) {
      reduced = value
      preference.dispatchEvent(new Event('change'))
    },
    pendingFrames: () => frames.size,
    connectedObservers: () => [...observers].filter((observer) => observer.connected).length,
    tick(value: number) {
      now += value
    },
  }
}
