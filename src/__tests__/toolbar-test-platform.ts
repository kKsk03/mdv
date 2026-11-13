import { vi } from 'vitest'

export function toolbarReducedMotion() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => MediaQueryList>((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true
      },
    })),
  )
}

export function toolbarScroll(target: HTMLElement | Window, value: number) {
  if ('scrollY' in target) vi.stubGlobal('scrollY', value)
  else target.scrollTop = value
  target.dispatchEvent(new Event('scroll'))
}

export function toolbarFrames() {
  let id = 0
  let now = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
      callbacks.set(++id, callback)
      return id
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn<(key: number) => void>((key) => {
      callbacks.delete(key)
    }),
  )
  return {
    callbacks,
    step(count = 1) {
      for (let n = 0; n < count; n++) {
        now += 1000 / 60
        const frame = [...callbacks.values()]
        callbacks.clear()
        frame.forEach((callback) => callback(now))
      }
    },
  }
}
