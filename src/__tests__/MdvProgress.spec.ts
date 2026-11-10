import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import MdvCircularProgress from '../components/MdvCircularProgress.vue'
import MdvLinearProgress from '../components/MdvLinearProgress.vue'
import type { MdvCircularProgressProps, MdvProgressProps } from '../components/progress.types'
import { indeterminateCircle } from '../components/progress-geometry'

const mounted: { unmount: () => void }[] = []

function unmount(wrapper: (typeof mounted)[number]) {
  const index = mounted.indexOf(wrapper)
  if (index !== -1) mounted.splice(index, 1)
  wrapper.unmount()
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', undefined)
  vi.stubGlobal('ResizeObserver', undefined)
  vi.stubGlobal('IntersectionObserver', undefined)
})

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function linear(props: MdvProgressProps = {}, attrs: Record<string, unknown> = {}) {
  const wrapper = mount(MdvLinearProgress, { props, attrs, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function circular(props: MdvCircularProgressProps = {}, attrs: Record<string, unknown> = {}) {
  const wrapper = mount(MdvCircularProgress, { props, attrs, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

function animationClock() {
  let now = 0
  let nextId = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  const request = vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
    const id = ++nextId
    callbacks.set(id, callback)
    return id
  })
  const cancel = vi.fn<(id: number) => void>((id) => {
    callbacks.delete(id)
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  return {
    pending: () => callbacks.size,
    advance(milliseconds: number) {
      const end = now + milliseconds
      while (now < end) {
        now = Math.min(end, now + 16)
        const current = [...callbacks.values()]
        callbacks.clear()
        for (const callback of current) callback(now)
      }
    },
  }
}

function motionPreference(initial = false) {
  type Listener = (event: MediaQueryListEvent) => void
  const listeners = new Set<Listener>()
  const add = vi.fn<(type: string, listener: Listener) => void>((type, listener) => {
    if (type === 'change') listeners.add(listener)
  })
  const remove = vi.fn<(type: string, listener: Listener) => void>((type, listener) => {
    if (type === 'change') listeners.delete(listener)
  })
  const media = { matches: initial, addEventListener: add, removeEventListener: remove }
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

describe.each([
  { name: 'MdvLinearProgress', render: linear, height: '4' },
  { name: 'MdvCircularProgress', render: circular, height: '40' },
])('$name', ({ render, height }) => {
  it('defaults to a non-focusable flat progressbar at zero and hides its decorative SVG', () => {
    const wrapper = render()
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    expect(wrapper.attributes('aria-valuemax')).toBe('100')
    expect(wrapper.attributes('aria-valuenow')).toBe('0')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.classes()).toContain('mdv-progress--flat')
    const svg = wrapper.get('svg')
    expect(svg.attributes('height')).toBe(height)
    expect(svg.attributes('stroke-width')).toBe('4')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(wrapper.get('.mdv-progress__active').attributes('d')).toBe('')
    expect(wrapper.get('.mdv-progress__track').attributes('d')).not.toBe('')
  })

  it('uses a visible label as its name and respects explicit naming attributes', async () => {
    const wrapper = render({ label: '文件上传' })
    expect(wrapper.get('.mdv-progress__label').text()).toBe('文件上传')
    expect(wrapper.attributes('aria-label')).toBe('文件上传')
    await wrapper.setProps({ label: '处理文件' })
    expect(wrapper.attributes('aria-label')).toBe('处理文件')

    const named = render(
      { label: '正在处理' },
      { 'aria-label': '第一项任务', 'aria-describedby': 'task-help' },
    )
    expect(named.attributes('aria-label')).toBe('第一项任务')
    expect(named.attributes('aria-describedby')).toBe('task-help')
    const labelled = render({ label: '正在处理' }, { 'aria-labelledby': 'task-title' })
    expect(labelled.attributes('aria-labelledby')).toBe('task-title')
    expect(labelled.attributes('aria-label')).toBeUndefined()
  })

  it.each([
    { value: -5, max: 100, expectedValue: '0', expectedMax: '100' },
    { value: 150, max: 100, expectedValue: '100', expectedMax: '100' },
    { value: 1.25, max: 2.5, expectedValue: '1.25', expectedMax: '2.5' },
    { value: NaN, max: 0, expectedValue: '0', expectedMax: '100' },
    { value: Infinity, max: Infinity, expectedValue: '0', expectedMax: '100' },
    { value: 35, max: -10, expectedValue: '35', expectedMax: '100' },
  ])(
    'normalizes value=$value / max=$max without invalid SVG coordinates',
    ({ value, max, expectedValue, expectedMax }) => {
      const wrapper = render({ value, max })
      expect(wrapper.attributes('aria-valuenow')).toBe(expectedValue)
      expect(wrapper.attributes('aria-valuemax')).toBe(expectedMax)
      expect(wrapper.html()).not.toMatch(/NaN|Infinity/)
    },
  )

  it('omits the current value in indeterminate mode and restores the real value after switching back', async () => {
    const wrapper = render(
      { value: 25, indeterminate: true },
      { 'aria-valuenow': 999, 'aria-valuemin': -5 },
    )
    const graphic = wrapper.get('svg').element
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    await wrapper.setProps({ value: 75 })
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    await wrapper.setProps({ indeterminate: false, variant: 'wavy' })
    expect(wrapper.attributes('aria-valuenow')).toBe('75')
    expect(wrapper.get('svg').element).toBe(graphic)
    expect(wrapper.classes()).toContain('mdv-progress--wavy')
  })

  it('preserves native attrs and listeners without emitting value updates or moving focus', async () => {
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    const click = vi.fn<(event: MouseEvent) => void>()
    const wrapper = render(
      { value: 40 },
      {
        id: 'transfer',
        class: 'custom-progress',
        dir: 'rtl',
        style: '--mdv-progress-active-color: #006c4c',
        'data-transfer': 'one',
        onClick: click,
      },
    )
    expect(wrapper.attributes('id')).toBe('transfer')
    expect(wrapper.classes()).toContain('custom-progress')
    expect(wrapper.attributes('dir')).toBe('rtl')
    expect(wrapper.attributes('data-transfer')).toBe('one')
    expect(wrapper.attributes('style')).toContain('--mdv-progress-active-color: #006c4c')
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent))
    await wrapper.setProps({ value: 100 })
    expect(document.activeElement).toBe(button)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toBe('')
    expect(wrapper.get('.mdv-progress__track').attributes('d')).toBe('')
    expect(wrapper.isVisible()).toBe(true)
  })
})

describe('Progress geometry boundaries', () => {
  it.each([0, 1500, 3000, 4500])(
    'spreads the additional quarter turn over 300ms at %sms without a first-frame lurch',
    (start) => {
      const rotation = (time: number) => (indeterminateCircle(time).rotation * 180) / Math.PI
      const initial = rotation(start)
      // 180 degrees/second globally plus 300 degrees/second during the advance.
      expect(rotation(start + 16) - initial).toBeCloseTo(7.68, 5)
      expect(rotation(start + 150) - initial).toBeCloseTo(72, 5)
      expect(rotation(start + 300) - initial).toBeCloseTo(144, 5)
      // The extra rotation then holds; global rotation continues at 180 degrees/second.
      expect(rotation(start + 600) - rotation(start + 300)).toBeCloseTo(54, 5)
    },
  )

  it('grows the unknown circular arc steadily before easing its contraction', () => {
    expect(indeterminateCircle(0).progress).toBeCloseTo(0.1, 5)
    expect(indeterminateCircle(750).progress).toBeCloseTo(0.2925, 5)
    expect(indeterminateCircle(1500).progress).toBeCloseTo(0.485, 5)
    expect(indeterminateCircle(2250).progress).toBeCloseTo(0.6775, 5)
    expect(indeterminateCircle(3000).progress).toBeCloseTo(0.87, 5)
    expect(indeterminateCircle(4500).progress).toBeCloseTo(0.194, 3)
    expect(indeterminateCircle(6000).progress).toBeCloseTo(0.1, 5)
  })

  it('keeps both arc endpoints continuous across quarter turns and the full loop', () => {
    const angularDelta = (from: number, to: number) =>
      Math.atan2(Math.sin(to - from), Math.cos(to - from))
    for (const boundary of [300, 1500, 1800, 3000, 3300, 4500, 4800, 6000]) {
      const before = indeterminateCircle(boundary - 1)
      const after = indeterminateCircle(boundary + 1)
      const startDelta = angularDelta(before.rotation, after.rotation)
      const endDelta = angularDelta(
        before.rotation + before.progress * Math.PI * 2,
        after.rotation + after.progress * Math.PI * 2,
      )
      expect(startDelta).toBeGreaterThan(0)
      expect(startDelta).toBeLessThan(0.02)
      expect(Math.abs(endDelta)).toBeLessThan(0.03)
      expect(Math.abs(after.progress - before.progress)).toBeLessThan(0.002)
    }
  })

  it('keeps the linear stop at zero, removes it at completion, and omits it for unknown progress', async () => {
    const wrapper = linear()
    expect(wrapper.get('circle').attributes('r')).toBe('2')
    expect(wrapper.get('circle').attributes('cx')).toBe('238')
    await wrapper.setProps({ value: 100 })
    expect(wrapper.get('circle').attributes('r')).toBe('0')
    await wrapper.setProps({ indeterminate: true })
    expect(wrapper.get('circle').attributes('r')).toBe('0')
    expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toBe('')
  })

  it('uses official default dimensions, supports custom dimensions, and bounds a thick circle stroke', async () => {
    const line = linear({ variant: 'wavy' })
    const circle = circular({ variant: 'wavy' })
    expect(line.get('svg').attributes('height')).toBe('10')
    expect(circle.get('svg').attributes('width')).toBe('48')
    expect(circle.get('svg').attributes('preserveAspectRatio')).toBe('xMidYMid meet')
    await circle.setProps({ size: 72, thickness: 8, value: 50 })
    expect(circle.get('svg').attributes('viewBox')).toBe('0 0 72 72')
    expect(circle.get('svg').attributes('stroke-width')).toBe('8')
    await circle.setProps({ size: 24, thickness: 100 })
    expect(circle.get('svg').attributes('stroke-width')).toBe('12')
    await circle.setProps({ size: NaN, thickness: -2 })
    expect(circle.get('svg').attributes('width')).toBe('48')
    expect(circle.get('svg').attributes('stroke-width')).toBe('4')
    await line.setProps({ thickness: 8 })
    expect(line.get('svg').attributes('height')).toBe('14')
  })

  it('retains a complete round circular track at zero and starts determinate progress at twelve o’clock', () => {
    const empty = circular()
    expect(empty.get('.mdv-progress__track').attributes('d')).toMatch(/^M20 2A.+Z$/)
    const partial = circular({ value: 25 })
    expect(partial.get('.mdv-progress__active').attributes('d')).toMatch(/^M20 2A/)
    expect(partial.get('.mdv-progress__track').attributes('d')).not.toBe('')
    const full = circular({ value: 100 })
    expect(full.get('.mdv-progress__active').attributes('d')).toMatch(/Z$/)
  })

  it.each([0, 10, 95, 100])(
    'flattens the wave at %s percent without changing the selected variant',
    (value) => {
      const wrapper = linear({ value, variant: 'wavy' })
      expect(wrapper.classes()).toContain('mdv-progress--wavy')
      expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toContain('L')
      expect(wrapper.get('svg').attributes('height')).toBe('10')
    },
  )
})

describe('Progress motion', () => {
  it('interpolates visually while ARIA immediately reports the real value and finishes without a running frame', async () => {
    const clock = animationClock()
    const wrapper = linear({ value: 0 })
    expect(clock.pending()).toBe(0)
    await wrapper.setProps({ value: 100 })
    expect(wrapper.attributes('aria-valuenow')).toBe('100')
    clock.advance(200)
    expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toBe('')
    expect(wrapper.get('.mdv-progress__track').attributes('d')).not.toBe('')
    clock.advance(320)
    expect(wrapper.get('.mdv-progress__track').attributes('d')).toBe('')
    expect(wrapper.get('circle').attributes('r')).toBe('0')
    expect(clock.pending()).toBe(0)
  })

  it('cancels an obsolete destination when a rapid update returns to the current displayed value', async () => {
    const clock = animationClock()
    const wrapper = linear({ value: 50 })
    const initial = wrapper.get('.mdv-progress__active').attributes('d')
    await wrapper.setProps({ value: 100 })
    await wrapper.setProps({ value: 50 })
    clock.advance(600)
    expect(wrapper.get('.mdv-progress__active').attributes('d')).toBe(initial)
    expect(wrapper.attributes('aria-valuenow')).toBe('50')
    expect(clock.pending()).toBe(0)
  })

  it('keeps a value transition on schedule when size changes halfway through it', async () => {
    const clock = animationClock()
    const wrapper = circular()
    await wrapper.setProps({ value: 100 })
    clock.advance(240)
    await wrapper.setProps({ size: 80, thickness: 6 })
    clock.advance(280)
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 80 80')
    expect(wrapper.get('.mdv-progress__track').attributes('d')).toBe('')
    expect(clock.pending()).toBe(0)
  })

  it('animates the wave phase and retracts its amplitude near completion', async () => {
    const clock = animationClock()
    const wrapper = linear({ value: 50, variant: 'wavy' })
    const initial = wrapper.get('.mdv-progress__active').attributes('d')
    expect(initial).toContain('Q')
    clock.advance(80)
    expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toBe(initial)
    await wrapper.setProps({ value: 95 })
    clock.advance(520)
    expect(wrapper.get('.mdv-progress__active').attributes('d')).toContain('H')
    expect(clock.pending()).toBe(0)
  })

  it('cancels a pending wave expansion when the progress immediately returns to its flat range', async () => {
    const clock = animationClock()
    const wrapper = linear({ value: 5, variant: 'wavy' })
    await wrapper.setProps({ value: 50 })
    await wrapper.setProps({ value: 5 })
    clock.advance(600)
    expect(wrapper.get('.mdv-progress__active').attributes('d')).toContain('H')
    expect(clock.pending()).toBe(0)
  })

  it.each([
    { name: 'linear flat', render: linear, variant: 'flat' as const, trackVisible: true },
    { name: 'linear wavy', render: linear, variant: 'wavy' as const, trackVisible: true },
    { name: 'circular flat', render: circular, variant: 'flat' as const, trackVisible: false },
    { name: 'circular wavy', render: circular, variant: 'wavy' as const, trackVisible: true },
  ])(
    'animates $name with unknown progress and transitions to an actual value',
    async ({ render, variant, trackVisible }) => {
      const clock = animationClock()
      const wrapper = render({ variant, indeterminate: true })
      const initial = wrapper.get('.mdv-progress__active').attributes('d')
      clock.advance(320)
      expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toBe(initial)
      expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
      expect(Boolean(wrapper.get('.mdv-progress__track').attributes('d'))).toBe(trackVisible)
      await wrapper.setProps({ indeterminate: false, value: 100 })
      clock.advance(520)
      expect(wrapper.attributes('aria-valuenow')).toBe('100')
      expect(wrapper.get('.mdv-progress__track').attributes('d')).toBe('')
      expect(clock.pending()).toBe(0)
    },
  )

  it('responds to reduced-motion changes, preserves a visible unknown indicator, and removes its listener', async () => {
    const clock = animationClock()
    const preference = motionPreference(true)
    const wrapper = linear({ variant: 'wavy', indeterminate: true })
    expect(wrapper.get('.mdv-progress__active').attributes('d')).not.toBe('')
    expect(clock.pending()).toBe(0)
    preference.change(false)
    expect(clock.pending()).toBe(1)
    clock.advance(80)
    preference.change(true)
    const still = wrapper.get('.mdv-progress__active').attributes('d')
    clock.advance(200)
    expect(wrapper.get('.mdv-progress__active').attributes('d')).toBe(still)
    expect(clock.pending()).toBe(0)
    await wrapper.setProps({ indeterminate: false, value: 100 })
    expect(wrapper.get('.mdv-progress__track').attributes('d')).toBe('')
    unmount(wrapper)
    expect(preference.listeners.size).toBe(0)
  })

  it('remeasures a linear graphic without changing its value and disconnects its observer on unmount', () => {
    const observers: TestResizeObserver[] = []
    class TestResizeObserver {
      callback: ResizeObserverCallback
      observe = vi.fn<(target: Element) => void>()
      disconnect = vi.fn<() => void>()
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
        observers.push(this)
      }
    }
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    const wrapper = linear({ value: 50, variant: 'wavy' })
    const graphic = wrapper.get('svg').element
    vi.spyOn(graphic, 'getBoundingClientRect').mockReturnValue({ width: 360 } as DOMRect)
    const observer = observers[0]!
    observer.callback([], observer as unknown as ResizeObserver)
    expect(observer.observe).toHaveBeenCalledExactlyOnceWith(graphic)
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 360 10')
    expect(wrapper.attributes('aria-valuenow')).toBe('50')
    unmount(wrapper)
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  it('pauses offscreen and hidden loops, resumes them, and cleans up its observer and document listener', () => {
    const clock = animationClock()
    const observers: TestIntersectionObserver[] = []
    class TestIntersectionObserver {
      callback: IntersectionObserverCallback
      observe = vi.fn<(target: Element) => void>()
      disconnect = vi.fn<() => void>()
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        observers.push(this)
      }
    }
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = circular({ indeterminate: true })
    const graphic = wrapper.element.querySelector('svg')!
    const observer = observers[0]!
    const intersect = (isIntersecting: boolean) => {
      const bounds = graphic.getBoundingClientRect()
      const entry: IntersectionObserverEntry = {
        boundingClientRect: bounds,
        intersectionRatio: isIntersecting ? 1 : 0,
        intersectionRect: isIntersecting ? bounds : new DOMRect(),
        isIntersecting,
        rootBounds: null,
        target: graphic,
        time: performance.now(),
      }
      observer.callback([entry], observer as unknown as IntersectionObserver)
    }
    expect(observer.observe).toHaveBeenCalledExactlyOnceWith(graphic)
    expect(clock.pending()).toBe(1)
    intersect(false)
    expect(clock.pending()).toBe(0)
    intersect(true)
    expect(clock.pending()).toBe(1)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(clock.pending()).toBe(0)
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(clock.pending()).toBe(1)
    unmount(wrapper)
    expect(clock.pending()).toBe(0)
    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(clock.pending()).toBe(0)
  })

  it('suspends a cached playground page and resumes its animation when reactivated', async () => {
    const clock = animationClock()
    const show = ref(true)
    const OtherPage = defineComponent({ render: () => h('p', '另一页') })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () =>
              show.value ? h(MdvLinearProgress, { indeterminate: true }) : h(OtherPage),
          }),
      }),
    )
    mounted.push(wrapper)
    const graphic = wrapper.get('svg').element
    expect(clock.pending()).toBe(1)
    show.value = false
    await nextTick()
    expect(clock.pending()).toBe(0)
    show.value = true
    await nextTick()
    expect(wrapper.get('svg').element).toBe(graphic)
    expect(clock.pending()).toBe(1)
    unmount(wrapper)
    expect(clock.pending()).toBe(0)
  })
})
