<script setup lang="ts">
import { computed, onMounted, onUpdated, useAttrs, useTemplateRef, watch } from 'vue'
import type { VNode } from 'vue'
import { resolveIconButtonColor } from './button-color'
import { useButtonRipple } from './button-ripple'
import type {
  MdvIconButtonColor,
  MdvIconButtonShape,
  MdvIconButtonSize,
  MdvIconButtonType,
  MdvIconButtonVariant,
  MdvIconButtonWidth,
} from './icon-button.types'

defineOptions({ name: 'MdvIconButton', inheritAttrs: false })

defineSlots<{
  default?(props: { selected: boolean }): VNode[]
  selected?(props: { selected: boolean }): VNode[]
}>()

const props = withDefaults(
  defineProps<{
    variant?: MdvIconButtonVariant
    color?: MdvIconButtonColor
    size?: MdvIconButtonSize
    width?: MdvIconButtonWidth
    /** 未选中时的形状；选中时 round 与 square 互换。按压不改变形状。 */
    shape?: MdvIconButtonShape
    /** 省略为普通按钮；提供布尔值即为受控切换按钮。 */
    selected?: boolean
    type?: MdvIconButtonType
    /** 仅普通模式使用原生 a；与 selected 同时提供时忽略 href。 */
    href?: string
    disabled?: boolean
    /** 只显示居中指示器，不自动禁用点击、导航或切换。 */
    loading?: boolean
  }>(),
  {
    variant: 'filled',
    size: 's',
    width: 'default',
    shape: 'round',
    selected: undefined,
    type: 'button',
    disabled: false,
    loading: false,
  },
)

const emit = defineEmits<{ 'update:selected': [selected: boolean] }>()
const attrs = useAttrs()
const isToggle = computed(() => props.selected !== undefined)
const isLink = computed(() => !isToggle.value && props.href != null)
const buttonColors = computed(() => resolveIconButtonColor(props.color))
const surface = useTemplateRef<HTMLSpanElement>('surface')
const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => props.disabled,
  isLink: () => isLink.value,
  surface: () => surface.value,
})
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i

if (import.meta.env.DEV) {
  watch(
    () => props.color,
    (color) => {
      if (color !== undefined && !buttonColors.value) {
        console.warn(
          '[MDV] MdvIconButton: color must be primary, secondary, tertiary, success, warning, error, info, or a #RGB/#RRGGBB seed. Using the default colors.',
        )
      }
    },
    { immediate: true },
  )
  watch(
    [isToggle, () => props.href],
    ([toggle, href]) => {
      if (toggle && href != null) {
        console.warn('[MDV] MdvIconButton: selected uses button semantics; href is ignored.')
      }
    },
    { immediate: true },
  )

  let warnedMissingName = false
  const checkAccessibleName = () => {
    const hasName = ['aria-label', 'aria-labelledby'].some(
      (key) => typeof attrs[key] === 'string' && attrs[key].trim().length > 0,
    )
    if (!hasName && !warnedMissingName) {
      console.warn('[MDV] MdvIconButton: provide aria-label or aria-labelledby for its action.')
    }
    warnedMissingName = !hasName
  }
  onMounted(checkAccessibleName)
  onUpdated(checkAccessibleName)
}

function rootAttrs() {
  const result = { ...attrs }
  if (props.disabled) {
    for (const key of Object.keys(result)) {
      if (activationListener.test(key)) delete result[key]
    }
    if (isLink.value) {
      result.role = 'link'
      result.tabindex = -1
      result['aria-disabled'] = 'true'
    }
  }
  if (isToggle.value) result['aria-pressed'] = props.selected ? 'true' : 'false'
  if (props.loading) result['aria-busy'] = 'true'
  return result
}

function preventDisabledActivation(event: Event) {
  if (!props.disabled) return
  if (event.type.startsWith('key')) {
    const key = (event as KeyboardEvent).key
    if (key !== 'Enter' && key !== ' ') return
  }
  event.preventDefault()
  event.stopImmediatePropagation()
}

function activate(event: MouseEvent) {
  if (props.disabled || event.defaultPrevented || event.button !== 0) return
  if (isToggle.value) emit('update:selected', !props.selected)
}
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    :style="buttonColors"
    v-bind="rootAttrs()"
    :href="isLink && !props.disabled ? props.href : undefined"
    :type="isLink ? undefined : props.type"
    :disabled="!isLink && props.disabled ? true : undefined"
    :class="[
      'mdv-icon-button inline-flex items-center justify-center',
      `mdv-icon-button--${props.variant}`,
      `mdv-icon-button--${props.size}`,
      `mdv-icon-button--${props.width}-width`,
      `mdv-icon-button--${props.shape}`,
      {
        'mdv-icon-button--toggle': isToggle,
        'mdv-icon-button--selected': props.selected === true,
        'mdv-icon-button--colored': !!buttonColors,
        'mdv-icon-button--disabled': props.disabled,
      },
    ]"
    @click.capture="preventDisabledActivation"
    @auxclick.capture="preventDisabledActivation"
    @dblclick.capture="preventDisabledActivation"
    @keydown.capture="preventDisabledActivation"
    @keyup.capture="preventDisabledActivation"
    @keypress.capture="preventDisabledActivation"
    @click="activate"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointerleave="releaseRipple"
    @pointercancel="releaseRipple"
    @keydown="showRipple"
    @keyup="releaseRipple"
    @blur="releaseRipple"
  >
    <span ref="surface" class="mdv-icon-button__surface">
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-icon-button__ripple"
        :class="{ 'mdv-icon-button__ripple--released': ripple.released }"
        aria-hidden="true"
        @animationend="finishRipple"
      >
        <span
          class="mdv-icon-button__ripple-wave"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
        />
      </span>
      <span
        class="mdv-icon-button__icon"
        :class="{ 'mdv-icon-button__icon--hidden': props.loading }"
        aria-hidden="true"
        inert
      >
        <slot v-if="props.selected" name="selected" :selected="true">
          <slot :selected="true" />
        </slot>
        <slot v-else :selected="false" />
      </span>
      <span v-if="props.loading" class="mdv-icon-button__spinner" aria-hidden="true" />
    </span>
  </component>
</template>
