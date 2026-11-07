<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
import type { VNode } from 'vue'
import { resolveButtonColor } from './button-color'
import type {
  MdvButtonColor,
  MdvButtonShape,
  MdvButtonSize,
  MdvButtonType,
  MdvButtonVariant,
} from './button.types'

defineOptions({ name: 'MdvButton', inheritAttrs: false })

defineSlots<{
  default?(): VNode[]
  leading?(): VNode[]
  trailing?(): VNode[]
}>()

const props = withDefaults(
  defineProps<{
    variant?: MdvButtonVariant
    /** 主题／语义预设或十六进制种子色；省略时保持当前变体的官方默认配色。 */
    color?: MdvButtonColor
    size?: MdvButtonSize
    shape?: MdvButtonShape
    /** 仅用于原生 button；默认为 button，避免意外提交表单。 */
    type?: MdvButtonType
    /** 提供 href（包括空字符串）时使用原生 a，与 variant 无关。 */
    href?: string
    disabled?: boolean
    /** 显示指示器与标签；不自动禁用或阻止点击。 */
    loading?: boolean
    /** 加载标签；未提供时沿用默认插槽。布局预留两种状态中较宽的内容。 */
    loadingText?: string
    /** 开启 filled／tonal 的悬停阴影及 elevated 的悬停阴影升级。 */
    hoverShadow?: boolean
    fullWidth?: boolean
  }>(),
  {
    variant: 'filled',
    size: 's',
    shape: 'round',
    type: 'button',
    disabled: false,
    loading: false,
    hoverShadow: false,
    fullWidth: false,
  },
)

const attrs = useAttrs()
const isLink = computed(() => props.href != null)
const hasLoadingText = computed(() => props.loadingText !== undefined)
const buttonColors = computed(() => resolveButtonColor(props.color))
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i

if (import.meta.env.DEV) {
  watch(
    () => props.color,
    (color) => {
      if (color !== undefined && !buttonColors.value) {
        console.warn(
          '[MDV] MdvButton: color must be primary, secondary, tertiary, success, warning, error, info, or a #RGB/#RRGGBB seed. Using the default colors.',
        )
      }
    },
    { immediate: true },
  )
}

interface ButtonRipple {
  x: number
  y: number
  size: number
  key: number
  released: boolean
}

const ripple = ref<ButtonRipple | null>(null)
let rippleKey = 0

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) ripple.value = null
  },
)

function rootAttrs() {
  const result = { ...attrs }

  if (isLink.value && props.disabled) {
    for (const key of Object.keys(result)) {
      if (activationListener.test(key)) delete result[key]
    }

    result.role = 'link'
    result.tabindex = -1
    result['aria-disabled'] = 'true'
  }

  if (props.loading) result['aria-busy'] = 'true'

  return result
}

function preventDisabledLinkActivation(event: Event) {
  if (isLink.value && props.disabled) {
    if (event.type.startsWith('key')) {
      const key = (event as KeyboardEvent).key
      if (key !== 'Enter' && key !== ' ') return
    }

    event.preventDefault()
    event.stopImmediatePropagation()
  }
}

function showRipple(event: PointerEvent | KeyboardEvent) {
  if (props.disabled || event.defaultPrevented) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const keyboard = event.type === 'keydown'
  if (keyboard) {
    const { key, repeat } = event as KeyboardEvent
    if (repeat || (key !== 'Enter' && (key !== ' ' || isLink.value))) return
  } else {
    const pointer = event as PointerEvent
    if (pointer.button !== 0 || pointer.isPrimary === false) return
  }

  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = keyboard
    ? bounds.width / 2
    : Math.max(0, Math.min(bounds.width, (event as PointerEvent).clientX - bounds.left))
  const y = keyboard
    ? bounds.height / 2
    : Math.max(0, Math.min(bounds.height, (event as PointerEvent).clientY - bounds.top))
  const size = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y)) * 2

  ripple.value = { x, y, size, key: ++rippleKey, released: false }
}

function releaseRipple(event: Event) {
  if (event.type === 'keyup') {
    const key = (event as KeyboardEvent).key
    if (key !== 'Enter' && key !== ' ') return
  }

  if (ripple.value) ripple.value.released = true
}

function finishRipple(event: AnimationEvent) {
  if (event.animationName === 'mdv-button-ripple-fade') ripple.value = null
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
      'mdv-button inline-flex items-center justify-center',
      `mdv-button--${props.variant}`,
      `mdv-button--${props.size}`,
      `mdv-button--${props.shape}`,
      {
        'mdv-button--colored': !!buttonColors,
        'mdv-button--disabled': props.disabled,
        'mdv-button--full-width': props.fullWidth,
        'mdv-button--hover-shadow': props.hoverShadow,
      },
    ]"
    @click.capture="preventDisabledLinkActivation"
    @auxclick.capture="preventDisabledLinkActivation"
    @dblclick.capture="preventDisabledLinkActivation"
    @keydown.capture="preventDisabledLinkActivation"
    @keyup.capture="preventDisabledLinkActivation"
    @keypress.capture="preventDisabledLinkActivation"
    @pointerdown="showRipple"
    @pointerup="releaseRipple"
    @pointerleave="releaseRipple"
    @pointercancel="releaseRipple"
    @keydown="showRipple"
    @keyup="releaseRipple"
    @blur="releaseRipple"
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
    <span
      class="mdv-button__layout"
      :style="{
        '--mdv-button-normal-icons': ($slots.leading ? 1 : 0) + ($slots.trailing ? 1 : 0),
      }"
    >
      <span
        class="mdv-button__content"
        :class="{
          'mdv-button__content--hidden': props.loading && hasLoadingText,
          'mdv-button__content--reserve-spinner': !hasLoadingText,
          'mdv-button__content--loading': props.loading && !hasLoadingText,
        }"
        :aria-hidden="props.loading && hasLoadingText ? true : undefined"
        :inert="props.loading && hasLoadingText ? true : undefined"
      >
        <span
          v-if="props.loading && !hasLoadingText"
          class="mdv-button__spinner"
          aria-hidden="true"
        />
        <span v-else-if="$slots.leading" class="mdv-button__icon" aria-hidden="true">
          <slot name="leading" />
        </span>
        <span class="mdv-button__label"><slot /></span>
        <span
          v-if="$slots.trailing && (!props.loading || hasLoadingText)"
          class="mdv-button__icon"
          aria-hidden="true"
        >
          <slot name="trailing" />
        </span>
      </span>
      <span
        v-if="hasLoadingText"
        class="mdv-button__content mdv-button__loading"
        :class="{ 'mdv-button__content--hidden': !props.loading }"
        :aria-hidden="!props.loading ? true : undefined"
        :inert="!props.loading ? true : undefined"
      >
        <span class="mdv-button__spinner" aria-hidden="true" />
        <span class="mdv-button__label">{{ props.loadingText }}</span>
      </span>
    </span>
  </component>
</template>
