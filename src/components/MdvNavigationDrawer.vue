<script setup lang="ts">
import {
  computed,
  nextTick,
  normalizeStyle,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue, VNode } from 'vue'
import NavigationDrawerSurface from './NavigationDrawerSurface.vue'
import { createSideSheetMotion, sideSheetDirection } from './side-sheet-motion'
import type {
  MdvNavigationDrawerCloseDetail,
  MdvNavigationDrawerProps,
  MdvNavigationDrawerSlotProps,
} from './navigation-drawer.types'

defineOptions({ name: 'MdvNavigationDrawer', inheritAttrs: false })
const props = withDefaults(defineProps<MdvNavigationDrawerProps>(), {
  modelValue: true,
  title: '',
  width: '360px',
  destroyOnClose: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvNavigationDrawerCloseDetail]
  closed: [detail: MdvNavigationDrawerCloseDetail]
}>()
const slots = defineSlots<{
  default?(props: MdvNavigationDrawerSlotProps): VNode[]
  header?(props: MdvNavigationDrawerSlotProps): VNode[]
  footer?(props: MdvNavigationDrawerSlotProps): VNode[]
}>()
const attrs = useAttrs()
const id = `mdv-navigation-drawer-${useId()}`
const track = useTemplateRef<HTMLElement>('track')
const surface = useTemplateRef<InstanceType<typeof NavigationDrawerSurface>>('surface')
const phase = ref<'closed' | 'opening' | 'open' | 'closing'>(props.modelValue ? 'open' : 'closed')
const rendered = ref(!props.destroyOnClose || props.modelValue)
const available = ref<string>()
const panel = () => surface.value?.element ?? null
const motion = createSideSheetMotion({
  panel,
  track: () => track.value,
  direction: () => sideSheetDirection(panel(), 'start'),
  initiallyOpen: props.modelValue,
  extentProperty: '--mdv-drawer-extent',
})
let mounted = false
let active = true
let transition = 0
let request = 0
let closeTask: Promise<boolean> | null = null
let requestedClose: MdvNavigationDrawerCloseDetail | undefined
let previousFocus: HTMLElement | null = null
let focusedWithin: HTMLElement | null = null
let resize: ResizeObserver | undefined
let media: MediaQueryList | undefined
let view: Document['defaultView'] | undefined
function trackStyle() {
  const theme = Object.fromEntries(
    Object.entries(normalizeStyle([attrs.style as StyleValue]) ?? {}).filter(([key]) =>
      key.startsWith('--'),
    ),
  )
  return { ...theme, '--mdv-drawer-width': props.width, '--mdv-drawer-available': available.value }
}
function navAttrs() {
  const result: Record<string, unknown> = { ...attrs, id: attrs.id ?? id }
  for (const key of ['role', 'tabindex', 'hidden', 'inert', 'aria-hidden']) delete result[key]
  return result
}
function measure() {
  const parent = track.value?.parentElement
  if (parent) {
    const padding = view?.getComputedStyle(parent)
    const width =
      parent.clientWidth -
      (Number.parseFloat(padding?.paddingLeft ?? '') || 0) -
      (Number.parseFloat(padding?.paddingRight ?? '') || 0)
    available.value = `${Math.max(0, width)}px`
  }
}
function rememberFocus(event: FocusEvent) {
  const nav = panel()
  const target = event.target
  focusedWithin =
    target instanceof HTMLElement &&
    nav?.contains(target) &&
    target.closest('dialog') === nav.closest('dialog')
      ? target
      : null
}
function forgetFocus(event: FocusEvent) {
  if (panel()?.isConnected && event.target === focusedWithin) focusedWithin = null
}
function restoreFocus(detached = false) {
  const nav = panel()
  if (!nav) return
  const doc = nav.ownerDocument
  const focused = doc.activeElement
  const ownsFocus =
    !!focused && nav.contains(focused) && focused.closest('dialog') === nav.closest('dialog')
  // KeepAlive 先移动 DOM 再执行停用钩子；仅补回缓存移动造成的焦点丢失。
  const lostOnDetach =
    detached &&
    !nav.isConnected &&
    (focused === doc.body || focused === doc.documentElement) &&
    !!focusedWithin &&
    nav.contains(focusedWithin) &&
    focusedWithin.closest('dialog') === nav.closest('dialog')
  if (!ownsFocus && !lostOnDetach) return
  if (
    previousFocus?.isConnected &&
    !previousFocus.closest('[hidden], [inert]') &&
    !previousFocus.matches(':disabled')
  )
    previousFocus.focus({ preventScroll: true })
  else if (ownsFocus) (focused as HTMLElement).blur()
}
function invalidateClose() {
  request++
  closeTask = null
  requestedClose = undefined
}
async function show() {
  if (!mounted || !active || !props.modelValue) return
  const ticket = ++transition
  invalidateClose()
  const focused = track.value?.ownerDocument.activeElement
  if (phase.value !== 'closing')
    previousFocus = focused instanceof HTMLElement && !panel()?.contains(focused) ? focused : null
  rendered.value = true
  phase.value = 'opening'
  emit('open')
  await nextTick()
  if (ticket !== transition || !mounted || !active || !props.modelValue) return
  measure()
  const animation = motion.play(true)
  await animation.finished
  if (ticket !== transition || !mounted || !active) return
  phase.value = 'open'
  emit('opened')
}
async function hide(detail: MdvNavigationDrawerCloseDetail) {
  const ticket = ++transition
  invalidateClose()
  if (!mounted || !active || phase.value === 'closed') {
    phase.value = 'closed'
    if (props.destroyOnClose) rendered.value = false
    return
  }
  restoreFocus()
  phase.value = 'closing'
  emit('close', { ...detail })
  await motion.play(false).finished
  if (ticket !== transition || !mounted || !active) return
  phase.value = 'closed'
  if (props.destroyOnClose) rendered.value = false
  emit('closed', { ...detail })
}
function close(): Promise<boolean> {
  if (closeTask) return closeTask
  if (!mounted || !active || !props.modelValue || phase.value === 'closing')
    return Promise.resolve(false)
  const ticket = ++request
  const detail: MdvNavigationDrawerCloseDetail = { reason: 'action' }
  closeTask = (async () => {
    try {
      const allowed = await props.beforeClose?.(Object.freeze({ ...detail }))
      if (allowed === false || ticket !== request || !mounted || !active || !props.modelValue)
        return false
      requestedClose = detail
      emit('update:modelValue', false)
      await nextTick()
      return !props.modelValue
    } catch (error) {
      console.error(
        '[MDV] MdvNavigationDrawer: beforeClose failed; the drawer remains open.',
        error,
      )
      return false
    } finally {
      if (ticket === request) {
        closeTask = null
        requestedClose = undefined
      }
    }
  })()
  return closeTask
}
const slotProps = computed<MdvNavigationDrawerSlotProps>(() => ({ close }))
watch(
  () => props.modelValue,
  (value) => {
    if (value) void show()
    else void hide(requestedClose ?? { reason: 'model' })
  },
)
watch(
  () => props.destroyOnClose,
  (value) => {
    if (phase.value === 'closed') rendered.value = !value
  },
)
watch(
  () => [props.width, attrs.dir],
  () => {
    measure()
    if (phase.value === 'open' || phase.value === 'closed') motion.jump(props.modelValue)
  },
)
function reduceMotion() {
  if (media?.matches) motion.jump(props.modelValue)
}
function start() {
  active = true
  view = track.value?.ownerDocument.defaultView
  if (typeof view?.ResizeObserver === 'function') {
    resize = new view.ResizeObserver(measure)
    if (track.value?.parentElement) resize.observe(track.value.parentElement)
  }
  view?.addEventListener('resize', measure)
  media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', reduceMotion)
  measure()
  if (props.modelValue) void show()
}
function suspend() {
  active = false
  transition++
  invalidateClose()
  restoreFocus(true)
  focusedWithin = null
  motion.jump(false)
  phase.value = 'closed'
  resize?.disconnect()
  resize = undefined
  view?.removeEventListener('resize', measure)
  media?.removeEventListener('change', reduceMotion)
}
onMounted(() => {
  mounted = true
  start()
})
onActivated(() => {
  if (!active) start()
})
onDeactivated(suspend)
onBeforeUnmount(() => {
  mounted = false
  suspend()
})
function focus() {
  if (props.modelValue && active) surface.value?.focus()
}
defineExpose({ close, focus })
</script>

<template>
  <div
    ref="track"
    class="mdv-navigation-drawer"
    :style="trackStyle()"
    :data-state="phase"
    :hidden="phase === 'closed'"
    @focusin.capture="rememberFocus"
    @focusout.capture="forgetFocus"
  >
    <NavigationDrawerSurface
      v-if="rendered"
      ref="surface"
      v-bind="navAttrs()"
      :title="title"
      :title-id="id + '-title'"
      :visible="modelValue"
      :close="close"
      :inert="!modelValue ? true : undefined"
      :aria-hidden="!modelValue ? true : undefined"
    >
      <template v-if="slots.header" #header><slot name="header" v-bind="slotProps" /></template>
      <template #default><slot v-bind="slotProps" /></template>
      <template v-if="slots.footer" #footer><slot name="footer" v-bind="slotProps" /></template>
    </NavigationDrawerSurface>
  </div>
</template>
