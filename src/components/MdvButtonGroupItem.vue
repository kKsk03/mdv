<script setup lang="ts">
import {
  computed,
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { resolveButtonColor } from './button-color'
import { useButtonRipple } from './button-ripple'
import { mdvButtonGroupKey } from './button-group-context'
import type { ButtonGroupMember } from './button-group-context'
import type { MdvButtonGroupItemProps, MdvButtonGroupItemSlotProps } from './button-group.types'

defineOptions({ name: 'MdvButtonGroupItem', inheritAttrs: false })
const props = withDefaults(defineProps<MdvButtonGroupItemProps>(), {
  variant: 'filled',
  iconOnly: false,
  width: 'default',
  selected: undefined,
  disabled: false,
  loading: false,
  type: 'button',
})
const emit = defineEmits<{ 'update:selected': [value: boolean] }>()
const slots = defineSlots<{
  default?(state: MdvButtonGroupItemSlotProps): VNode[]
  leading?(state: MdvButtonGroupItemSlotProps): VNode[]
  trailing?(state: MdvButtonGroupItemSlotProps): VNode[]
  selected?(state: MdvButtonGroupItemSlotProps): VNode[]
}>()
const attrs = useAttrs()
const group = inject(mdvButtonGroupKey, null)
const element = useTemplateRef<HTMLElement>('element')
const surface = useTemplateRef<HTMLSpanElement>('surface')
const content = useTemplateRef<HTMLSpanElement>('content')
const groupedSelection = computed(() => !!group && group.selection.value !== 'none')
const toggle = computed(() => groupedSelection.value || props.selected !== undefined)
const checked = computed(() =>
  groupedSelection.value ? group!.selected(props.value) : props.selected === true,
)
const isLink = computed(() => !toggle.value && props.href != null)
const size = computed(() =>
  group?.variant.value === 'connected'
    ? group.size.value
    : (props.size ?? group?.size.value ?? 's'),
)
const shape = computed(() =>
  group?.variant.value === 'connected'
    ? group.shape.value
    : (props.shape ?? group?.shape.value ?? 'round'),
)
const density = computed(() => group?.density.value ?? 0)
const unavailable = computed(
  () =>
    props.disabled ||
    group?.disabled.value === true ||
    attrs['aria-disabled'] === true ||
    attrs['aria-disabled'] === 'true',
)
const colors = computed(() => resolveButtonColor(props.color))
const pressed = ref(false)
let pointer: number | undefined
let key: string | undefined
let pulse: ReturnType<typeof setTimeout> | undefined
let listening: Window | null = null
let active = true
const { ripple, showRipple, finishRipple } = useButtonRipple({
  disabled: blocked,
  isLink: () => isLink.value,
  surface: () => surface.value,
})

function blocked() {
  return (
    unavailable.value ||
    !!element.value?.matches(':disabled') ||
    !!element.value?.closest('[inert], [hidden]')
  )
}
function rootAttrs() {
  const result = { ...attrs }
  if (unavailable.value) {
    for (const name of Object.keys(result))
      if (
        /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i.test(
          name,
        )
      )
        delete result[name]
    if (isLink.value) {
      result.role = 'link'
      result.tabindex = -1
    }
    result['aria-disabled'] = 'true'
  }
  if (toggle.value) result['aria-pressed'] = checked.value ? 'true' : 'false'
  if (props.loading) result['aria-busy'] = 'true'
  return result
}
function preventBlocked(event: Event) {
  if (!blocked()) return
  if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
function listen() {
  if (listening) return
  listening = element.value?.ownerDocument.defaultView ?? null
  listening?.addEventListener('pointerup', endPointer, true)
  listening?.addEventListener('pointercancel', endPointer, true)
  listening?.addEventListener('keyup', endKey, true)
  listening?.addEventListener('blur', release)
}
function release() {
  const wasPressed = pressed.value
  if (pulse !== undefined) clearTimeout(pulse)
  pulse = undefined
  pointer = undefined
  key = undefined
  pressed.value = false
  if (ripple.value) ripple.value.released = true
  listening?.removeEventListener('pointerup', endPointer, true)
  listening?.removeEventListener('pointercancel', endPointer, true)
  listening?.removeEventListener('keyup', endKey, true)
  listening?.removeEventListener('blur', release)
  listening = null
  if (wasPressed) group?.animate()
}
function startPointer(event: PointerEvent) {
  if (
    !active ||
    blocked() ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.isPrimary === false
  )
    return
  release()
  pointer = event.pointerId
  pressed.value = true
  listen()
  showRipple(event)
  group?.animate()
}
function endPointer(event: PointerEvent) {
  if (pointer !== undefined && pointer === event.pointerId) release()
}
function startKey(event: KeyboardEvent) {
  if (
    !active ||
    blocked() ||
    event.defaultPrevented ||
    event.repeat ||
    (event.key !== 'Enter' && (event.key !== ' ' || isLink.value))
  )
    return
  release()
  key = event.key
  pressed.value = true
  listen()
  showRipple(event)
  group?.animate()
}
function endKey(event: KeyboardEvent) {
  if (key === event.key) release()
}
function activate(event: MouseEvent) {
  if (blocked() || event.defaultPrevented || event.button !== 0) return
  if (groupedSelection.value) {
    if (props.value !== undefined) group!.toggle(props.value)
  } else if (toggle.value) emit('update:selected', !props.selected)
  // 辅助技术／程序激活没有 pointerdown；只补视觉反馈，不重复触发 click。
  if (!pressed.value && event.detail === 0) {
    release()
    pressed.value = true
    group?.animate()
    pulse = setTimeout(release, 100)
  }
}
const member: ButtonGroupMember = {
  element: () => element.value,
  surface: () => surface.value,
  content: () => content.value,
  value: () => props.value,
  disabled: blocked,
  selected: () => checked.value,
  pressed: () => pressed.value,
  shape: () => shape.value,
  size: () => size.value,
  release,
}
const unregister = group?.register(member)
watch(
  [checked, size, shape],
  () => {
    group?.animate()
    group?.refresh()
  },
  { flush: 'post' },
)
watch(unavailable, (value) => {
  if (value) release()
})
let warning = ''
function checkUsage() {
  if (!import.meta.env.DEV) return
  const messages = []
  if (!group) messages.push('place items inside MdvButtonGroup')
  if (groupedSelection.value && props.value === undefined)
    messages.push('selection items need a unique value')
  if (groupedSelection.value && props.selected !== undefined)
    messages.push('group selection controls selected; omit item selected')
  if (toggle.value && props.href != null)
    messages.push('toggle items use button semantics; href is ignored')
  if (props.color !== undefined && !colors.value)
    messages.push('invalid color; using the default colors')
  if (props.iconOnly && !String(attrs['aria-label'] ?? attrs['aria-labelledby'] ?? '').trim())
    messages.push('icon-only items need aria-label or aria-labelledby')
  if (
    groupedSelection.value &&
    group &&
    group.selection.value !== 'none' &&
    props.value !== undefined
  ) {
    const siblings = element.value
      ?.closest('[data-mdv-button-group]')
      ?.querySelectorAll('[data-mdv-group-value]')
    if (
      siblings &&
      [...siblings].filter(
        (node) =>
          node.getAttribute('data-mdv-group-value') === `${typeof props.value}:${props.value}`,
      ).length > 1
    )
      messages.push('selection values must be unique')
  }
  const message = messages.join('; ')
  if (message && message !== warning) console.warn(`[MDV] MdvButtonGroupItem: ${message}.`)
  warning = message
}
onMounted(checkUsage)
onUpdated(() => {
  checkUsage()
  group?.refresh()
})
onActivated(() => {
  active = true
})
onDeactivated(() => {
  active = false
  release()
})
onBeforeUnmount(() => {
  active = false
  release()
  unregister?.()
})
defineExpose({
  element,
  focus: (options?: FocusOptions) => element.value?.focus(options),
  blur: () => element.value?.blur(),
})
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    ref="element"
    v-bind="rootAttrs()"
    class="mdv-button-group-item"
    :class="[
      `mdv-button-group-item--${size}`,
      `mdv-button-group-item--${shape}`,
      `mdv-button-group-item--${props.width}-width`,
      {
        'mdv-button-group-item--icon-only': props.iconOnly,
        'mdv-button-group-item--toggle': toggle,
        'mdv-button-group-item--selected': checked,
        'mdv-button-group-item--disabled': unavailable,
        'mdv-button-group-item--pressed': pressed,
      },
    ]"
    :style="{ '--mdv-group-density': density }"
    :href="isLink && !unavailable ? props.href : undefined"
    :type="isLink ? undefined : props.type"
    :value="isLink ? undefined : props.value"
    :disabled="!isLink && unavailable ? true : undefined"
    :data-mdv-group-value="
      props.value === undefined ? undefined : `${typeof props.value}:${props.value}`
    "
    @click.capture="preventBlocked"
    @auxclick.capture="preventBlocked"
    @dblclick.capture="preventBlocked"
    @keydown.capture="preventBlocked"
    @keyup.capture="preventBlocked"
    @click="activate"
    @pointerdown="startPointer"
    @pointerleave="release"
    @pointercancel="release"
    @keydown="startKey"
    @blur="release"
  >
    <span
      ref="surface"
      class="mdv-button mdv-button-group-item__surface"
      :class="[
        `mdv-button--${size}`,
        `mdv-button--${props.variant}`,
        { 'mdv-button--disabled': unavailable, 'mdv-button--colored': !!colors },
      ]"
      :style="colors"
    >
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-button__ripple"
        :class="{ 'mdv-button__ripple--released': ripple.released }"
        aria-hidden="true"
        @animationend="finishRipple"
      >
        <span
          class="mdv-button__ripple-wave"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
        />
      </span>
      <span ref="content" class="mdv-button__content mdv-button-group-item__content">
        <span v-if="props.loading" class="mdv-button__spinner" aria-hidden="true" />
        <template v-if="props.iconOnly">
          <span v-show="!props.loading" class="mdv-button__icon" aria-hidden="true" inert>
            <slot v-if="checked && slots.selected" name="selected" :selected="checked" />
            <slot v-else :selected="checked" />
          </span>
        </template>
        <template v-else>
          <span
            v-if="!props.loading && ((checked && slots.selected) || slots.leading)"
            class="mdv-button__icon"
            aria-hidden="true"
            inert
          >
            <slot v-if="checked && slots.selected" name="selected" :selected="checked" />
            <slot v-else name="leading" :selected="checked" />
          </span>
          <span v-show="!props.loading || props.loadingText === undefined" class="mdv-button__label"
            ><slot :selected="checked"
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
            ><slot name="trailing" :selected="checked"
          /></span>
        </template>
      </span>
    </span>
  </component>
</template>
