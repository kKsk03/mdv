import { vi } from 'vitest'
import { mockDialogPlatform } from './dialog-test-platform'

/** 仅补齐 jsdom 缺失的布局测量与原生 dialog，状态、手势和生命周期仍实际执行。 */
export function mockBottomSheetPlatform() {
  const platform = mockDialogPlatform()
  let contentHeight = 900
  const clientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')!.get!
  const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')!.get!
  const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!.get!
  function panelHeight(element: Element) {
    const panel = element.closest<HTMLElement>('.mdv-bottom-sheet__panel')
    return Number.parseFloat(panel?.style.getPropertyValue('--mdv-bottom-sheet-height') ?? '') || 0
  }
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
    if (this.matches('.mdv-bottom-sheet')) return this.hasAttribute('open') ? 800 : 0
    if (this.matches('.mdv-bottom-sheet-scaffold')) return 800
    if (this.matches('.mdv-bottom-sheet__bounds'))
      return (this as HTMLElement).style.height === '100%' ? 800 : 728
    if (this.matches('.mdv-bottom-sheet__content')) {
      const handle = this.parentElement?.querySelector('.mdv-bottom-sheet__handle-bar')
      return Math.max(0, panelHeight(this) - (handle ? 48 : 0))
    }
    return clientHeight.call(this) as number
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.closest('[hidden]')) return 0
    if (this.matches('.mdv-bottom-sheet__handle-bar')) return 48
    if (this.matches('.mdv-bottom-sheet__header')) return 52
    if (this.matches('.mdv-bottom-sheet__body')) return contentHeight
    if (this.matches('.mdv-bottom-sheet__actions')) return 68
    return offsetHeight.call(this) as number
  })
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
    if (this.matches('.mdv-bottom-sheet__content')) {
      return Math.max(
        this.clientHeight,
        [...this.children].reduce(
          (height, child) => height + (child as HTMLElement).offsetHeight,
          0,
        ),
      )
    }
    return scrollHeight.call(this) as number
  })
  return {
    ...platform,
    setContentHeight(value: number) {
      contentHeight = value
    },
    height: panelHeight,
  }
}

export function sheetPointer(target: EventTarget, type: string, y: number, id = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 160,
    clientY: y,
  })
  Object.defineProperty(event, 'pointerId', { value: id })
  target.dispatchEvent(event)
  return event
}

export function sheetTouch(target: EventTarget, type: string, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const touch = { identifier: 1, clientX: x, clientY: y }
  Object.defineProperties(event, {
    touches: { value: type === 'touchend' || type === 'touchcancel' ? [] : [touch] },
    changedTouches: { value: [touch] },
  })
  target.dispatchEvent(event)
  return event
}
