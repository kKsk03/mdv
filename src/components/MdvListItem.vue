<script setup lang="ts">
import {
  computed,
  inject,
  mergeProps,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import MdvIcon from './MdvIcon.vue'
import MdvListControl from './_MdvListControl.vue'
import { useButtonRipple } from './button-ripple'
import { mdvListKey } from './list-context'
import type {
  MdvListItemContentProps,
  MdvListItemSlotProps,
  MdvListLeading,
  MdvListTrailing,
  MdvListValue,
} from './list.types'
import type { MdvIconData } from './icon.types'

defineOptions({ name: 'MdvListItem', inheritAttrs: false })

const slots = defineSlots<{
  default?(props: MdvListItemSlotProps): VNode[]
  overline?(props: MdvListItemSlotProps): VNode[]
  supporting?(props: MdvListItemSlotProps): VNode[]
  content?(props: MdvListItemContentProps & MdvListItemSlotProps): VNode[]
  leading?(props: MdvListItemSlotProps): VNode[]
  trailing?(props: MdvListItemSlotProps): VNode[]
  'leading-action'?(props: MdvListItemSlotProps): VNode[]
  'trailing-action'?(props: MdvListItemSlotProps): VNode[]
}>()

const props = withDefaults(
  defineProps<{
    lines?: 1 | 2 | 3
    overline?: string
    headline?: string
    supportingText?: string
    trailingText?: string
    value?: MdvListValue
    selected?: boolean
    disabled?: boolean
    interactive?: boolean
    href?: string
    type?: 'button' | 'submit' | 'reset'
    icon?: MdvIconData
    leading?: MdvListLeading
    avatarName?: string
    image?: string
    trailingIcon?: MdvIconData
    trailing?: MdvListTrailing
    /** Presentational control values; omit to follow the row's selected state. */
    leadingValue?: boolean
    trailingValue?: boolean
  }>(),
  {
    overline: '',
    headline: '',
    supportingText: '',
    trailingText: '',
    selected: false,
    disabled: false,
    interactive: false,
    type: 'button',
    leadingValue: undefined,
    trailingValue: undefined,
  },
)

const context = inject(mdvListKey, null)
const attrs = useAttrs()
const root = useTemplateRef<HTMLLIElement>('root')
const primary = useTemplateRef<HTMLElement>('primary')
const surface = useTemplateRef<HTMLSpanElement>('surface')
const itemId = 'mdv-list-item-' + useId()
const headlineId = itemId + '-headline'
const supportingId = itemId + '-supporting'
const outerKeys = new Set(['class', 'style', 'dir', 'lang', 'hidden', 'inert'])
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i

const isLink = computed(() => props.href !== undefined)
const selectable = computed(
  () =>
    !!context &&
    context.selectionMode.value !== 'none' &&
    props.value !== undefined &&
    !isLink.value,
)
const selected = computed(() =>
  selectable.value ? context?.isSelected(props.value) === true : props.selected,
)

function mainInteractive() {
  // useAttrs is updated by Vue but is not a watchable object. Read listeners during render.
  return (
    selectable.value ||
    isLink.value ||
    props.interactive ||
    Object.keys(attrs).some((key) => activationListener.test(key))
  )
}

function isDisabled() {
  return props.disabled || attrs['aria-disabled'] === true || attrs['aria-disabled'] === 'true'
}

function nativeDisabled() {
  return isDisabled() || !!primary.value?.matches(':disabled')
}

const resolvedLeading = computed(
  () =>
    props.leading ??
    (props.icon ? 'icon' : props.avatarName ? 'avatar' : props.image ? 'image' : null),
)
const resolvedTrailing = computed(
  () => props.trailing ?? (props.trailingIcon ? 'icon' : props.trailingText ? 'text' : null),
)
function isControl(
  value: MdvListLeading | MdvListTrailing | null,
): value is 'checkbox' | 'radio' | 'switch' {
  return value === 'checkbox' || value === 'radio' || value === 'switch'
}
const leadingControl = computed(() =>
  isControl(resolvedLeading.value) ? resolvedLeading.value : null,
)
const trailingControl = computed(() =>
  isControl(resolvedTrailing.value) ? resolvedTrailing.value : null,
)
const hasLeading = computed(() => !!slots.leading || !!resolvedLeading.value)
const hasTrailing = computed(
  () => !!slots.trailing || !!resolvedTrailing.value || !!props.trailingText,
)
const hasOverline = computed(() => !!slots.overline || !!props.overline)
const hasHeadline = computed(() => !!slots.default || !!props.headline)
const hasSupporting = computed(() => !!slots.supporting || !!props.supportingText)
const lineCount = computed(() => {
  if (props.lines) return props.lines
  if (context?.lines.value) return context.lines.value
  const count =
    Number(hasOverline.value) +
    Number(hasHeadline.value || !!slots.content) +
    Number(hasSupporting.value)
  return count >= 3 ? 3 : count >= 2 ? 2 : 1
})
const lineClass = computed(() =>
  lineCount.value === 3 ? 'three' : lineCount.value === 2 ? 'two' : 'one',
)
const avatarInitial = computed(
  () => Array.from(props.avatarName?.trim() || '')[0]?.toUpperCase() ?? '',
)

function joinIds(...values: unknown[]) {
  return (
    [
      ...new Set(
        values.flatMap((value) =>
          typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [],
        ),
      ),
    ].join(' ') || undefined
  )
}

function rootAttrs() {
  if (!mainInteractive()) return attrs
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => outerKeys.has(key)))
}

