<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
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
import type { HTMLAttributes, StyleValue, VNode } from 'vue'
import check from '@iconify-icons/material-symbols/check'
import close from '@iconify-icons/material-symbols/close'
import MdvIcon from './MdvIcon.vue'
import { resolveChipColor } from './button-color'
import { useButtonRipple } from './button-ripple'
import { mdvChipSetKey } from './chip-context'
import type { ChipAction } from './chip-context'
import type { MdvChipColor, MdvChipValue, MdvChipVariant } from './chip.types'

defineOptions({ name: 'MdvChip', inheritAttrs: false })

const slots = defineSlots<{
  default?(props: { selected: boolean }): VNode[]
  leading?(props: { selected: boolean }): VNode[]
  trailing?(props: { selected: boolean }): VNode[]
  avatar?(props: { selected: boolean }): VNode[]
}>()

const props = withDefaults(
  defineProps<{
    variant?: MdvChipVariant
    label?: string
    elevated?: boolean
    color?: MdvChipColor
    value?: MdvChipValue
    selected?: boolean
    /** Filter 默认 true；Input 默认 false；其他类型不提供选择交互。 */
    selectable?: boolean
    /** Input 默认 true；Filter 默认 false。 */
    removable?: boolean
    /** Input 的整颗纸片仅请求删除，合并为一个焦点目标。 */
    removeOnly?: boolean
    removeLabel?: string
    disabled?: boolean
    /** 仅 Assist 和 Suggestion 使用原生链接。 */
    href?: string
  }>(),
  {
    variant: 'assist',
    label: '',
    elevated: false,
    selected: undefined,
    selectable: undefined,
    removable: undefined,
    removeOnly: false,
    removeLabel: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:selected': [selected: boolean]
  remove: [event: MouseEvent | KeyboardEvent]
}>()
const attrs = useAttrs()
const context = inject(mdvChipSetKey, undefined)
const chipId = `mdv-chip-${useId()}`
const root = useTemplateRef<HTMLSpanElement>('root')
const primary = useTemplateRef<HTMLButtonElement | HTMLAnchorElement>('primary')
const removeButton = useTemplateRef<HTMLButtonElement>('removeButton')
const surface = useTemplateRef<HTMLSpanElement>('surface')
const removeSurface = useTemplateRef<HTMLSpanElement>('removeSurface')
const labelElement = useTemplateRef<HTMLSpanElement>('labelElement')
const renderedLabel = ref('')
const localSelected = ref(false)
const canSelect = computed(() => props.variant === 'filter' || props.variant === 'input')
const removable = computed(() => canSelect.value && (props.removable ?? props.variant === 'input'))
const decorativeTrailing = computed(() => canSelect.value && !removable.value && !!slots.trailing)
const removeOnly = computed(() => props.variant === 'input' && props.removeOnly && removable.value)
const selectable = computed(
  () => canSelect.value && !removeOnly.value && (props.selectable ?? props.variant === 'filter'),
)
const managed = computed(
  () =>
    props.variant === 'filter' &&
    selectable.value &&
    !!context &&
    context.selection.value !== 'none',
)
const selected = computed(
  () =>
    canSelect.value &&
    !removeOnly.value &&
    (managed.value ? context!.isSelected(props.value) : (props.selected ?? localSelected.value)),
)
const disabled = computed(() => props.disabled || !!context?.disabled.value)
const isLink = computed(
  () => (props.variant === 'assist' || props.variant === 'suggestion') && props.href !== undefined,
)
const elevated = computed(() => props.elevated && props.variant !== 'input')
const hasAvatar = computed(() => props.variant === 'input' && !!slots.avatar)
const hasLeading = computed(() => !hasAvatar.value && !!slots.leading)
const showCheck = computed(() => props.variant === 'filter' && selected.value)
const colors = computed(() => resolveChipColor(props.color))
const controlId = computed(() => (typeof attrs.id === 'string' && attrs.id ? attrs.id : chipId))
const removeName = computed(() => {
  const label =
    props.label ||
    renderedLabel.value ||
    (typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : '')
  return props.removeLabel || (label ? `删除${label}` : '删除此项')
})
let pendingSelected: boolean | undefined
let selectionRevision = 0
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i

function nativeDisabled(element = primary.value) {
  return disabled.value || !!element?.matches(':disabled')
}

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => nativeDisabled(),
  isLink: () => isLink.value,
  surface: () => surface.value,
})
const removalRipple = useButtonRipple({
  disabled: () => nativeDisabled(removeButton.value),
  isLink: () => false,
  surface: () => removeSurface.value,
})

