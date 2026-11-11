import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  watch,
} from 'vue'
import { createBottomSheetMotion } from './bottom-sheet-motion'
import type { DialogMotion } from './dialog-motion'
import type {
  MdvBottomSheetChangeDetail,
  MdvBottomSheetChangeReason,
  MdvBottomSheetState,
} from './bottom-sheet.types'

interface SheetOptions {
  modal: boolean
  root: () => HTMLElement | null
  bounds: () => HTMLElement | null
  panel: () => HTMLElement | null
  content: () => HTMLElement | null
  scrim?: () => HTMLElement | null
  state: () => MdvBottomSheetState
  phase?: () => string
  draggable: () => boolean
  canHide: () => boolean
  partialHeight: (viewportHeight: number) => number
  request: (state: MdvBottomSheetState, reason: MdvBottomSheetChangeReason) => Promise<boolean>
  change: (detail: MdvBottomSheetChangeDetail) => void
  settled?: (state: MdvBottomSheetState) => void
}

interface Drag {
  kind: 'pointer' | 'touch'
  id: number
  x: number
  y: number
  origin: number
  element: HTMLElement
  content: boolean
  active: boolean
  samples: { time: number; height: number }[]
}

/** 两款面板共享尺寸、手势和动效；是否模态与业务状态由各自组件管理。 */
export function useBottomSheet(options: SheetOptions) {
  const measured = ref(false)
  const expandedHeight = ref(0)
  const partialHeight = ref(0)
  const viewportHeight = ref(0)
  const dragging = ref(false)
  const scrollable = ref(false)
  const handleHeight = ref(48)
  const hasPartial = computed(
    () => partialHeight.value > 0 && partialHeight.value < expandedHeight.value - 1,
  )
  const state = computed<MdvBottomSheetState>(() =>
    options.state() === 'partial' && measured.value && !hasPartial.value
      ? 'expanded'
      : options.state(),
  )
  const expanded = computed(() => state.value === 'expanded')
  const fullHeight = computed(
    () => measured.value && expanded.value && expandedHeight.value >= viewportHeight.value - 1,
  )
  const canChange = computed(() => hasPartial.value || options.modal || options.canHide())
  const canDrag = computed(() => options.draggable() && (hasPartial.value || options.canHide()))
  const contentHidden = computed(
    () =>
      measured.value && state.value === 'partial' && partialHeight.value - handleHeight.value < 24,
  )
  const motion = createBottomSheetMotion(options.panel, () => options.scrim?.() ?? null)
  let active = true
  let mounted = false
  let drag: Drag | null = null
  let lastTarget = -1
  let previousState = options.state()
  let requesting = false
  let requestTarget: MdvBottomSheetState | null = null
  let scheduled = false
  let suppressed = false
  let suppressTimer = 0
  let resize: ResizeObserver | undefined
  let mutation: MutationObserver | undefined
  let media: MediaQueryList | undefined
  let view: (Window & typeof globalThis) | null = null
  let requestVersion = 0
  let movement = 0
  let requestReason: MdvBottomSheetChangeReason = 'model'

  function visibleHeight(value = state.value) {
    if (value === 'hidden') return 0
    return value === 'partial' && hasPartial.value ? partialHeight.value : expandedHeight.value
  }

  function notify(reason: MdvBottomSheetChangeReason) {
    const value = state.value
    if (value === previousState) return
    const previous = previousState
    previousState = value
    options.change({
      state: value,
      previousState: previous,
      reason: requesting ? requestReason : reason,
    })
  }

  function updateScrollability() {
    const body = options.content()
    if (!body) return
    // 正文保留原生触控。仅在 touchmove 确认是面板手势后阻止默认滚动。
    scrollable.value =
      !contentHidden.value && body.clientHeight > 0 && body.scrollHeight > body.clientHeight + 1
  }

  function measure() {
    const panel = options.panel()
    const body = options.content()
    const root = options.root()
    const bounds = options.bounds()
    if (!panel || panel.hidden || !body || !root || !bounds) return false
    const height = root.clientHeight
    const cap = bounds.clientHeight
    if (height <= 0 || cap <= 0) return false
    const chrome = Array.from(panel.children).reduce(
      (height, child) => (child === body ? height : height + (child as HTMLElement).offsetHeight),
      0,
    )
    // scrollHeight 至少等于当前视口高度，不能据此判断内容删减后的自然高度。
    const natural =
      chrome +
      Array.from(body.children).reduce(
        (height, child) => height + (child as HTMLElement).offsetHeight,
        0,
      )
    handleHeight.value = chrome
    viewportHeight.value = height
    expandedHeight.value = Math.max(0, Math.min(cap, natural))
    const requested = options.partialHeight(height)
    const controlHeight =
      chrome ||
      body.querySelector<HTMLElement>(':scope > .mdv-bottom-sheet__header')?.offsetHeight ||
      0
    partialHeight.value = Math.max(
      0,
      Math.min(expandedHeight.value, requested > 0 ? Math.max(controlHeight, requested) : 0),
    )
    measured.value = true
    for (const child of body.children) resize?.observe(child)
    return true
  }

  function move(velocity = 0, instant = false) {
    if (!measured.value) return
    const hidden = state.value === 'hidden'
    const height = hidden ? Math.max(expandedHeight.value, 1) : visibleHeight()
    lastTarget = hidden ? 0 : height
    const target = { height, offset: hidden ? height : 0, opacity: hidden ? 0 : 1 }
    if (!expanded.value && options.content()) options.content()!.scrollTop = 0
    const ticket = ++movement
    if (instant) motion.jump(target)
    const finished = instant ? Promise.resolve([]) : motion.play(target, velocity, hidden).finished
    void finished.then(() => {
      if (mounted && active && ticket === movement) options.settled?.(state.value)
    })
    updateScrollability()
  }

  function sync(reason: MdvBottomSheetChangeReason = 'resize') {
    if (!mounted || !active || drag?.active) return
    measure()
    notify(reason)
    updateScrollability()
    if (options.modal && options.phase?.() !== 'open') return
    if (visibleHeight() !== lastTarget) move()
  }

  function schedule() {
    if (scheduled) return
    scheduled = true
    void nextTick(() => {
      scheduled = false
      sync()
    })
  }

  function refreshViewport() {
    if (options.modal && options.root() && view) {
      const viewport = view.visualViewport
      options
        .root()!
        .style.setProperty(
          '--mdv-bottom-sheet-viewport-height',
          `${viewport?.height ?? view.innerHeight}px`,
        )
      options
        .root()!
        .style.setProperty('--mdv-bottom-sheet-viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    if (drag) cancelDrag()
    schedule()
  }

  function animateModal(entering: boolean, previous?: DialogMotion): DialogMotion {
    refreshViewport()
    measure()
    notify('model')
    const height = Math.max(1, visibleHeight(entering ? state.value : previousState))
    if (entering && !previous) motion.jump({ height, offset: height, opacity: 0 })
    const currentHeight = motion.current().height || height
    lastTarget = entering ? height : 0
    updateScrollability()
    return motion.play(
      {
        height: entering ? height : currentHeight,
        offset: entering ? 0 : currentHeight,
        opacity: entering ? 1 : 0,
      },
      0,
      !entering,
    )
  }

  function prepareModal() {
    refreshViewport()
    measure()
    notify('model')
    const height = Math.max(1, visibleHeight())
    lastTarget = height
    motion.jump({ height, offset: 0, opacity: 1 })
    updateScrollability()
  }

  async function request(
    value: MdvBottomSheetState,
    reason: MdvBottomSheetChangeReason,
    velocity = 0,
  ) {
    if (requesting || !mounted || !active) return false
    requesting = true
    requestTarget = value
    requestReason = reason
    const ticket = ++requestVersion
    try {
      const accepted = await options.request(value, reason)
      await nextTick()
      if (!mounted || !active || ticket !== requestVersion) return false
      measure()
      notify(reason)
      if (!options.modal || options.phase?.() === 'open') move(accepted ? velocity : 0)
      return accepted
    } finally {
      if (ticket === requestVersion) {
        requesting = false
        requestTarget = null
      }
    }
  }

  function toggle() {
    if (!canChange.value || suppressed) return Promise.resolve(false)
    if (state.value !== 'expanded') return request('expanded', 'handle')
    if (options.modal || options.canHide()) return request('hidden', 'handle')
    if (hasPartial.value) return request('partial', 'handle')
    return request('hidden', 'handle')
  }

  function ignored(target: EventTarget | null) {
    if (!(target instanceof Element)) return true
    if (target.closest('[data-mdv-sheet-handle]')) return false
    return (
      !!target.closest(
        'a,button,input,textarea,select,video,audio,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="switch"],[role="checkbox"],[role="radio"],[data-mdv-sheet-no-drag]',
      ) || options.panel()?.ownerDocument.getSelection()?.isCollapsed === false
    )
  }

  function begin(
    kind: Drag['kind'],
    id: number,
    x: number,
    y: number,
    element: HTMLElement,
    inContent: boolean,
  ) {
    if (!active || requesting || !canDrag.value || state.value === 'hidden') return
    if (options.modal && !['open', 'opening'].includes(options.phase?.() ?? '')) return
    cancelDrag()
    drag = {
      kind,
      id,
      x,
      y,
      element,
      content: inContent,
      origin: motion.current().height || visibleHeight(),
      active: false,
      samples: [],
    }
    if (kind === 'pointer') {
      view?.addEventListener('pointermove', pointerMove, { passive: false })
      view?.addEventListener('pointerup', pointerUp)
      view?.addEventListener('pointercancel', pointerCancel)
      element.addEventListener('lostpointercapture', pointerCancel)
    }
    view?.addEventListener('blur', cancelDrag)
  }

  function pointerDown(event: PointerEvent) {
    const target = event.target as Element | null
    const handle = target?.closest<HTMLElement>('[data-mdv-sheet-handle]')
    if (event.defaultPrevented || event.button !== 0 || !handle) return
    begin('pointer', event.pointerId, event.clientX, event.clientY, handle, false)
  }

  function dragMove(x: number, y: number, time: number) {
    if (!drag) return false
    const dx = x - drag.x
    const dy = y - drag.y
    if (!drag.active) {
      if (Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) {
        release()
        return false
      }
      if (Math.abs(dy) < 4) return false
      const body = options.content()
      if (drag.content && expanded.value && body && (dy < 0 || body.scrollTop > 0)) {
        release()
        return false
      }
      motion.stop()
      drag.active = true
      dragging.value = true
      drag.origin = motion.current().height || visibleHeight()
      drag.samples.push({ time, height: drag.origin })
      if (drag.kind === 'pointer') {
        try {
          drag.element.setPointerCapture?.(drag.id)
        } catch {
          /* 平台可能已取消指针。 */
        }
      }
    }
    const min = options.canHide()
      ? 0
      : hasPartial.value
        ? partialHeight.value
        : expandedHeight.value
    const raw = drag.origin - dy
    const height = Math.max(min, Math.min(expandedHeight.value, raw))
    if (drag.content && options.content())
      options.content()!.scrollTop = Math.max(0, raw - expandedHeight.value)
    motion.jump({ height, offset: 0, opacity: 1 })
    drag.samples.push({ time, height })
    drag.samples = drag.samples.filter((sample) => time - sample.time <= 100)
    updateScrollability()
    return true
  }

  function pointerMove(event: PointerEvent) {
    if (drag?.kind !== 'pointer' || drag.id !== event.pointerId) return
    if (dragMove(event.clientX, event.clientY, event.timeStamp)) event.preventDefault()
  }

  function release() {
    const old = drag
    drag = null
    dragging.value = false
    view?.removeEventListener('pointermove', pointerMove)
    view?.removeEventListener('pointerup', pointerUp)
    view?.removeEventListener('pointercancel', pointerCancel)
    view?.removeEventListener('blur', cancelDrag)
    if (old?.kind === 'pointer') {
      old.element.removeEventListener('lostpointercapture', pointerCancel)
      try {
        if (old.element.hasPointerCapture?.(old.id)) old.element.releasePointerCapture(old.id)
      } catch {
        /* 卸载时浏览器可先释放 capture。 */
      }
    }
    updateScrollability()
    return old
  }

  function suppressClick() {
    suppressed = true
    view?.clearTimeout(suppressTimer)
    suppressTimer =
      view?.setTimeout(() => {
        suppressed = false
      }, 0) ?? 0
  }

  function finishDrag(time: number) {
    const old = release()
    if (!old?.active) return
    suppressClick()
    const samples = old.samples
    const first = samples[0]
    const last = samples[samples.length - 1]
    const velocity =
      first && last && last.time > first.time && time - last.time < 100
        ? ((last.height - first.height) * 1000) / (last.time - first.time)
        : 0
    const stops: { state: MdvBottomSheetState; height: number }[] = []
    if (options.canHide()) stops.push({ state: 'hidden', height: 0 })
    if (hasPartial.value) stops.push({ state: 'partial', height: partialHeight.value })
    stops.push({ state: 'expanded', height: expandedHeight.value })
    const height = motion.current().height
    const nearest = (value: number) =>
      stops.reduce((a, b) => (Math.abs(a.height - value) <= Math.abs(b.height - value) ? a : b))
    let target = nearest(height)
    const upward =
      Math.abs(velocity) > (options.modal ? 1000 : 125) ? velocity > 0 : height >= old.origin
    const next = upward
      ? stops.find((stop) => stop.height > old.origin + 1)
      : [...stops].reverse().find((stop) => stop.height < old.origin - 1)
    if (
      next &&
      (Math.abs(velocity) > (options.modal ? 1000 : 125) ||
        Math.abs(height - old.origin) >= Math.min(56, Math.abs(next.height - old.origin) / 2))
    ) {
      if (target.state === nearest(old.origin).state) target = next
    }
    void request(target.state, 'swipe', velocity)
  }

  function pointerUp(event: PointerEvent) {
    if (drag?.kind === 'pointer' && drag.id === event.pointerId) finishDrag(event.timeStamp)
  }

  function pointerCancel(event: PointerEvent) {
    if (drag?.kind === 'pointer' && drag.id === event.pointerId) cancelDrag()
  }

  function cancelDrag() {
    const old = release()
    if (old?.active) {
      suppressClick()
      if (active && mounted && (!options.modal || options.phase?.() === 'open')) move()
    }
  }

  function touchStart(event: TouchEvent) {
    if (event.defaultPrevented || event.touches.length !== 1 || ignored(event.target)) return
    const target = event.target as Element
    if (target.closest('[data-mdv-sheet-handle]')) return
    const touch = event.touches[0]!
    const panel = options.panel()
    if (!panel) return
    begin(
      'touch',
      touch.identifier,
      touch.clientX,
      touch.clientY,
      panel,
      !!options.content()?.contains(target),
    )
  }

  function touchMove(event: TouchEvent) {
    if (drag?.kind !== 'touch') return
    if (
      event.touches.length !== 1 ||
      options.panel()?.ownerDocument.getSelection()?.isCollapsed === false
    ) {
      cancelDrag()
      return
    }
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === drag!.id)
    if (!touch) return
    if (dragMove(touch.clientX, touch.clientY, event.timeStamp) && event.cancelable)
      event.preventDefault()
  }

  function touchEnd(event: TouchEvent) {
    if (
      drag?.kind !== 'touch' ||
      !Array.from(event.changedTouches).some((touch) => touch.identifier === drag!.id)
    )
      return
    if (event.type === 'touchcancel') cancelDrag()
    else finishDrag(event.timeStamp)
  }

  function clickCapture(event: MouseEvent) {
    if (!suppressed) return
    event.preventDefault()
    event.stopPropagation()
  }

  function attach() {
    resize?.disconnect()
    mutation?.disconnect()
    if (!active || !mounted || (options.modal && options.state() === 'hidden')) return
    if (typeof view?.ResizeObserver === 'function') {
      resize = new view.ResizeObserver(schedule)
      for (const element of [
        options.root(),
        options.bounds(),
        options.panel(),
        options.content(),
      ]) {
        if (element) resize.observe(element)
      }
    }
    if (typeof view?.MutationObserver === 'function' && options.panel()) {
      mutation = new view.MutationObserver(schedule)
      mutation.observe(options.panel()!, { childList: true, subtree: true, characterData: true })
    }
  }

  function suspend() {
    active = false
    movement++
    requestVersion++
    requesting = false
    requestTarget = null
    cancelDrag()
    motion.stop()
    lastTarget = -1
    resize?.disconnect()
    mutation?.disconnect()
    view?.clearTimeout(suppressTimer)
    suppressed = false
    detachViewport()
  }

  function observeViewport() {
    view?.addEventListener('resize', refreshViewport)
    if (options.modal) {
      view?.visualViewport?.addEventListener('resize', refreshViewport)
      view?.visualViewport?.addEventListener('scroll', refreshViewport)
    }
    media?.addEventListener('change', reduceMotion)
  }

  function detachViewport() {
    view?.removeEventListener('resize', refreshViewport)
    view?.visualViewport?.removeEventListener('resize', refreshViewport)
    view?.visualViewport?.removeEventListener('scroll', refreshViewport)
    media?.removeEventListener('change', reduceMotion)
  }

  watch(
    () => options.state(),
    (value, previous) => {
      cancelDrag()
      if (previous === 'hidden') {
        measured.value = false
        if (requesting && requestTarget !== value) {
          requestVersion++
          requesting = false
          requestTarget = null
        }
      }
      if (!mounted || !active) return
      notify('model')
      void nextTick(() => {
        attach()
        sync('model')
      })
    },
  )
  watch(
    () => options.draggable(),
    () => {
      cancelDrag()
      updateScrollability()
    },
  )
  onUpdated(schedule)
  onMounted(() => {
    mounted = true
    view = options.root()?.ownerDocument.defaultView ?? null
    media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
    observeViewport()
    refreshViewport()
    attach()
    measure()
    if (!options.modal) move(0, true)
  })
  function reduceMotion() {
    if (media?.matches) motion.finish()
  }
  onActivated(() => {
    if (active) return
    active = true
    observeViewport()
    attach()
    refreshViewport()
  })
  onDeactivated(suspend)
  onBeforeUnmount(() => {
    mounted = false
    suspend()
  })

  return {
    state,
    expanded,
    fullHeight,
    hasPartial,
    canChange,
    canDrag,
    dragging,
    scrollable,
    contentHidden,
    visibleHeight: computed(() => visibleHeight()),
    previewHeight: computed(() => visibleHeight('partial')),
    animateModal,
    prepareModal,
    schedule,
    request,
    toggle,
    expand: () => request('expanded', 'action'),
    collapse: () => request('partial', 'action'),
    listeners: {
      pointerdown: pointerDown,
      touchstart: touchStart,
      touchmove: touchMove,
      touchend: touchEnd,
      touchcancel: touchEnd,
      clickCapture,
    },
    contentScroll: updateScrollability,
  }
}
