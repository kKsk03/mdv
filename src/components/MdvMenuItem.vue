<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { VNode } from 'vue'
import check from '@iconify-icons/material-symbols/check'
import chevronRight from '@iconify-icons/material-symbols/chevron-right'
import MdvIcon from './MdvIcon.vue'
import MdvMenuPanel from './_MdvMenuPanel.vue'
import { menuGroupKey, menuPanelKey, menuTreeKey } from './menu-context'
import { useButtonRipple } from './button-ripple'
import type { MdvIconData } from './icon.types'
import type { MdvMenuItemSlotProps, MdvMenuSelectEvent, MdvMenuValue } from './menu.types'

defineOptions({ name: 'MdvMenuItem', inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    label?: string
    supportingText?: string
    trailingText?: string
    value?: MdvMenuValue
    icon?: MdvIconData
    trailingIcon?: MdvIconData
    disabled?: boolean
    href?: string
    keepOpen?: boolean
  }>(),
  { label: '', supportingText: '', trailingText: '', disabled: false, keepOpen: undefined },
)
const emit = defineEmits<{ select: [event: MdvMenuSelectEvent] }>()
const slots = defineSlots<{
  default?(props: MdvMenuItemSlotProps): VNode[]
  supporting?(props: MdvMenuItemSlotProps): VNode[]
  leading?(props: MdvMenuItemSlotProps): VNode[]
  trailing?(props: MdvMenuItemSlotProps): VNode[]
  children?(): VNode[]
}>()
const attrs = useAttrs()
const tree = inject(menuTreeKey)!
const panel = inject(menuPanelKey)!
const group = inject(menuGroupKey, null)
const control = useTemplateRef<HTMLElement>('control')
const submenu = useTemplateRef<InstanceType<typeof MdvMenuPanel>>('submenu')
const expanded = ref(false)
const generatedId = 'mdv-menu-item-' + useId()
const id = typeof attrs.id === 'string' ? attrs.id : generatedId
const hasChildren = computed(() => !!slots.children)
const isLink = computed(() => props.href !== undefined && !hasChildren.value)
const selectable = computed(
  () =>
    !!group &&
    group.selectionMode.value !== 'none' &&
    props.value !== undefined &&
    !hasChildren.value &&
    !isLink.value,
)
const selected = computed(() => selectable.value && group?.selected(props.value) === true)
const role = computed(() =>
  selectable.value
    ? group?.selectionMode.value === 'multiple'
      ? 'menuitemcheckbox'
      : 'menuitemradio'
    : 'menuitem',
)
function slotState(): MdvMenuItemSlotProps {
  return { selected: selected.value, disabled: isDisabled(), expanded: expanded.value }
}
let unregister: (() => void) | undefined
let hovered = false
const activationListener =
  /^on(?:click|auxclick|dblclick|keydown|keyup|keypress)(?:once|capture|passive)*$/i

function isDisabled() {
  return (
    props.disabled ||
    attrs['aria-disabled'] === true ||
    attrs['aria-disabled'] === 'true' ||
    control.value?.matches(':disabled') === true
  )
}

function controlAttrs() {
  const result = { ...attrs }
  if (isDisabled()) {
    for (const key of Object.keys(result)) if (activationListener.test(key)) delete result[key]
  }
  return result
}

function itemLabel() {
  return (
    props.label ||
    control.value?.querySelector('.mdv-menu-item__label')?.textContent?.trim() ||
    String(attrs['aria-label'] ?? '')
  )
}

function supportingIds() {
  return (
    [
      typeof attrs['aria-describedby'] === 'string' ? attrs['aria-describedby'] : '',
      props.supportingText || slots.supporting ? id + '-supporting' : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

function openSubmenu() {
  if (isDisabled() || !hasChildren.value) return
  panel.cancelSchedule()
  if (expanded.value) {
    submenu.value?.panel.focus()
  } else {
    panel.closeChildren()
    expanded.value = true
  }
}

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: isDisabled,
  isLink: () => isLink.value,
  surface: () => control.value,
})

function blockDisabled(event: Event) {
  if (!isDisabled()) return
  if (event.type.startsWith('key') && !['Enter', ' '].includes((event as KeyboardEvent).key)) return
  event.preventDefault()
  event.stopImmediatePropagation()
}

function activate(event: MouseEvent) {
  if (isDisabled() || event.defaultPrevented || event.button !== 0) return
  if (hasChildren.value) {
    event.preventDefault()
    if (expanded.value) expanded.value = false
    else openSubmenu()
    return
  }
  const nextSelected =
    selectable.value && (group?.selectionMode.value === 'multiple' ? !selected.value : true)
  const CustomEventType = control.value?.ownerDocument.defaultView?.CustomEvent ?? CustomEvent
  const selection: MdvMenuSelectEvent = new CustomEventType('select', {
    cancelable: true,
    detail: { value: props.value, selected: nextSelected, originalEvent: event },
  })
  const before = control.value?.ownerDocument.activeElement
  emit('select', selection)
  if (selection.defaultPrevented || event.defaultPrevented) {
    event.preventDefault()
    return
  }
  if (selectable.value && props.value !== undefined) group?.select(props.value)
  if (!(props.keepOpen ?? (selectable.value && group?.selectionMode.value === 'multiple'))) {
    // select 处理器可能打开另一个 Dialog 或主动移动焦点，交给新的目标管理焦点。
    const activeElement = control.value?.ownerDocument.activeElement
    tree.close('select', activeElement === before)
  }
}

function pointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  hovered = true
  tree.keyboard.value = false
  panel.cancelSchedule()
  const enter = () => {
    if (!hovered) return
    const branch = panel.child.value
    if (branch && branch !== submenu.value?.panel && branch.protectsPointer(event)) {
      panel.schedule(enter)
      return
    }
    submenu.value?.panel.cancelSchedule()
    panel.activate()
    control.value?.focus({ preventScroll: true })
    if (hasChildren.value && !isDisabled() && tree.submenuMode.value === 'flyout')
      panel.schedule(openSubmenu)
    else panel.closeChildren()
  }
  enter()
}

function pointerLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  hovered = false
  panel.cancelSchedule()
  const target = event.relatedTarget as Node | null
  if (target && submenu.value?.panel.element.value?.contains(target)) return
  submenu.value?.panel.deferClose(event)
}

function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented) return
  showRipple(event)
  if (event.key === ' ' && isLink.value && !isDisabled()) {
    event.preventDefault()
    if (!event.repeat) control.value?.click()
  }
}

onMounted(() => {
  unregister = panel.register({
    element: () => control.value,
    text: itemLabel,
    disabled: isDisabled,
    open: openSubmenu,
    hasChildren: () => hasChildren.value,
  })
})
onBeforeUnmount(() => unregister?.())
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) expanded.value = false
  },
)
watch(
  () => panel.visible.value,
  (visible) => {
    if (!visible) expanded.value = false
  },
)
defineExpose({ focus: () => control.value?.focus(), blur: () => control.value?.blur() })
</script>

<template>
  <div class="mdv-menu-item" role="none" @pointerenter="pointerEnter" @pointerleave="pointerLeave">
    <component
      :is="isLink ? 'a' : 'button'"
      :id="id"
      ref="control"
      v-bind="controlAttrs()"
      :type="isLink ? undefined : 'button'"
      :href="isLink && !isDisabled() ? props.href : undefined"
      :role="role"
      tabindex="-1"
      data-mdv-menu-item
      :aria-disabled="isDisabled() || undefined"
      :aria-checked="selectable ? selected : undefined"
      :aria-describedby="supportingIds()"
      :aria-haspopup="hasChildren ? 'menu' : undefined"
      :aria-expanded="hasChildren ? expanded : undefined"
      :aria-controls="hasChildren ? id + '-submenu' : undefined"
      :class="[
        'mdv-menu-item__control',
        {
          'mdv-menu-item__control--selected': selected,
          'mdv-menu-item__control--choice': selectable,
          'mdv-menu-item__control--active': expanded,
        },
      ]"
      @click.capture="blockDisabled"
      @auxclick.capture="blockDisabled"
      @dblclick.capture="blockDisabled"
      @keydown.capture="blockDisabled"
      @keyup.capture="blockDisabled"
      @click="activate"
      @pointerdown="showRipple"
      @pointerup="releaseRipple"
      @pointercancel="releaseRipple"
      @pointerleave="releaseRipple"
      @keydown="keydown"
      @keyup="releaseRipple"
      @blur="releaseRipple"
    >
      <span class="mdv-menu-item__surface" aria-hidden="true">
        <span
          v-if="ripple"
          :key="ripple.key"
          class="mdv-menu-item__ripple"
          :class="{ 'mdv-menu-item__ripple--released': ripple.released }"
          @animationend="finishRipple"
        >
          <span
            class="mdv-menu-item__ripple-wave"
            :style="{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: `${ripple.size}px`,
              height: `${ripple.size}px`,
            }"
          />
        </span>
      </span>
      <span v-if="slots.leading || props.icon" class="mdv-menu-item__icon" aria-hidden="true">
        <MdvIcon v-if="selected" :icon="check" />
        <slot v-else name="leading" v-bind="slotState()"
          ><MdvIcon v-if="props.icon" :icon="props.icon"
        /></slot>
      </span>
      <span
        v-else-if="selectable"
        class="mdv-menu-item__check"
        :class="{ 'mdv-menu-item__check--selected': selected }"
        aria-hidden="true"
        ><MdvIcon :icon="check"
      /></span>
      <span class="mdv-menu-item__text">
        <span class="mdv-menu-item__label"
          ><slot v-bind="slotState()">{{ props.label }}</slot></span
        >
        <span
          v-if="slots.supporting || props.supportingText"
          :id="id + '-supporting'"
          class="mdv-menu-item__supporting"
          ><slot name="supporting" v-bind="slotState()">{{ props.supportingText }}</slot></span
        >
      </span>
      <span v-if="hasChildren" class="mdv-menu-item__icon mdv-menu-item__chevron" aria-hidden="true"
        ><MdvIcon :icon="chevronRight"
      /></span>
      <span
        v-else-if="slots.trailing || props.trailingIcon || props.trailingText"
        class="mdv-menu-item__trailing"
        aria-hidden="true"
      >
        <slot name="trailing" v-bind="slotState()">
          <span v-if="props.trailingText">{{ props.trailingText }}</span>
          <MdvIcon
            v-if="props.trailingIcon"
            :icon="props.trailingIcon"
            class="mdv-menu-item__trailing-icon"
          />
        </slot>
      </span>
    </component>
    <MdvMenuPanel
      v-if="hasChildren"
      :id="id + '-submenu'"
      ref="submenu"
      :open="expanded && panel.visible.value"
      :anchor="control"
      :trigger="control"
      :labelledby="id"
      :title="itemLabel()"
      @request-close="expanded = false"
    >
      <slot name="children" />
    </MdvMenuPanel>
  </div>
</template>