function primaryAttrs() {
  if (!mainInteractive()) return {}
  const result = Object.fromEntries(Object.entries(attrs).filter(([key]) => !outerKeys.has(key)))
  for (const key of ['role', 'href', 'type', 'disabled']) delete result[key]
  if (!selectable.value && !isLink.value && props.value !== undefined) result.value = props.value

  if (!result['aria-label'] && !result['aria-labelledby'] && (hasHeadline.value || slots.content)) {
    result['aria-labelledby'] = headlineId
  }
  result['aria-describedby'] = joinIds(
    attrs['aria-describedby'],
    !slots.content && hasSupporting.value ? supportingId : undefined,
  )
  if (selectable.value) {
    result.role = 'option'
    result.tabindex = isDisabled() ? -1 : context?.tabIndex(itemId, props.value)
    result['aria-selected'] = String(selected.value)
  }
  if (isDisabled()) {
    result.tabindex = -1
    result['aria-disabled'] = 'true'
    if (isLink.value) result.role = 'link'
  }
  return mergeProps(result, {
    onClick: activate,
    onKeydown: onPrimaryKeydown,
    onKeyup: releaseRipple,
    onPointerdown: showRipple,
    onPointerup: releaseRipple,
    onPointerleave: releaseRipple,
    onPointercancel: releaseRipple,
    onFocus: () => {
      if (selectable.value) context?.setTabStop(itemId)
    },
    onBlur: releaseRipple,
  })
}

function activate(event: MouseEvent) {
  if (nativeDisabled() || event.defaultPrevented || !selectable.value || props.value === undefined)
    return
  context?.setTabStop(itemId)
  context?.toggle(props.value)
}

function onPrimaryKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || nativeDisabled() || event.target !== primary.value) return
  showRipple(event)
  if (!selectable.value || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  if (!event.repeat) primary.value?.click()
}