function outerAttrs(): HTMLAttributes {
  return {
    class: attrs.class as HTMLAttributes['class'],
    style: attrs.style as StyleValue,
    dir: typeof attrs.dir === 'string' ? attrs.dir : undefined,
    lang: typeof attrs.lang === 'string' ? attrs.lang : undefined,
    hidden: attrs.hidden as HTMLAttributes['hidden'],
  }
}

function primaryAttrs() {
  const result = { ...attrs }
  for (const key of ['class', 'style', 'dir', 'lang', 'hidden', 'type', 'role', 'tabindex'])
    delete result[key]
  result.id = controlId.value
  result.tabindex = disabled.value
    ? -1
    : context
      ? context.tabIndex(chipId, 'primary')
      : attrs.tabindex
  if (canSelect.value && !removeOnly.value && (selectable.value || props.selected !== undefined)) {
    result['aria-pressed'] = String(selected.value)
  }
  if (removeOnly.value) result['aria-label'] = removeName.value
  if (isLink.value && disabled.value) {
    result.role = 'link'
    result['aria-disabled'] = 'true'
  }
  if (disabled.value) {
    for (const key of Object.keys(result)) {
      if (activationListener.test(key)) delete result[key]
    }
  }
  return result
}

function preventDisabledActivation(event: Event) {
  if (!nativeDisabled(event.currentTarget as HTMLButtonElement | HTMLAnchorElement)) return
  if (
    event.type.startsWith('key') &&
    !['Enter', ' ', 'Delete', 'Backspace'].includes((event as KeyboardEvent).key)
  )
    return
  event.preventDefault()
  event.stopImmediatePropagation()
}

function requestRemove(event: MouseEvent | KeyboardEvent) {
  if (
    !removable.value ||
    nativeDisabled(event.currentTarget as HTMLButtonElement) ||
    event.defaultPrevented
  )
    return
  if (event instanceof MouseEvent && event.button !== 0) return
  emit('remove', event)
}

