<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  mergeProps,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  shallowRef,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance, VNode } from 'vue'
import { resolveButtonColor } from './button-color'
import { createSplitButtonMotion, splitButtonSizes } from './split-button-motion'
import { useSplitButtonPart } from './split-button-part'
import type { MdvSplitButtonMenuAttrs, MdvSplitButtonProps } from './split-button.types'

defineOptions({ name: 'MdvSplitButton', inheritAttrs: false })
const props = withDefaults(defineProps<MdvSplitButtonProps>(), {
  variant: 'filled',
  size: 's',
  expanded: false,
  disabled: false,
  actionDisabled: false,
  menuDisabled: false,
  loading: false,
  iconOnly: false,
  type: 'button',
  hoverShadow: false,
  fullWidth: false,
})
const emit = defineEmits<{ click: [event: MouseEvent]; 'menu-click': [event: MouseEvent] }>()
const slots = defineSlots<{
  default?(): VNode[]
  leading?(): VNode[]
  trailing?(): VNode[]
}>()
const attrs = useAttrs()
const instance = getCurrentInstance()!
const element = useTemplateRef<HTMLElement>('element')
const actionElement = useTemplateRef<HTMLElement>('actionElement')
const menuButtonElement = shallowRef<HTMLButtonElement | null>(null)
const colors = computed(() => resolveButtonColor(props.color))
const isLink = computed(() => props.href != null || props.actionAttrs?.href != null)
const actionUnavailable = computed(
  () => props.disabled || props.actionDisabled || unavailable(props.actionAttrs),
)
const menuUnavailable = computed(
  () => props.disabled || props.menuDisabled || unavailable(props.menuButtonAttrs),
)
let mounted = false
let running = true
let observer: ResizeObserver | undefined
let reduced: MediaQueryList | undefined
let forwarded: MdvSplitButtonMenuAttrs['ref']

function unavailable(source: { disabled?: unknown; 'aria-disabled'?: unknown } | undefined) {
  return (
    source?.disabled === true ||
    source?.disabled === '' ||
    source?.['aria-disabled'] === true ||
    source?.['aria-disabled'] === 'true'
  )
}
function refresh(jump = false) {
  if (mounted && running) motion.update(jump)
}
const action = useSplitButtonPart({
  element: () => actionElement.value,
  surface: () => actionElement.value,
  disabled: () => actionUnavailable.value,
  isLink: () => isLink.value,
  changed: () => refresh(),
})
const menu = useSplitButtonPart({
  element: () => menuButtonElement.value,
  surface: () => menuButtonElement.value,
  disabled: () => menuUnavailable.value,
  isLink: () => false,
  changed: () => refresh(),
})
const motion = createSplitButtonMotion({
  element: () => element.value,
  action: () => actionElement.value,
  menu: () => menuButtonElement.value,
  size: () => props.size,
  expanded: () => props.expanded,
  actionActive: action.interactive,
  menuActive: menu.interactive,
})

function assignRef(reference: MdvSplitButtonMenuAttrs['ref'], value: HTMLButtonElement | null) {
  if (typeof reference === 'function') reference(value, instance.refs)
  else if (reference && typeof reference !== 'string') reference.value = value
}
function setMenuElement(value: Element | ComponentPublicInstance | null) {
  if (forwarded && forwarded !== props.menuButtonAttrs?.ref) assignRef(forwarded, null)
  menuButtonElement.value = value as HTMLButtonElement | null
  forwarded = props.menuButtonAttrs?.ref
  assignRef(forwarded, menuButtonElement.value)
}
watch(
  () => props.menuButtonAttrs?.ref,
  (reference) => {
    if (reference === forwarded) return
    assignRef(forwarded, null)
    forwarded = reference
    assignRef(forwarded, menuButtonElement.value)
  },
  { flush: 'post' },
)

