<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  provide,
  ref,
  shallowRef,
  useAttrs,
  watch,
} from 'vue'
import type { ReferenceElement } from '@floating-ui/dom'
import arrowBack from '@iconify-icons/material-symbols/arrow-back'
import MdvIcon from './MdvIcon.vue'
import { menuGroupKey, menuPanelKey, menuTreeKey } from './menu-context'
import type { MenuItemEntry, MenuPanelContext } from './menu-context'
import { observeMenuPosition } from './menu-position'
import { animateMenu } from './menu-motion'
import type { MenuMotion } from './menu-motion'

defineOptions({ name: 'MdvMenuPanel', inheritAttrs: false })
const props = defineProps<{
  id: string
  open: boolean
  anchor: ReferenceElement | null
  trigger: HTMLElement | null
  labelledby?: string
  title?: string
}>()
const emit = defineEmits<{
  'request-close': []
  open: []
  opened: []
  close: []
  closed: []
}>()
const tree = inject(menuTreeKey)!
const attrs = useAttrs()
const parent = inject(menuPanelKey, null)
const element = shallowRef<HTMLElement | null>(null)
const viewport = shallowRef<HTMLElement | null>(null)
const backControl = shallowRef<HTMLButtonElement | null>(null)
const child = shallowRef<MenuPanelContext | null>(null)
const active = ref(true)
const visible = ref(false)
const rendered = ref(false)
const scrolling = ref(false)
const phase = ref('closed')
const live = ref(true)
const push = computed(() => !!parent && tree.submenuMode.value === 'push')
const obscured = computed(() => tree.submenuMode.value === 'push' && !!child.value?.visible.value)
const grouped = computed(() => tree.layout.value === 'grouped' && !scrolling.value)
const items = new Set<MenuItemEntry>()
let mounted = false
let transition = 0
let observer: ReturnType<typeof observeMenuPosition> | undefined
let mutation: MutationObserver | undefined
let motion: MenuMotion | undefined
let releaseLayer: (() => void) | undefined
let ownerDialog: HTMLDialogElement | null = null
let scheduleTimer: ReturnType<typeof setTimeout> | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined
let search = ''
let corridor: (() => void) | undefined
let media: MediaQueryList | undefined
let nativeHiding = false
let protectsPointer: (event: PointerEvent) => boolean = () => false

function orderedItems() {
  const entries = [...items]
  if (push.value && backControl.value)
    entries.unshift({
      element: () => backControl.value,
      text: () => props.title || '',
      disabled: () => false,
      open: () => {},
      hasChildren: () => false,
    })
  return entries
    .filter((item) => {
      const control = item.element()
      if (
        !control?.isConnected ||
        control.closest('[data-mdv-menu-panel]') !== element.value ||
        control.closest('[hidden], [inert]')
      )
        return false
      for (
        let node: HTMLElement | null = control;
        node && node !== element.value;
        node = node.parentElement
      ) {
        const style = node.ownerDocument.defaultView?.getComputedStyle(node)
        if (style?.display === 'none' || style?.visibility === 'hidden') return false
      }
      return true
    })
    .sort((a, b) => {
      const first = a.element()
      const second = b.element()
      return first && second && first.compareDocumentPosition(second) & 2 ? 1 : -1
    })
}

function focusControl(control?: HTMLElement | null) {
  if (!control) return
  control.focus({ preventScroll: true })
  const body = viewport.value
  if (body && body.scrollHeight > body.clientHeight) {
    const box = control.getBoundingClientRect()
    const bounds = body.getBoundingClientRect()
    if (box.top < bounds.top) body.scrollTop -= bounds.top - box.top
    else if (box.bottom > bounds.bottom) body.scrollTop += box.bottom - bounds.bottom
  }
}

function focus(edge: 'first' | 'last' = 'first') {
  const ordered = orderedItems()
  const target = edge === 'last' ? ordered[ordered.length - 1] : ordered[0]
  focusControl(target?.element() ?? element.value)
  activate()
}

