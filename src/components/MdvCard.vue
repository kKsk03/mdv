<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import { useButtonRipple } from './button-ripple'
import type { MdvCardVariant } from './card.types'

defineOptions({ name: 'MdvCard', inheritAttrs: false })

defineSlots<{
  header?(): VNode[]
  media?(): VNode[]
  default?(): VNode[]
  actions?(): VNode[]
}>()

const props = withDefaults(
  defineProps<{
    variant?: MdvCardVariant
    title?: string
    subtitle?: string
    /** 明确开启整卡按钮操作；提供 href 时改为原生链接。 */
    clickable?: boolean
    /** 提供 href（包括空字符串）时开启整卡链接操作。 */
    href?: string
    /** 仅禁用整卡主操作，不向静态卡片的子控件传播。 */
    disabled?: boolean
    /** 外部控制的拖动视觉，不启用 HTML draggable 或实现排序。 */
    dragged?: boolean
  }>(),
  {
    variant: 'outlined',
    title: '',
    subtitle: '',
    clickable: false,
    disabled: false,
    dragged: false,
  },
)

const attrs = useAttrs()
const titleId = `mdv-card-${useId()}-title`
const content = useTemplateRef<HTMLDivElement>('content')
const primary = useTemplateRef<HTMLButtonElement | HTMLAnchorElement>('primary')
const surface = useTemplateRef<HTMLDivElement>('surface')
const isLink = computed(() => props.href != null)
const interactive = computed(() => props.clickable || isLink.value)
const disabled = computed(() => interactive.value && props.disabled)
const outerKeys = new Set(['id', 'class', 'style', 'dir', 'lang', 'hidden', 'inert'])
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i

function belongsOutside(key: string) {
  return outerKeys.has(key) || key.startsWith('data-')
}

function outerAttrs() {
  if (!interactive.value) return attrs
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => belongsOutside(key)))
}

function primaryAttrs(hasTitle: boolean) {
  const result = { ...attrs }
  for (const key of Object.keys(result)) {
    if (belongsOutside(key) || key === 'type') delete result[key]
  }

  if (!result['aria-label'] && !result['aria-labelledby'] && hasTitle) {
    result['aria-labelledby'] = titleId
  }

  if (disabled.value) {
    result.tabindex = -1
    for (const key of Object.keys(result)) {
      if (activationListener.test(key)) delete result[key]
    }
    if (isLink.value) {
      result.role = 'link'
      result['aria-disabled'] = 'true'
    }
  }
  return result
}

function nativeDisabled() {
  return disabled.value || !!primary.value?.matches(':disabled')
}

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => !interactive.value || nativeDisabled(),
  isLink: () => isLink.value,
  surface: () => surface.value,
})

function preventDisabledActivation(event: Event) {
  if (!nativeDisabled()) return
  if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

watch([interactive, isLink, disabled], () => {
  ripple.value = null
})
onDeactivated(() => {
  ripple.value = null
})
onBeforeUnmount(() => {
  ripple.value = null
})

if (import.meta.env.DEV) {
  let warnedActions = false
  function checkComposition() {
    const element = primary.value
    const nestedActions =
      !!element &&
      !!content.value?.querySelector(
        'a[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"]), audio[controls], video[controls]',
      )
    if (nestedActions && !warnedActions) {
      console.warn(
        '[MDV] MdvCard: use a static card for buttons, links or other interactive content inside the card.',
      )
    }
    warnedActions = nestedActions
  }
  onMounted(checkComposition)
  onUpdated(checkComposition)
}

defineExpose({
  focus: (options?: FocusOptions) => {
    if (!nativeDisabled()) primary.value?.focus(options)
  },
  blur: () => {
    const element = primary.value
    if (element && element.ownerDocument.activeElement === element) element.blur()
  },
})
</script>

<template>
  <div
    v-bind="outerAttrs()"
    :class="[
      'mdv-card',
      `mdv-card--${props.variant}`,
      {
        'mdv-card--interactive': interactive,
        'mdv-card--disabled': disabled,
        'mdv-card--dragged': props.dragged,
      },
    ]"
  >
    <div ref="surface" class="mdv-card__surface" aria-hidden="true">
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-card__ripple"
        :class="{ 'mdv-card__ripple--released': ripple.released }"
        @animationend="finishRipple"
      >
        <span
          class="mdv-card__ripple-wave"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
        />
      </span>
    </div>
    <div ref="content" class="mdv-card__content">
      <div v-if="$slots.header || props.title || props.subtitle" class="mdv-card__header">
        <slot name="header">
          <p v-if="props.title" :id="titleId" class="mdv-card__title">{{ props.title }}</p>
          <p v-if="props.subtitle" class="mdv-card__subtitle">{{ props.subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.media" class="mdv-card__media"><slot name="media" /></div>
      <div v-if="$slots.default" class="mdv-card__body"><slot /></div>
      <div v-if="$slots.actions" class="mdv-card__actions"><slot name="actions" /></div>
    </div>
    <component
      :is="isLink ? 'a' : 'button'"
      v-if="interactive"
      ref="primary"
      v-bind="primaryAttrs(!$slots.header && !!props.title)"
      class="mdv-card__primary"
      :type="isLink ? undefined : 'button'"
      :href="isLink && !disabled ? props.href : undefined"
      :disabled="!isLink && disabled ? true : undefined"
      @click.capture="preventDisabledActivation"
      @auxclick.capture="preventDisabledActivation"
      @dblclick.capture="preventDisabledActivation"
      @keydown.capture="preventDisabledActivation"
      @keyup.capture="preventDisabledActivation"
      @keypress.capture="preventDisabledActivation"
      @pointerdown="showRipple"
      @pointerup="releaseRipple"
      @pointerleave="releaseRipple"
      @pointercancel="releaseRipple"
      @keydown="showRipple"
      @keyup="releaseRipple"
      @blur="releaseRipple"
    />
  </div>
</template>