function invoke(listener: unknown, event: MouseEvent) {
  if (Array.isArray(listener)) {
    for (const callback of listener) {
      if (event.defaultPrevented) break
      invoke(callback, event)
    }
  } else if (typeof listener === 'function') listener(event)
}
function bindings(tail: boolean) {
  const part = tail ? menu : action
  const source = tail ? props.menuButtonAttrs : props.actionAttrs
  const native = { ...source } as Record<string, unknown>
  delete native.onClick
  delete native.ref
  if (tail ? menuUnavailable.value : actionUnavailable.value) {
    for (const name of Object.keys(native))
      if (
        /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i.test(
          name,
        )
      )
        delete native[name]
  }
  function guard(event: Event) {
    if (!part.blocked()) return
    if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key))
      return
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  return mergeProps(
    {
      onClickCapture: guard,
      onAuxclickCapture: guard,
      onDblclickCapture: guard,
      onKeydownCapture: guard,
      onKeyupCapture: guard,
    },
    native,
    part.events,
    {
      onClick(event: MouseEvent) {
        if (part.blocked() || event.defaultPrevented) return
        if (tail) emit('menu-click', event)
        else emit('click', event)
        if (!event.defaultPrevented) invoke(source?.onClick, event)
      },
      'aria-disabled': (tail ? menuUnavailable.value : actionUnavailable.value)
        ? 'true'
        : undefined,
      'aria-busy': !tail && props.loading ? 'true' : source?.['aria-busy'],
      ...(tail
        ? {
            ref: setMenuElement,
            type: 'button',
            disabled: menuUnavailable.value ? true : undefined,
            'aria-label': props.menuButtonLabel,
            'aria-expanded': props.expanded,
          }
        : {
            href:
              isLink.value && !actionUnavailable.value
                ? (props.href ?? props.actionAttrs?.href)
                : undefined,
            type: isLink.value ? undefined : props.type,
            disabled: !isLink.value && actionUnavailable.value ? true : undefined,
            ...(isLink.value && actionUnavailable.value ? { role: 'link', tabindex: -1 } : {}),
          }),
    },
  )
}
function rootAttrs() {
  const result = { ...attrs }
  delete result.tabindex
  return result
}
const geometry = computed(() => {
  const size = splitButtonSizes[props.size]
  return {
    '--mdv-split-height': `${size.height}px`,
    '--mdv-split-menu-width': `${size.width}px`,
    '--mdv-split-icon': `${size.icon}px`,
    '--mdv-split-start': `${size.start}px`,
    '--mdv-split-end': `${size.end}px`,
    '--mdv-split-inner': `${size.inner}px`,
    '--mdv-split-active': `${size.active}px`,
    '--mdv-split-shift': `${size.shift}px`,
  }
})
function reducedChanged() {
  if (reduced?.matches) motion.finish()
}
function start() {
  running = true
  refresh(true)
  const view = element.value?.ownerDocument.defaultView
  reduced = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  reduced?.addEventListener('change', reducedChanged)
  observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => refresh())
  for (const control of [actionElement.value, menuButtonElement.value])
    if (control) observer?.observe(control)
}
function stop() {
  running = false
  observer?.disconnect()
  observer = undefined
  reduced?.removeEventListener('change', reducedChanged)
  reduced = undefined
  motion.reset()
}
let warning = ''
function checkUsage() {
  if (!import.meta.env.DEV) return
  const messages = []
  if (typeof props.menuButtonAttrs?.ref === 'string')
    messages.push('menuButtonAttrs.ref needs a function or a Vue ref')
  if (props.color !== undefined && !colors.value)
    messages.push('color must be a Button preset or hex seed')
  const message = messages.join('; ')
  if (message && warning !== message) console.warn(`[MDV] MdvSplitButton: ${message}.`)
  warning = message
}
watch(
  () => [props.expanded, props.size],
  () => refresh(),
  { flush: 'post' },
)
onMounted(() => {
  mounted = true
  start()
  checkUsage()
})
onUpdated(() => {
  refresh()
  checkUsage()
})
onActivated(() => {
  if (!running) start()
})
onDeactivated(stop)
onBeforeUnmount(() => {
  mounted = false
  stop()
})
defineExpose({
  element,
  actionElement,
  menuButtonElement,
  focus: (options?: FocusOptions) => actionElement.value?.focus(options),
  focusMenu: (options?: FocusOptions) => menuButtonElement.value?.focus(options),
  blur() {
    actionElement.value?.blur()
    menuButtonElement.value?.blur()
  },
})
</script>

