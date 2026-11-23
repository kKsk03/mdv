<script setup lang="ts">
import {
  computed,
  mergeProps,
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
import type { ObjectDirective, StyleValue, VNode } from 'vue'
import check from '@iconify-icons/material-symbols/check'
import MdvIcon from './MdvIcon.vue'
import { resolveSwitchColor } from './button-color'
import type { MdvSwitchColor, MdvSwitchLabelPosition } from './switch.types'

defineOptions({ name: 'MdvSwitch', inheritAttrs: false })

defineSlots<{
  default?(): VNode[]
  'selected-icon'?(): VNode[]
  'unselected-icon'?(): VNode[]
}>()

const model = defineModel<boolean>({ default: false })
const props = withDefaults(
  defineProps<{
    label?: string
    supportingText?: string
    error?: boolean
    errorText?: string
    disabled?: boolean
    required?: boolean
    color?: MdvSwitchColor
    labelPosition?: MdvSwitchLabelPosition
    value?: string
  }>(),
  {
    label: '',
    supportingText: '',
    error: false,
    errorText: '',
    disabled: false,
    required: false,
    color: 'primary',
    labelPosition: 'end',
    value: 'on',
  },
)

const attrs = useAttrs()
const control = useTemplateRef<HTMLInputElement>('control')
const generatedId = `mdv-switch-${useId()}`
const descriptionId = `${generatedId}-description`
const colors = computed(() => resolveSwitchColor(props.color))
const checked = computed(() => model.value)
const validationReported = ref(false)
const nativeInvalid = ref(false)
const nativeErrorText = ref('')
const hasError = computed(() => props.error || nativeInvalid.value)
const supportingMessage = computed(() =>
  hasError.value
    ? props.errorText || nativeErrorText.value || props.supportingText
    : props.supportingText,
)
const initialModel = model.value
const initialChecked = initialModel
let resetForm: HTMLFormElement | null = null
let disposed = false
let preHydrationChecked: boolean | undefined
let pendingModel: boolean | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

function isDisabled() {
  return props.disabled || !!control.value?.matches(':disabled')
}

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

function controlId() {
  return typeof attrs.id === 'string' && attrs.id.length > 0 ? attrs.id : generatedId
}

function rootAttrs() {
  return {
    class: attrs.class,
    style: [colors.value, attrs.style as StyleValue],
    dir: typeof attrs.dir === 'string' ? attrs.dir : undefined,
    lang: typeof attrs.lang === 'string' ? attrs.lang : undefined,
  }
}

function controlAttrs() {
  const result = { ...attrs }
  for (const key of [
    'class',
    'style',
    'type',
    'role',
    'value',
    'checked',
    'defaultChecked',
    'defaultchecked',
    'dir',
    'lang',
  ]) {
    delete result[key]
  }
  result.id = controlId()
  result.role = 'switch'
  result['aria-checked'] = String(checked.value)
  result['aria-invalid'] = hasError.value ? 'true' : attrs['aria-invalid']
  result['aria-describedby'] = joinIds(
    attrs['aria-describedby'],
    supportingMessage.value ? descriptionId : undefined,
  )
  result['aria-errormessage'] = joinIds(
    attrs['aria-errormessage'],
    hasError.value && supportingMessage.value ? descriptionId : undefined,
  )
  return mergeProps(
    {
      onClick: handleClick,
      onInput: handleInput,
      onChange: handleChange,
      onInvalid: handleInvalid,
    },
    result,
  )
}

function syncControl() {
  if (control.value) control.value.checked = checked.value
}

function scheduleSync() {
  if (syncTimer !== undefined) return
  // input/change 之间可能发生 Vue 微任务；等待整次原生激活结束后再恢复受控状态。
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    void nextTick(() => {
      pendingModel = undefined
      if (disposed) return
      syncControl()
      refreshValidation()
    })
  }, 0)
}

function commitChecked(nextChecked: boolean) {
  const current = pendingModel ?? model.value
  if (current !== nextChecked) {
    pendingModel = nextChecked
    model.value = nextChecked
  }
  scheduleSync()
}

function handleClick(event: MouseEvent) {
  if (isDisabled()) {
    event.preventDefault()
    return
  }
  // 模型只在原生 input/change 后提交；click.prevent 不会产生更新。
  scheduleSync()
}

function handleInput(event: Event) {
  if (isDisabled()) return
  commitChecked((event.target as HTMLInputElement).checked)
  refreshValidation()
}