function activate(event: MouseEvent) {
  if (nativeDisabled() || event.defaultPrevented || event.button !== 0) return
  if (removeOnly.value) {
    requestRemove(event)
    return
  }
  if (!selectable.value) return
  if (managed.value) {
    if (props.value !== undefined) context!.toggle(props.value)
    return
  }
  const next = !(pendingSelected ?? selected.value)
  pendingSelected = next
  if (props.selected === undefined) localSelected.value = next
  emit('update:selected', next)
  const revision = ++selectionRevision
  void nextTick(() => {
    if (revision === selectionRevision) pendingSelected = undefined
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
    return
  if (props.variant !== 'input' || !removable.value || !['Delete', 'Backspace'].includes(event.key))
    return
  if (nativeDisabled(event.currentTarget as HTMLButtonElement)) return
  requestRemove(event)
  event.preventDefault()
}

function actions(): ChipAction[] {
  const result: ChipAction[] = []
  if (primary.value) result.push({ part: 'primary', element: primary.value })
  if (removeButton.value) result.push({ part: 'remove', element: removeButton.value })
  return result
}

const unregister = context?.register({
  id: chipId,
  root: () => root.value,
  actions,
  disabled: () => disabled.value,
  selected: () => selected.value,
})

function refresh() {
  renderedLabel.value = labelElement.value?.textContent?.trim() ?? ''
  context?.syncTabIndices()
}

onMounted(refresh)
onUpdated(refresh)
onDeactivated(() => {
  ripple.value = null
  removalRipple.ripple.value = null
})
onBeforeUnmount(() => unregister?.())

if (import.meta.env.DEV) {
  watch(
    () => props.color,
    (color) => {
      if (color !== undefined && !colors.value) {
        console.warn('[MDV] MdvChip: unsupported color. Use a theme color or a #RGB/#RRGGBB seed.')
      }
    },
    { immediate: true },
  )
  watch(
    [managed, () => props.value],
    ([isManaged, value]) => {
      if (isManaged && value === undefined)
        console.warn('[MDV] MdvChip: selectable filters in a selection ChipSet require a value.')
    },
    { immediate: true },
  )
  watch(
    [isLink, () => props.href],
    ([link, href]) => {
      if (!link && href !== undefined)
        console.warn('[MDV] MdvChip: href is available only for assist and suggestion chips.')
    },
    { immediate: true },
  )
}

defineExpose({
  focus: (options?: FocusOptions) => primary.value?.focus(options),
  blur: () => {
    const element = root.value?.ownerDocument.activeElement
    if (element instanceof HTMLElement && root.value?.contains(element)) element.blur()
  },
})
</script>

<template>
  <span
    ref="root"
    :style="colors"
    v-bind="outerAttrs()"
    :class="[
      'mdv-chip',
      `mdv-chip--${props.variant}`,
      {
        'mdv-chip--selected': selected,
        'mdv-chip--elevated': elevated,
        'mdv-chip--disabled': disabled,
        'mdv-chip--colored': !!colors,
        'mdv-chip--avatar': hasAvatar,
        'mdv-chip--has-leading': hasLeading || showCheck,
        'mdv-chip--has-trailing': decorativeTrailing || removable,
        'mdv-chip--two-actions': removable && !removeOnly,
      },
    ]"
  >
    <span ref="surface" class="mdv-chip__surface" aria-hidden="true">
      <span
        v-if="ripple"
        :key="ripple.key"
        class="mdv-chip__ripple"
        :class="{ 'mdv-chip__ripple--released': ripple.released }"
        @animationend="finishRipple"
      >
        <span
          class="mdv-chip__ripple-wave"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }"
        />
      </span>
    </span>
    <component
      :is="isLink ? 'a' : 'button'"
      ref="primary"
      v-bind="primaryAttrs()"
      class="mdv-chip__primary"
      :type="isLink ? undefined : 'button'"
      :href="isLink && !disabled ? props.href : undefined"
      :disabled="!isLink && disabled ? true : undefined"
      @click.capture="preventDisabledActivation"
      @auxclick.capture="preventDisabledActivation"
      @dblclick.capture="preventDisabledActivation"
      @keydown.capture="preventDisabledActivation"
      @keyup.capture="preventDisabledActivation"
      @click="activate"
      @keydown="handleKeydown"
      @keydown.space="showRipple"
      @keydown.enter="showRipple"
      @keyup="releaseRipple"
      @pointerdown="showRipple"
      @pointerup="releaseRipple"
      @pointerleave="releaseRipple"
      @pointercancel="releaseRipple"
      @blur="releaseRipple"
    >
      <span v-if="hasAvatar" class="mdv-chip__avatar" aria-hidden="true" inert>
        <slot name="avatar" :selected="selected" />
      </span>
      <span v-else class="mdv-chip__leading-track" aria-hidden="true" inert>
        <span class="mdv-chip__leading-clip">
          <span class="mdv-chip__leading-content">
            <span
              v-if="$slots.leading"
              class="mdv-chip__icon mdv-chip__leading-icon"
              :class="{ 'mdv-chip__leading-icon--hidden': showCheck }"
            >
              <slot name="leading" :selected="selected" />
            </span>
            <span
              v-if="props.variant === 'filter'"
              class="mdv-chip__icon mdv-chip__check"
              :class="{ 'mdv-chip__check--visible': showCheck }"
            >
              <MdvIcon :icon="check" />
            </span>
          </span>
        </span>
      </span>
      <span ref="labelElement" class="mdv-chip__label"
        ><slot :selected="selected">{{ props.label }}</slot></span
      >
      <span
        v-if="decorativeTrailing || removeOnly"
        class="mdv-chip__icon mdv-chip__trailing"
        aria-hidden="true"
        inert
      >
        <slot name="trailing" :selected="selected"><MdvIcon :icon="close" /></slot>
      </span>
    </component>
    <button
      v-if="removable && !removeOnly"
      :id="`${controlId}-remove`"
      ref="removeButton"
      type="button"
      class="mdv-chip__remove"
      :aria-label="removeName"
      :disabled="disabled"
      :tabindex="disabled ? -1 : context ? context.tabIndex(chipId, 'remove') : undefined"
      @click="requestRemove"
      @keydown="handleKeydown"
      @pointerdown="removalRipple.showRipple"
      @pointerup="removalRipple.releaseRipple"
      @pointerleave="removalRipple.releaseRipple"
      @pointercancel="removalRipple.releaseRipple"
      @keydown.space="removalRipple.showRipple"
      @keydown.enter="removalRipple.showRipple"
      @keyup="removalRipple.releaseRipple"
      @blur="removalRipple.releaseRipple"
    >
      <span ref="removeSurface" class="mdv-chip__remove-surface" aria-hidden="true">
        <span
          v-if="removalRipple.ripple.value"
          :key="removalRipple.ripple.value.key"
          class="mdv-chip__ripple"
          :class="{ 'mdv-chip__ripple--released': removalRipple.ripple.value.released }"
          @animationend="removalRipple.finishRipple"
        >
          <span
            class="mdv-chip__ripple-wave"
            :style="{
              left: `${removalRipple.ripple.value.x}px`,
              top: `${removalRipple.ripple.value.y}px`,
              width: `${removalRipple.ripple.value.size}px`,
              height: `${removalRipple.ripple.value.size}px`,
            }"
          />
        </span>
      </span>
      <span class="mdv-chip__icon" aria-hidden="true" inert>
        <slot name="trailing" :selected="selected"><MdvIcon :icon="close" /></slot>
      </span>
    </button>
  </span>
</template>