<template>
  <div
    ref="element"
    v-bind="rootAttrs()"
    role="group"
    class="mdv-split-button"
    :class="[
      `mdv-split-button--${props.size}`,
      {
        'mdv-split-button--expanded': props.expanded,
        'mdv-split-button--full-width': props.fullWidth,
        'mdv-split-button--icon-only': props.iconOnly,
      },
    ]"
    :style="geometry"
  >
    <component
      :is="isLink ? 'a' : 'button'"
      ref="actionElement"
      v-bind="bindings(false)"
      class="mdv-button mdv-split-button__action"
      :class="[
        `mdv-button--${props.variant}`,
        `mdv-button--${props.size}`,
        {
          'mdv-button--disabled': actionUnavailable,
          'mdv-button--colored': !!colors,
          'mdv-button--hover-shadow': props.hoverShadow,
          'mdv-split-button__control--pressed': action.pressed.value,
        },
      ]"
      :style="colors"
    >
      <span
        v-if="action.ripple.value"
        :key="action.ripple.value.key"
        class="mdv-button__ripple"
        :class="{ 'mdv-button__ripple--released': action.ripple.value.released }"
        aria-hidden="true"
        @animationend="action.finishRipple"
        ><span
          class="mdv-button__ripple-wave"
          :style="{
            left: `${action.ripple.value.x}px`,
            top: `${action.ripple.value.y}px`,
            width: `${action.ripple.value.size}px`,
            height: `${action.ripple.value.size}px`,
          }"
      /></span>
      <span class="mdv-button__content">
        <span v-if="props.loading" class="mdv-button__spinner" aria-hidden="true" />
        <span
          v-else-if="slots.leading && !props.iconOnly"
          class="mdv-button__icon"
          aria-hidden="true"
          inert
          ><slot name="leading"
        /></span>
        <span
          v-if="props.iconOnly"
          v-show="!props.loading"
          class="mdv-button__icon"
          aria-hidden="true"
          inert
          ><slot
        /></span>
        <template v-else>
          <span v-show="!props.loading || props.loadingText === undefined" class="mdv-button__label"
            ><slot
          /></span>
          <span
            v-if="props.loading && props.loadingText"
            class="mdv-button__label mdv-button__loading-label"
            >{{ props.loadingText }}</span
          >
          <span
            v-if="slots.trailing && !props.loading"
            class="mdv-button__icon"
            aria-hidden="true"
            inert
            ><slot name="trailing"
          /></span>
        </template>
      </span>
    </component>
    <button
      v-bind="bindings(true)"
      class="mdv-button mdv-split-button__menu"
      :class="[
        `mdv-button--${props.variant}`,
        `mdv-button--${props.size}`,
        {
          'mdv-button--disabled': menuUnavailable,
          'mdv-button--colored': !!colors,
          'mdv-button--hover-shadow': props.hoverShadow,
          'mdv-split-button__control--pressed': menu.pressed.value,
        },
      ]"
      :style="colors"
    >
      <span
        v-if="menu.ripple.value"
        :key="menu.ripple.value.key"
        class="mdv-button__ripple"
        :class="{ 'mdv-button__ripple--released': menu.ripple.value.released }"
        aria-hidden="true"
        @animationend="menu.finishRipple"
        ><span
          class="mdv-button__ripple-wave"
          :style="{
            left: `${menu.ripple.value.x}px`,
            top: `${menu.ripple.value.y}px`,
            width: `${menu.ripple.value.size}px`,
            height: `${menu.ripple.value.size}px`,
          }"
      /></span>
      <span class="mdv-split-button__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="m7 10 5 5 5-5" /></svg>
      </span>
    </button>
  </div>
</template>
