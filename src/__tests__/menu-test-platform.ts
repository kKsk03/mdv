import { vi } from 'vitest'
import { mockDialogPlatform } from './dialog-test-platform'

/** 只补齐 jsdom 缺少的 top layer 和测量值；定位仍运行真实 Floating UI。 */
export function mockMenuPlatform() {
  const dialog = mockDialogPlatform()
  const restore: (() => void)[] = []
  const opened = new Set<HTMLElement>()
  const displayOverrides = new Set<HTMLElement>()

  function replace(target: object, key: string, value: unknown) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    Object.defineProperty(target, key, { configurable: true, writable: true, value })
    restore.push(() => {
      if (descriptor) Object.defineProperty(target, key, descriptor)
      else Reflect.deleteProperty(target, key)
    })
  }

  function toggle(element: HTMLElement, open: boolean) {
    if (opened.has(element) === open) return
    const event = new Event('beforetoggle', { cancelable: open })
    Object.defineProperties(event, {
      oldState: { value: opened.has(element) ? 'open' : 'closed' },
      newState: { value: open ? 'open' : 'closed' },
    })
    if (!element.dispatchEvent(event)) return
    if (open) {
      opened.add(element)
      // jsdom 的 UA 样式仍把 :popover-open 当作 false；matches 替身不会改变 CSS 引擎。
      // 只补默认显示值，保留显式 display（包括 v-show 的 none）及原生 focus 检查。
      if (!element.style.display) {
        element.style.display = 'block'
        displayOverrides.add(element)
      }
    } else {
      opened.delete(element)
      if (displayOverrides.delete(element)) element.style.removeProperty('display')
    }
  }

  const showPopover = vi.fn<(this: HTMLElement) => void>(function () {
    toggle(this, true)
  })
  const hidePopover = vi.fn<(this: HTMLElement) => void>(function () {
    toggle(this, false)
  })
  replace(HTMLElement.prototype, 'showPopover', showPopover)
  replace(HTMLElement.prototype, 'hidePopover', hidePopover)
  const matches = Element.prototype.matches
  replace(Element.prototype, 'matches', function (this: Element, selector: string) {
    return selector === ':popover-open'
      ? opened.has(this as HTMLElement)
      : matches.call(this, selector)
  })
  replace(document.documentElement, 'clientWidth', 1024)
  replace(document.documentElement, 'clientHeight', 768)

  function geometry(
    element: HTMLElement,
    box: { x?: number; y?: number; width: number; height: number },
  ) {
    const { x = 0, y = 0, width, height } = box
    replace(element, 'offsetWidth', width)
    replace(element, 'offsetHeight', height)
    replace(element, 'clientWidth', width)
    replace(element, 'clientHeight', height)
    replace(element, 'scrollHeight', height)
    replace(element, 'getBoundingClientRect', () => new DOMRect(x, y, width, height))
  }

  return {
    ...dialog,
    showPopover,
    hidePopover,
    opened,
    geometry,
    scrollHeight(element: HTMLElement, height: number) {
      replace(element, 'scrollHeight', height)
    },
    restore() {
      for (const element of displayOverrides) element.style.removeProperty('display')
      displayOverrides.clear()
      opened.clear()
      for (const undo of restore.reverse()) undo()
      dialog.restore()
    },
  }
}
