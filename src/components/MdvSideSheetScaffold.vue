<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import closeIcon from '@iconify-icons/material-symbols/close'
import backIcon from '@iconify-icons/material-symbols/arrow-back'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import { createSideSheetMotion, sideSheetDirection } from './side-sheet-motion'
import type {
  MdvSideSheetCloseDetail,
  MdvSideSheetScaffoldProps,
  MdvSideSheetSlotProps,
} from './side-sheet.types'

defineOptions({ name: 'MdvSideSheetScaffold', inheritAttrs: false })
const props = withDefaults(defineProps<MdvSideSheetScaffoldProps>(), {
  modelValue: false,
  title: '',
  description: '',
  width: '256px',
  placement: 'end',
  detached: false,
  showBack: false,
  dividers: false,
  showDivider: true,
  destroyOnClose: false,
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: [detail: MdvSideSheetCloseDetail]
  closed: [detail: MdvSideSheetCloseDetail]
  back: []
}>()
const slots = defineSlots<{
  default?(): VNode[]
  sheet?(props: MdvSideSheetSlotProps): VNode[]
  header?(props: MdvSideSheetSlotProps): VNode[]
  actions?(props: MdvSideSheetSlotProps): VNode[]
}>()
const attrs = useAttrs()
const id = `mdv-side-sheet-${useId()}`
const root = useTemplateRef<HTMLElement>('root')
const main = useTemplateRef<HTMLElement>('main')
const track = useTemplateRef<HTMLElement>('track')
const panel = useTemplateRef<HTMLElement>('panel')
const content = useTemplateRef<HTMLElement>('content')
const phase = ref<'closed' | 'opening' | 'open' | 'closing'>(props.modelValue ? 'open' : 'closed')
const rendered = ref(!props.destroyOnClose || props.modelValue)
const scrollable = ref(false)
const motion = createSideSheetMotion({
  panel: () => panel.value,
  track: () => track.value,
  direction: () => sideSheetDirection(root.value, props.placement),
  initiallyOpen: props.modelValue,
})
let mounted = false
let active = true
let transition = 0
let request = 0
let closeTask: Promise<boolean> | null = null
let requestedClose: MdvSideSheetCloseDetail | undefined
let previousFocus: HTMLElement | null = null
let resize: ResizeObserver | undefined
let mutation: MutationObserver | undefined
let media: MediaQueryList | undefined

function layoutAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => !key.startsWith('aria-') && key !== 'role' && key !== 'tabindex',
    ),
  )
}
function panelAttrs() {
  const result = Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key.startsWith('aria-') && key !== 'aria-modal'),
  )
  if (!result['aria-label'] && !result['aria-labelledby']) {
    if (props.title || slots.header) result['aria-labelledby'] = id + '-title'
  }
  if (!result['aria-describedby'] && !slots.sheet && props.description)
    result['aria-describedby'] = id + '-description'
  return result
}
function measure() {
  const element = content.value
  scrollable.value = !!element && element.scrollHeight > element.clientHeight + 1
}
function stopObservers() {
  resize?.disconnect()
  mutation?.disconnect()
  resize = undefined
  mutation = undefined
}
function observe() {
  stopObservers()
  const view = root.value?.ownerDocument.defaultView
  if (typeof view?.ResizeObserver === 'function') {
    resize = new view.ResizeObserver(measure)
    for (const element of [root.value, content.value, content.value?.firstElementChild]) {
      if (element) resize.observe(element)
    }
  }
  if (typeof view?.MutationObserver === 'function' && content.value) {
    mutation = new view.MutationObserver(measure)
    mutation.observe(content.value, { childList: true, characterData: true, subtree: true })
  }
  measure()
}
function restoreFocus() {
  const element = panel.value
  const focused = element?.ownerDocument.activeElement
  if (!element || !focused || !element.contains(focused)) return
  // 面板中的嵌套模态仍在工作时，不把焦点移到它的背景。
  if (focused.closest('dialog[open]') !== element.closest('dialog[open]')) return
  const target =
    previousFocus?.isConnected &&
    !previousFocus.closest('[hidden], [inert]') &&
    !previousFocus.matches(':disabled')
      ? previousFocus
      : main.value
  target?.focus({ preventScroll: true })
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
  if (phase.value !== 'closing') {
    const focused = root.value?.ownerDocument.activeElement
    previousFocus =
      focused instanceof HTMLElement && !panel.value?.contains(focused) ? focused : null
  }
  rendered.value = true
  phase.value = 'opening'
  emit('open')
  await nextTick()
  if (ticket !== transition || !mounted || !active || !props.modelValue) return
  observe()
  const animation = motion.play(true)
  await animation.finished
  if (ticket !== transition || !mounted || !active) return
  animation.cancel()
  phase.value = 'open'
  emit('opened')
}
async function hide(detail: MdvSideSheetCloseDetail) {
  const ticket = ++transition
  invalidateClose()
  stopObservers()
  if (!mounted || !active || phase.value === 'closed') {
    phase.value = 'closed'
    if (props.destroyOnClose) rendered.value = false
    return
  }
  restoreFocus()
  phase.value = 'closing'
  emit('close', { ...detail })
  const animation = motion.play(false)
  await animation.finished
  if (ticket !== transition || !mounted || !active) return
  animation.cancel()
  phase.value = 'closed'
  if (props.destroyOnClose) rendered.value = false
  emit('closed', { ...detail })
}
function requestClose(
  reason: 'action' | 'close-button' = 'action',
  returnValue = '',
): Promise<boolean> {
  if (closeTask) return closeTask
  if (!mounted || !active || !props.modelValue || phase.value === 'closing')
    return Promise.resolve(false)
  const ticket = ++request
  const detail: MdvSideSheetCloseDetail = { reason, returnValue }
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
        '[MDV] MdvSideSheetScaffold: beforeClose failed; the sheet remains open.',
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
const slotProps = computed<MdvSideSheetSlotProps>(() => ({
  close: (returnValue = '') => requestClose('action', returnValue),
}))
function focus() {
  if (props.modelValue && active) panel.value?.focus({ preventScroll: true })
}
watch(
  () => props.modelValue,
  (value) => {
    if (value) void show()
    else void hide(requestedClose ?? { reason: 'model', returnValue: '' })
  },
)
watch(
  () => props.destroyOnClose,
  (value) => {
    if (phase.value === 'closed') rendered.value = !value
  },
)
watch(
  () => [props.width, props.placement, props.detached, attrs.dir],
  () => {
    if (phase.value === 'open') motion.jump(true)
  },
)
function refreshMotion() {
  if (!media?.matches) return
  motion.jump(props.modelValue)
}
function suspend() {
  active = false
  transition++
  invalidateClose()
  stopObservers()
  restoreFocus()
  motion.jump(false)
  phase.value = 'closed'
}
onUpdated(measure)
onMounted(() => {
  mounted = true
  media = root.value?.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', refreshMotion)
  if (props.modelValue) void show()
})
onActivated(() => {
  if (active) return
  active = true
  if (props.modelValue) void show()
})
onDeactivated(suspend)
onBeforeUnmount(() => {
  mounted = false
  suspend()
  media?.removeEventListener('change', refreshMotion)
})
defineExpose({ close: (returnValue = '') => requestClose('action', returnValue), focus })
</script>

<template>
  <div
    ref="root"
    v-bind="layoutAttrs()"
    class="mdv-side-sheet-scaffold"
    :class="{ 'mdv-side-sheet--detached': detached }"
    :style="{ '--mdv-side-sheet-width': width }"
    :data-placement="placement"
    :data-state="phase"
  >
    <div ref="main" class="mdv-side-sheet-scaffold__main" tabindex="-1"><slot /></div>
    <div ref="track" class="mdv-side-sheet-scaffold__track" :hidden="phase === 'closed'">
      <section
        v-if="rendered"
        ref="panel"
        v-bind="panelAttrs()"
        role="dialog"
        class="mdv-side-sheet__panel"
        :class="{
          'mdv-side-sheet__panel--dividers': dividers,
          'mdv-side-sheet__panel--back': showBack,
          'mdv-side-sheet__panel--bordered': showDivider,
        }"
        :inert="!modelValue ? true : undefined"
        :aria-hidden="!modelValue ? true : undefined"
        tabindex="-1"
      >
        <header class="mdv-side-sheet__header">
          <MdvIconButton
            v-if="showBack"
            class="mdv-side-sheet__back"
            variant="standard"
            :aria-label="backLabel"
            @click="emit('back')"
            ><MdvIcon :icon="backIcon"
          /></MdvIconButton>
          <div v-if="slots.header" :id="id + '-title'" class="mdv-side-sheet__heading">
            <slot name="header" v-bind="slotProps" />
          </div>
          <h2 v-else-if="title" :id="id + '-title'" class="mdv-side-sheet__title">{{ title }}</h2>
          <span v-else class="mdv-side-sheet__heading" />
          <MdvIconButton
            class="mdv-side-sheet__close"
            variant="standard"
            :aria-label="closeLabel"
            @click="requestClose('close-button')"
            ><MdvIcon :icon="closeIcon"
          /></MdvIconButton>
        </header>
        <div ref="content" class="mdv-side-sheet__content" :tabindex="scrollable ? 0 : undefined">
          <div class="mdv-side-sheet__body">
            <slot name="sheet" v-bind="slotProps"
              ><p v-if="description" :id="id + '-description'" class="mdv-side-sheet__description">
                {{ description }}
              </p></slot
            >
          </div>
        </div>
        <div v-if="slots.actions" class="mdv-side-sheet__actions">
          <slot name="actions" v-bind="slotProps" />
        </div>
      </section>
    </div>
  </div>
</template>