function handleChange(event: Event) {
  if (isDisabled()) return
  // 支持只派发 change 的原生集成，同时不重复提交一次激活的 input/change。
  commitChecked((event.target as HTMLInputElement).checked)
  refreshValidation()
}

function refreshValidation() {
  const element = control.value
  nativeInvalid.value = !!(
    validationReported.value &&
    element?.willValidate &&
    !element.validity.valid
  )
  nativeErrorText.value = nativeInvalid.value ? (element?.validationMessage ?? '') : ''
}

function handleInvalid() {
  validationReported.value = true
  refreshValidation()
}

function resetFromForm(event: Event) {
  const element = control.value
  const form = event.currentTarget
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented || control.value !== element || element?.form !== form)
      return
    pendingModel = undefined
    model.value = initialModel
    validationReported.value = false
    nativeInvalid.value = false
    nativeErrorText.value = ''
    scheduleSync()
  })
}

function syncForm() {
  const nextForm = control.value?.form ?? null
  if (nextForm === resetForm) return
  resetForm?.removeEventListener('reset', resetFromForm)
  resetForm = nextForm
  resetForm?.addEventListener('reset', resetFromForm)
}

// Vue 写入 checked 之前保存 hydration 前的用户选择。
const vNativeState: ObjectDirective<HTMLInputElement> = {
  created(element) {
    if (element.defaultChecked === initialChecked && element.checked !== initialChecked) {
      preHydrationChecked = element.checked
    }
  },
}

if (import.meta.env.DEV) {
  watch(
    () => props.color,
    (color) => {
      if (!colors.value) {
        console.warn(
          `[MDV] MdvSwitch: unsupported color "${color}". Use a theme color or a #RGB/#RRGGBB seed.`,
        )
      }
    },
    { immediate: true },
  )
}

onMounted(() => {
  if (control.value) {
    control.value.defaultChecked = initialChecked
    if (preHydrationChecked !== undefined) {
      const liveChecked = preHydrationChecked
      preHydrationChecked = undefined
      control.value.checked = liveChecked
      commitChecked(liveChecked)
    } else {
      syncControl()
    }
  }
  syncForm()
})

onUpdated(() => {
  if (control.value) {
    if (control.value.defaultChecked !== initialChecked)
      control.value.defaultChecked = initialChecked
  }
  syncForm()
  refreshValidation()
})

onDeactivated(() => {
  if (control.value) control.value.checked = checked.value
})

onBeforeUnmount(() => {
  disposed = true
  clearTimeout(syncTimer)
  resetForm?.removeEventListener('reset', resetFromForm)
})

defineExpose({
  focus: (options?: FocusOptions) => control.value?.focus(options),
  blur: () => control.value?.blur(),
  checkValidity: () => control.value?.checkValidity() ?? true,
  reportValidity: () => control.value?.reportValidity() ?? true,
  setCustomValidity: (message: string) => {
    control.value?.setCustomValidity(message)
    refreshValidation()
  },
})
</script>

<template>
  <div
    v-bind="rootAttrs()"
    class="mdv-switch"
    :class="{
      'mdv-switch--selected': checked,
      'mdv-switch--error': hasError,
      'mdv-switch--label-start': props.labelPosition === 'start',
    }"
  >
    <label
      class="mdv-switch__row"
      :for="controlId()"
      :class="{ 'mdv-switch__row--disabled': isDisabled() }"
    >
      <span class="mdv-switch__control">
        <input
          ref="control"
          v-native-state
          v-bind="controlAttrs()"
          class="mdv-switch__input"
          type="checkbox"
          role="switch"
          :value="props.value"
          :checked="checked"
          :disabled="props.disabled"
          :required="props.required"
        />
        <span class="mdv-switch__state" aria-hidden="true">
          <span class="mdv-switch__track" />
          <span class="mdv-switch__handle">
            <span class="mdv-switch__state-layer" />
            <span class="mdv-switch__thumb">
              <span v-if="checked" class="mdv-switch__icon">
                <slot v-if="$slots['selected-icon']" name="selected-icon" />
                <MdvIcon v-else :icon="check" size="16" />
              </span>
              <span v-else-if="!checked && $slots['unselected-icon']" class="mdv-switch__icon">
                <slot name="unselected-icon" />
              </span>
            </span>
          </span>
        </span>
      </span>
      <span v-if="props.label || $slots.default" class="mdv-switch__label">
        <slot>{{ props.label }}</slot>
      </span>
    </label>
    <div v-if="supportingMessage" class="mdv-switch__supporting" aria-live="polite">
      <span :id="descriptionId">{{ supportingMessage }}</span>
    </div>
  </div>
</template>
