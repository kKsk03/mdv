import { vi } from 'vitest'

/** jsdom 没有浏览器 top layer；只替代平台边界，组件的关闭／焦点逻辑仍实际执行。 */
export function mockDialogPlatform() {
  const restore: (() => void)[] = []
  const queries = new Map<string, { list: MediaQueryList; change: (matches: boolean) => void }>()

  function replace(target: object, key: string, value: unknown) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    Object.defineProperty(target, key, {
      configurable: true,
      writable: true,
      value,
    })
    restore.push(() => {
      if (descriptor) Object.defineProperty(target, key, descriptor)
      else Reflect.deleteProperty(target, key)
    })
  }

  const showModal = vi.fn<(this: HTMLDialogElement) => void>(function () {
    this.setAttribute('open', '')
  })
  const nativeClose = vi.fn<(this: HTMLDialogElement, value?: string) => void>(function (value) {
    if (!this.open) return
    if (value !== undefined) this.returnValue = value
    this.removeAttribute('open')
    queueMicrotask(() => this.dispatchEvent(new Event('close')))
  })
  replace(HTMLDialogElement.prototype, 'showModal', showModal)
  replace(HTMLDialogElement.prototype, 'close', nativeClose)
  replace(Element.prototype, 'animate', undefined)
  vi.stubGlobal('ResizeObserver', undefined)
  vi.stubGlobal('MutationObserver', undefined)
  vi.stubGlobal(
    'matchMedia',
    vi.fn<(query: string) => MediaQueryList>((query) => {
      const known = queries.get(query)
      if (known) return known.list
      const target = new EventTarget()
      const list = {
        media: query,
        matches: false,
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: target.addEventListener.bind(target),
        removeEventListener: target.removeEventListener.bind(target),
        dispatchEvent: target.dispatchEvent.bind(target),
      } as unknown as MediaQueryList
      queries.set(query, {
        list,
        change(matches) {
          Object.defineProperty(list, 'matches', {
            configurable: true,
            value: matches,
          })
          target.dispatchEvent(new Event('change'))
        },
      })
      return list
    }),
  )

  interface RecordedAnimation {
    element: Element
    frames: Keyframe[]
    options: KeyframeAnimationOptions
    finish: () => void
    cancel: () => void
  }
  const animations: RecordedAnimation[] = []

  return {
    showModal,
    nativeClose,
    animations,
    media(query: string, matches: boolean) {
      window.matchMedia(query)
      queries.get(query)?.change(matches)
    },
    enableAnimations() {
      replace(
        Element.prototype,
        'animate',
        vi.fn<(this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => Animation>(
          function (frames, options) {
            let resolve!: (animation: Animation) => void
            let reject!: (reason: Error) => void
            const finished = new Promise<Animation>((yes, no) => {
              resolve = yes
              reject = no
            })
            const animation: Pick<Animation, 'finished' | 'cancel' | 'finish'> = {
              finished,
              cancel: vi.fn<() => void>(() => reject(new Error('Animation cancelled'))),
              finish: vi.fn<() => void>(() => resolve(animation as Animation)),
            }
            animations.push({
              element: this,
              frames,
              options,
              finish: animation.finish,
              cancel: animation.cancel,
            })
            return animation as Animation
          },
        ),
      )
    },
    restore() {
      for (const undo of restore.reverse()) undo()
    },
  }
}
