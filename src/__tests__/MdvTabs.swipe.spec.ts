import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTabsSwipe } from '../components/tabs-swipe'

const cleanups: Array<() => void> = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function touch(target: EventTarget, type: string, x: number, y = 20) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const point = { identifier: 1, clientX: x, clientY: y }
  Object.defineProperties(event, {
    touches: { value: type === 'touchend' ? [] : [point] },
    changedTouches: { value: [point] },
  })
  target.dispatchEvent(event)
  return event
}

function setup() {
  const root = document.createElement('div')
  root.className = 'mdv-tabs'
  const panel = document.createElement('div')
  const text = document.createElement('p')
  const input = document.createElement('input')
  panel.append(text, input)
  root.append(panel)
  document.body.append(root)
  const navigate = vi.fn<(direction: 1 | -1) => void>()
  let enabled = true
  const swipe = createTabsSwipe({
    root: () => root,
    panel: () => panel,
    enabled: () => enabled,
    navigate,
  })
  root.addEventListener('touchstart', swipe.start)
  cleanups.push(swipe.cancel)
  return {
    root,
    panel,
    text,
    input,
    navigate,
    swipe,
    disable: () => {
      enabled = false
      swipe.cancel()
    },
  }
}

describe('Tabs content swipe', () => {
  it('commits a horizontal touch once and mirrors its physical direction in RTL', () => {
    const platform = setup()
    touch(platform.text, 'touchstart', 200)
    expect(touch(window, 'touchmove', 80).defaultPrevented).toBe(true)
    touch(window, 'touchend', 80)
    touch(window, 'touchend', 80)
    expect(platform.navigate).toHaveBeenCalledExactlyOnceWith(1)
    platform.root.dir = 'rtl'
    touch(platform.text, 'touchstart', 200)
    touch(window, 'touchmove', 80)
    touch(window, 'touchend', 80)
    expect(platform.navigate).toHaveBeenLastCalledWith(-1)
    expect(platform.navigate).toHaveBeenCalledTimes(2)
  })

  it('leaves vertical scrolling, small movement and cancellation uncommitted', () => {
    const platform = setup()
    touch(platform.text, 'touchstart', 200)
    expect(touch(window, 'touchmove', 195, 100).defaultPrevented).toBe(false)
    touch(window, 'touchend', 195, 100)
    touch(platform.text, 'touchstart', 200)
    touch(window, 'touchmove', 185)
    touch(window, 'touchend', 185)
    touch(platform.text, 'touchstart', 200)
    touch(window, 'touchmove', 80)
    touch(window, 'touchcancel', 80)
    touch(window, 'touchend', 80)
    expect(platform.navigate).not.toHaveBeenCalled()
  })

  it('does not capture input, nested tabs or a native horizontal scrolling region', () => {
    const platform = setup()
    touch(platform.input, 'touchstart', 200)
    touch(window, 'touchmove', 80)
    touch(window, 'touchend', 80)
    const nested = document.createElement('div')
    nested.className = 'mdv-tabs'
    platform.panel.append(nested)
    touch(nested, 'touchstart', 200)
    touch(window, 'touchmove', 80)
    touch(window, 'touchend', 80)
    const scroll = document.createElement('div')
    scroll.style.overflowX = 'auto'
    Object.defineProperties(scroll, { scrollWidth: { value: 600 }, clientWidth: { value: 200 } })
    platform.panel.append(scroll)
    touch(scroll, 'touchstart', 200)
    expect(touch(window, 'touchmove', 80).defaultPrevented).toBe(false)
    touch(window, 'touchend', 80)
    expect(platform.navigate).not.toHaveBeenCalled()
  })

  it('removes active window listeners when disabled or disposed', () => {
    const platform = setup()
    touch(platform.text, 'touchstart', 200)
    touch(window, 'touchmove', 80)
    platform.disable()
    expect(touch(window, 'touchmove', 40).defaultPrevented).toBe(false)
    touch(window, 'touchend', 40)
    expect(platform.navigate).not.toHaveBeenCalled()
  })
})