function activate() {
  for (let panel = tree.root.value; panel; panel = panel.child.value) panel.active.value = false
  active.value = true
}

function cancelSchedule() {
  clearTimeout(scheduleTimer)
  scheduleTimer = undefined
  corridor?.()
  corridor = undefined
  protectsPointer = () => false
}

function schedule(action: () => void) {
  cancelSchedule()
  scheduleTimer = setTimeout(action, 130)
}

function closeChildren(except?: MenuPanelContext) {
  cancelSchedule()
  if (child.value && child.value !== except) child.value.close(false)
}

function close(restore = false) {
  closeChildren()
  if (parent?.child.value === panel) parent.child.value = null
  emit('request-close')
  if (restore && parent) {
    parent.activate()
    void nextTick(() => focusControl(props.trigger))
  }
}

function inTriangle(
  point: [number, number],
  a: [number, number],
  b: [number, number],
  c: [number, number],
) {
  const cross = (p: [number, number], q: [number, number], r: [number, number]) =>
    (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])
  const signs = [cross(point, a, b), cross(point, b, c), cross(point, c, a)]
  return !(signs.some((value) => value < 0) && signs.some((value) => value > 0))
}

function deferClose(event: PointerEvent) {
  cancelSchedule()
  if (event.pointerType !== 'mouse' || !parent || push.value) return
  const panel = element.value
  const trigger = props.trigger
  if (!panel || !trigger) return
  const destination = panel.getBoundingClientRect()
  const origin = trigger.getBoundingClientRect()
  const edge = destination.left >= origin.right - 1 ? destination.left : destination.right
  const start: [number, number] = [event.clientX, event.clientY]
  const deadline = Date.now() + 700
  const doc = panel.ownerDocument
  const later = () => {
    clearTimeout(scheduleTimer)
    scheduleTimer = setTimeout(() => {
      cancelSchedule()
      close()
    }, 250)
  }
  const move = (next: PointerEvent) => {
    const target = next.target as Node | null
    if (target && (panel.contains(target) || trigger.contains(target))) return cancelSchedule()
    if (protectsPointer(next)) later()
  }
  protectsPointer = (next) =>
    Date.now() < deadline &&
    inTriangle(
      [next.clientX, next.clientY],
      start,
      [edge, destination.top - 8],
      [edge, destination.bottom + 8],
    )
  doc.addEventListener('pointermove', move, true)
  corridor = () => doc.removeEventListener('pointermove', move, true)
  later()
}

const panel: MenuPanelContext = {
  element,
  parent,
  trigger: () => props.trigger,
  child,
  active,
  visible,
  keyboard: tree.keyboard,
  focus,
  close,
  closeChildren,
  register(item) {
    items.add(item)
    return () => items.delete(item)
  },
  activate,
  schedule,
  cancelSchedule,
  deferClose,
  protectsPointer: (event) => protectsPointer(event),
}
provide(menuPanelKey, panel)
// 每个子菜单有独立选择组，不继承父条目所在组的选择语义。
provide(menuGroupKey, null)
defineExpose({ panel })

