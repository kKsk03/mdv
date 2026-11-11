<script setup lang="ts">
import {
  computed,
  inject,
  mergeProps,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  useAttrs,
  useId,
  useTemplateRef,
} from 'vue'
import type { VNode } from 'vue'
import { useButtonRipple } from './button-ripple'
import { mdvTabsKey } from './tabs-context'
import type { MdvTabProps, MdvTabSlotProps } from './tabs.types'

defineOptions({ name: 'MdvTab', inheritAttrs: false })
const props = withDefaults(defineProps<MdvTabProps>(), { label: '', disabled: false })
const slots = defineSlots<{
  default?(props: MdvTabSlotProps): VNode[]
  icon?(props: MdvTabSlotProps): VNode[]
  badge?(props: MdvTabSlotProps): VNode[]
}>()
const context = inject(mdvTabsKey, undefined)
const attrs = useAttrs()
const button = useTemplateRef<HTMLButtonElement>('button')
const content = useTemplateRef<HTMLSpanElement>('content')
const fallbackId = `mdv-tab-${useId()}`
const controlId = computed(() =>
  typeof attrs.id === 'string' && attrs.id ? attrs.id : (context?.tabId(props.value) ?? fallbackId),
)
const active = computed(() => context?.isSelected(props.value) ?? false)
const isDisabled = computed(() => props.disabled || !context)
const hasLabel = computed(() => !!props.label || !!slots.default)
const stacked = computed(
  () => !!slots.icon && hasLabel.value && context?.iconPosition.value === 'top',
)
const primary = computed(() => context?.variant.value !== 'secondary')

function unavailable() {
  return (
    isDisabled.value ||
    (attrs.hidden != null && attrs.hidden !== false) ||
    (attrs.inert != null && attrs.inert !== false) ||
    attrs['aria-disabled'] === true ||
    attrs['aria-disabled'] === 'true' ||
    !!button.value?.matches(':disabled')
  )
}

const unregister = context?.registerTab({
  value: () => props.value,
  // tabId 仅生成稳定 ID；panel 的 labelId 才读取原生 id 覆盖。
  id: () =>
    typeof attrs.id === 'string' && attrs.id
      ? attrs.id
      : (context?.tabId(props.value) ?? fallbackId),
  element: () => button.value,
  content: () => content.value,
  unavailable,
})

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: unavailable,
  isLink: () => false,
  surface: () => button.value,
})

function handleClick(event: MouseEvent) {
  releaseRipple(event)
  if (!event.defaultPrevented && !unavailable()) void context?.select(props.value)
}

function handleFocus(event: FocusEvent) {
  if (!event.defaultPrevented && !unavailable()) context?.focused(props.value)
}

function controlAttrs() {
  const result = { ...attrs }
  for (const key of ['id', 'type', 'role', 'tabindex', 'aria-selected', 'aria-controls'])
    delete result[key]
  return mergeProps(result, {
    onClick: handleClick,
    onFocus: handleFocus,
    onPointerdown: showRipple,
    onPointerup: releaseRipple,
    onPointerleave: releaseRipple,
    onPointercancel: releaseRipple,
    onKeydown: showRipple,
    onKeyup: releaseRipple,
    onBlur: releaseRipple,
  })
}

onMounted(() => context?.changed())
onUpdated(() => context?.changed())
onDeactivated(() => {
  ripple.value = null
})
onBeforeUnmount(() => {
  ripple.value = null
  unregister?.()
})

defineExpose({
  focus: (options?: FocusOptions) => {
    if (!unavailable()) button.value?.focus(options)
  },
  blur: () => button.value?.blur(),
})
</script>

<template>
  <button
    v-bind="controlAttrs()"
    :id="controlId"
    ref="button"
    type="button"
    role="tab"
    class="mdv-tab"
    :class="{
      'mdv-tab--active': active,
      'mdv-tab--stacked': stacked,
      'mdv-tab--primary': primary,
      'mdv-tab--secondary': !primary,
      'mdv-tab--disabled':
        isDisabled || attrs['aria-disabled'] === 'true' || attrs['aria-disabled'] === true,
    }"
    :disabled="isDisabled"
    :aria-selected="active"
    :aria-controls="context?.panelId(props.value)"
    :tabindex="unavailable() ? -1 : (context?.tabIndex(props.value) ?? -1)"
  >
    <span ref="content" class="mdv-tab__content" :class="{ 'mdv-tab__content--stacked': stacked }">
      <span v-if="slots.icon" class="mdv-tab__icon-container">
        <span class="mdv-tab__icon" aria-hidden="true"><slot name="icon" :active="active" /></span>
        <span
          v-if="slots.badge && (stacked || !hasLabel)"
          class="mdv-tab__badge mdv-tab__badge--overlap"
        >
          <slot name="badge" :active="active" />
        </span>
      </span>
      <span v-if="hasLabel" class="mdv-tab__label-row">
        <span class="mdv-tab__label"
          ><slot :active="active">{{ props.label }}</slot></span
        >
        <span v-if="slots.badge && !stacked" class="mdv-tab__badge"
          ><slot name="badge" :active="active"
        /></span>
      </span>
      <span v-if="active && primary" class="mdv-tab__fallback" aria-hidden="true" />
    </span>
    <span v-if="active && !primary" class="mdv-tab__fallback" aria-hidden="true" />
    <span
      v-if="ripple"
      :key="ripple.key"
      class="mdv-tab__ripple"
      :class="{ 'mdv-tab__ripple--released': ripple.released }"
      aria-hidden="true"
      @animationend="finishRipple"
    >
      <span
        class="mdv-tab__ripple-wave"
        :style="{
          left: `${ripple.x}px`,
          top: `${ripple.y}px`,
          width: `${ripple.size}px`,
          height: `${ripple.size}px`,
        }"
      />
    </span>
  </button>
</template>
