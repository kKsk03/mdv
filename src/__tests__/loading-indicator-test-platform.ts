import { vi } from 'vitest'

export function loadingAnimationClock() {
  let time = 0
  let nextId = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
      const id = ++nextId
      callbacks.set(id, callback)
      return id
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn<(id: number) => void>((id) => callbacks.delete(id)),
  )

  function step(milliseconds = 16) {
    time += milliseconds
    const current = [...callbacks.values()]
    callbacks.clear()
    for (const callback of current) callback(time)
  }

  return {
    step,
    pending: () => callbacks.size,
    advance(milliseconds: number) {
      const end = time + milliseconds
      while (time < end) step(Math.min(16, end - time))
    },
  }
}

export function loadingMotionPreference(initial = false) {
  type Listener = (event: MediaQueryListEvent) => void
  const listeners = new Set<Listener>()
  const media = {
    matches: initial,
    addEventListener: vi.fn<(type: string, listener: Listener) => void>((type, listener) => {
      if (type === 'change') listeners.add(listener)
    }),
    removeEventListener: vi.fn<(type: string, listener: Listener) => void>((type, listener) => {
      if (type === 'change') listeners.delete(listener)
    }),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => MediaQueryList>(() => media as unknown as MediaQueryList),
  )
  return {
    listeners,
    change(matches: boolean) {
      media.matches = matches
      for (const listener of listeners) listener({ matches } as MediaQueryListEvent)
    },
  }
}