function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return
  const tooltip = (event.target as Element | null)?.closest('[data-mdv-tooltip-panel]')
  if (tooltip && element.value?.contains(tooltip)) return
  event.stopPropagation()
  tree.keyboard.value = true
  activate()
  const ordered = orderedItems()
  const doc = element.value?.ownerDocument
  const index = ordered.findIndex((item) => item.element() === doc?.activeElement)
  const rtl =
    element.value?.ownerDocument.defaultView?.getComputedStyle(element.value).direction === 'rtl'
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft'
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const target =
      index < 0
        ? direction === 1
          ? 0
          : ordered.length - 1
        : (index + direction + ordered.length) % ordered.length
    focusControl(ordered[target]?.element())
    closeChildren()
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    closeChildren()
    focus(event.key === 'Home' ? 'first' : 'last')
  } else if (event.key === forward) {
    const item = ordered[index]
    if (item?.hasChildren() && !item.disabled()) {
      event.preventDefault()
      item.open()
    }
  } else if (event.key === backward && parent) {
    event.preventDefault()
    close(true)
  } else if (
    event.key.length === 1 &&
    event.key !== ' ' &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    search += event.key.toLocaleLowerCase()
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      search = ''
    }, 500)
    const prefix = [...search].every((letter) => letter === search[0]) ? search[0]! : search
    const after = [...ordered.slice(index + 1), ...ordered.slice(0, index + 1)]
    const target = after.find((item) => item.text().trim().toLocaleLowerCase().startsWith(prefix))
    if (target) {
      event.preventDefault()
      closeChildren()
      focusControl(target.element())
    }
  }
}

function stopPosition() {
  observer?.stop()
  observer = undefined
  mutation?.disconnect()
  mutation = undefined
}

function reposition() {
  stopPosition()
  const root = element.value
  if (!root || !props.anchor) return
  const rtl = root.ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl'
  observer = observeMenuPosition({
    element: root,
    anchor: props.anchor,
    placement: parent && !push.value ? (rtl ? 'left-start' : 'right-start') : tree.placement.value,
    offset: tree.offset.value,
    push: push.value,
    parent: parent?.element.value ?? null,
    positioned(overflows) {
      // 分隔线布局比 grouped 更高：无溢出后可安全恢复较紧凑的分组布局。
      scrolling.value = overflows
    },
  })
  const view = root.ownerDocument.defaultView
  if (typeof view?.MutationObserver === 'function' && viewport.value) {
    mutation = new view.MutationObserver(() => void observer?.update())
    mutation.observe(viewport.value, { childList: true, subtree: true, characterData: true })
  }
  return observer.update()
}

function ownerClosed() {
  tree.close('outside', false)
}

async function show() {
  if (!mounted || !live.value || !props.open || !props.anchor) return
  if (visible.value && phase.value !== 'closing') {
    await reposition()
    return
  }
  if (parent && !parent.visible.value) return close()
  const ticket = ++transition
  rendered.value = true
  await nextTick()
  const root = element.value
  if (!root || !mounted || ticket !== transition || !props.open) return
  root.style.visibility = 'hidden'
  if (!visible.value) {
    if (!root.isConnected || typeof root.showPopover !== 'function') {
      rendered.value = false
      root.style.visibility = ''
      close()
      return
    }
    root.showPopover()
    visible.value = true
  }
  if (parent) {
    parent.closeChildren(panel)
    parent.child.value = panel
  } else if (!releaseLayer) releaseLayer = tree.acquire(panel)
  if (!ownerDialog) {
    ownerDialog = root.closest('dialog')
    ownerDialog?.addEventListener('close', ownerClosed)
  }
  emit('open')
  phase.value = 'opening'
  await reposition()
  if (!mounted || ticket !== transition || !props.open) return
  root.style.visibility = ''
  const rtl = root.ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl'
  motion = animateMenu(root, true, push.value, rtl, motion)
  focus(parent ? 'first' : tree.intent.value)
  await motion.finished
  if (ticket !== transition || !mounted) return
  motion?.cancel()
  motion = undefined
  phase.value = 'open'
  emit('opened')
}

function finishHide() {
  const root = element.value
  visible.value = false
  rendered.value = false
  phase.value = 'closed'
  if (root?.matches(':popover-open')) {
    nativeHiding = true
    try {
      root.hidePopover()
    } finally {
      nativeHiding = false
    }
  }
  root?.style.removeProperty('visibility')
  if (parent?.child.value === panel) {
    parent.child.value = null
    parent.activate()
  }
}