function preventDisabledActivation(event: Event) {
  if (!nativeDisabled()) return
  if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

const { ripple, showRipple, releaseRipple } = useButtonRipple({
  disabled: () => !mainInteractive() || nativeDisabled(),
  isLink: () => isLink.value,
  surface: () => surface.value,
})

function finishRipple(event: AnimationEvent) {
  if (event.animationName === 'mdv-list-ripple-fade') ripple.value = null
}

let unregister: (() => void) | undefined
onMounted(() => {
  unregister = context?.register({
    id: itemId,
    value: () => props.value,
    primary: () => primary.value,
    element: () => root.value,
    focusable: mainInteractive,
    disabled: nativeDisabled,
    selectable: () => selectable.value,
  })
})
watch([() => props.disabled, isLink, selectable], () => {
  ripple.value = null
})
onDeactivated(() => {
  ripple.value = null
})
onBeforeUnmount(() => {
  unregister?.()
  ripple.value = null
})

if (import.meta.env.DEV && context) {
  watch(
    [() => context.selectionMode.value, () => props.value, isLink],
    ([selectionMode, value, link]) => {
      if (selectionMode !== 'none' && value === undefined) {
        console.warn('[MDV] MdvListItem: a selectable item requires a value.')
      }
      if (selectionMode !== 'none' && link) {
        console.warn('[MDV] MdvListItem: href items cannot also participate in list selection.')
      }
    },
    { immediate: true },
  )
}

function slotProps(): MdvListItemSlotProps {
  return { selected: selected.value, disabled: isDisabled() }
}

defineExpose({
  focus: (options?: FocusOptions) => {
    if (!nativeDisabled()) primary.value?.focus(options)
  },
  blur: () => primary.value?.blur(),
})
</script>

<template>
  <li
    ref="root"
    v-bind="rootAttrs()"
    :class="[
      'mdv-list-item',
      'mdv-list-item--' + lineClass + '-line',
      {
        'mdv-list-item--selected': selected,
        'mdv-list-item--disabled': isDisabled(),
        'mdv-list-item--interactive': mainInteractive(),
        'mdv-list-item--has-overline': hasOverline,
        'mdv-list-item--has-leading': hasLeading || !!$slots['leading-action'],
        'mdv-list-item--has-leading-action': !!$slots['leading-action'],
        'mdv-list-item--has-trailing-action': !!$slots['trailing-action'],
      },
    ]"
    :role="context && context.selectionMode.value !== 'none' ? 'presentation' : 'listitem'"
    :aria-disabled="isDisabled() ? 'true' : undefined"
    @click.capture="preventDisabledActivation"
    @auxclick.capture="preventDisabledActivation"
    @dblclick.capture="preventDisabledActivation"
    @keydown.capture="preventDisabledActivation"
    @keyup.capture="preventDisabledActivation"
  >
    <div class="mdv-list-item__shape">
      <span ref="surface" class="mdv-list-item__surface" aria-hidden="true">
        <span
          v-if="ripple"
          :key="ripple.key"
          class="mdv-list-item__ripple"
          :class="{ 'mdv-list-item__ripple--released': ripple.released }"
          @animationend="finishRipple"
        >
          <span
            class="mdv-list-item__ripple-wave"
            :style="{
              left: ripple.x + 'px',
              top: ripple.y + 'px',
              width: ripple.size + 'px',
              height: ripple.size + 'px',
            }"
          />
        </span>
      </span>

      <div
        v-if="$slots['leading-action']"
        class="mdv-list-item__action mdv-list-item__action--leading"
      >
        <slot name="leading-action" v-bind="slotProps()" />
      </div>

      <component
        :is="selectable ? 'div' : isLink ? 'a' : mainInteractive() ? 'button' : 'div'"
        ref="primary"
        v-bind="primaryAttrs()"
        class="mdv-list-item__primary"
        :type="!selectable && !isLink && mainInteractive() ? props.type : undefined"
        :href="isLink && !isDisabled() ? props.href : undefined"
        :disabled="!selectable && !isLink && mainInteractive() && isDisabled() ? true : undefined"
      >
        <span class="mdv-list-item__layout">
          <span
            v-if="hasLeading"
            class="mdv-list-item__leading"
            :class="resolvedLeading ? 'mdv-list-item__leading--' + resolvedLeading : undefined"
          >
            <slot name="leading" v-bind="slotProps()">
              <MdvIcon v-if="resolvedLeading === 'icon' && props.icon" :icon="props.icon" />
              <span
                v-else-if="resolvedLeading === 'avatar'"
                class="mdv-list-item__avatar"
                aria-hidden="true"
              >
                <img v-if="props.image" :src="props.image" alt="" />
                <template v-else>{{ avatarInitial }}</template>
              </span>
              <img
                v-else-if="resolvedLeading === 'image' && props.image"
                :src="props.image"
                alt=""
              />
              <MdvListControl
                v-else-if="leadingControl"
                :kind="leadingControl"
                :checked="props.leadingValue ?? selected"
              />
            </slot>
          </span>

          <span v-if="$slots.content" :id="headlineId" class="mdv-list-item__content">
            <slot name="content" v-bind="{ ...props, ...slotProps() }" />
          </span>
          <span v-else class="mdv-list-item__content">
            <span v-if="hasOverline" class="mdv-list-item__overline">
              <slot name="overline" v-bind="slotProps()">{{ props.overline }}</slot>
            </span>
            <span v-if="hasHeadline" :id="headlineId" class="mdv-list-item__headline">
              <slot v-bind="slotProps()">{{ props.headline }}</slot>
            </span>
            <span v-if="hasSupporting" :id="supportingId" class="mdv-list-item__supporting">
              <slot name="supporting" v-bind="slotProps()">{{ props.supportingText }}</slot>
            </span>
          </span>

          <span v-if="hasTrailing" class="mdv-list-item__trailing">
            <slot name="trailing" v-bind="slotProps()">
              <span v-if="props.trailingText" class="mdv-list-item__trailing-text">{{
                props.trailingText
              }}</span>
              <MdvIcon
                v-if="resolvedTrailing === 'icon' && props.trailingIcon"
                :icon="props.trailingIcon"
              />
              <MdvListControl
                v-else-if="trailingControl"
                :kind="trailingControl"
                :checked="props.trailingValue ?? selected"
              />
            </slot>
          </span>
        </span>
      </component>

      <div
        v-if="$slots['trailing-action']"
        class="mdv-list-item__action mdv-list-item__action--trailing"
      >
        <slot name="trailing-action" v-bind="slotProps()" />
      </div>
    </div>
  </li>
</template>