async function hide() {
  if (!mounted || phase.value === 'closed') return
  const ticket = ++transition
  cancelSchedule()
  closeChildren()
  stopPosition()
  releaseLayer?.()
  releaseLayer = undefined
  ownerDialog?.removeEventListener('close', ownerClosed)
  ownerDialog = null
  phase.value = 'closing'
  emit('close')
  const root = element.value
  if (root) {
    const rtl = root.ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl'
    motion = animateMenu(root, false, push.value, rtl, motion)
    await motion.finished
  }
  if (ticket !== transition || !mounted) return
  motion?.cancel()
  motion = undefined
  finishHide()
  emit('closed')
}

function dispose() {
  ++transition
  cancelSchedule()
  clearTimeout(searchTimer)
  search = ''
  closeChildren()
  stopPosition()
  releaseLayer?.()
  releaseLayer = undefined
  ownerDialog?.removeEventListener('close', ownerClosed)
  ownerDialog = null
  motion?.cancel()
  motion = undefined
  finishHide()
}

watch(
  [() => props.open, () => props.anchor, live],
  () => {
    if (props.open && live.value && props.anchor) void show()
    else void hide()
  },
  { flush: 'post' },
)
watch([tree.placement, tree.offset, tree.layout, tree.variant, tree.submenuMode], () => {
  closeChildren()
  if (visible.value) void nextTick(reposition)
})
onMounted(() => {
  mounted = true
  if (!parent) tree.root.value = panel
  media = element.value?.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', reducedChanged)
  if (props.open) void show()
})
function reducedChanged() {
  if (media?.matches) motion?.cancel()
}
onActivated(() => {
  live.value = true
})
onDeactivated(() => {
  live.value = false
  dispose()
})
onBeforeUnmount(() => {
  mounted = false
  dispose()
  media?.removeEventListener('change', reducedChanged)
  if (tree.root.value === panel) tree.root.value = null
})

function pointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  cancelSchedule()
  parent?.cancelSchedule()
  tree.keyboard.value = false
  activate()
}

function pointerLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || !parent || push.value) return
  const target = event.relatedTarget as Node | null
  if (target && (element.value?.contains(target) || props.trigger?.contains(target))) return
  cancelSchedule()
  scheduleTimer = setTimeout(() => close(), 250)
}

function beforeToggle(event: Event) {
  if (
    !nativeHiding &&
    mounted &&
    live.value &&
    (event as ToggleEvent).newState === 'closed' &&
    phase.value !== 'closing' &&
    props.open
  )
    close()
}

function labelledBy() {
  return typeof attrs['aria-labelledby'] === 'string'
    ? attrs['aria-labelledby']
    : attrs['aria-label']
      ? undefined
      : props.labelledby
}
</script>

<template>
  <div
    :id="props.id"
    ref="element"
    v-show="rendered"
    v-bind="$attrs"
    popover="manual"
    role="menu"
    tabindex="-1"
    data-mdv-menu-panel
    :aria-labelledby="labelledBy()"
    :class="[
      'mdv-menu',
      `mdv-menu--${tree.variant.value}`,
      `mdv-menu--${tree.colorScheme.value}`,
      {
        'mdv-menu--grouped': grouped,
        'mdv-menu--scrolling': scrolling,
        'mdv-menu--inactive': !active,
        'mdv-menu--push': push,
        'mdv-menu--obscured': obscured,
      },
    ]"
    :data-phase="phase"
    :data-mdv-input="tree.keyboard.value ? 'keyboard' : 'pointer'"
    :inert="phase === 'closing' || undefined"
    @keydown="keydown"
    @pointerenter="pointerEnter"
    @pointerleave="pointerLeave"
    @beforetoggle="beforeToggle"
  >
    <div ref="viewport" class="mdv-menu__viewport">
      <button
        v-if="push"
        ref="backControl"
        type="button"
        role="menuitem"
        tabindex="-1"
        class="mdv-menu__back"
        @click="close(true)"
      >
        <MdvIcon :icon="arrowBack" aria-hidden="true" />
        <span>{{ props.title }}</span>
      </button>
      <slot />
    </div>
  </div>
</template>
