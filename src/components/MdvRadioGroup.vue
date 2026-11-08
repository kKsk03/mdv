<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  ref,
  shallowRef,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { StyleValue, VNode } from 'vue'
import { mdvRadioGroupKey } from './radio-context'
import type { MdvRadioGroupContext, MdvRadioRegistration } from './radio-context'
import type {
  MdvRadioColor,
  MdvRadioModelValue,
  MdvRadioOrientation,
  MdvRadioValue,
} from './radio.types'

defineOptions({ name: 'MdvRadioGroup', inheritAttrs: false })

defineSlots<{
  default?(): VNode[]
  label?(): VNode[]
}>()

const model = defineModel<MdvRadioModelValue>({ default: null })
const props = withDefaults(
  defineProps<{
    name?: string
    label?: string
    supportingText?: string
    error?: boolean
    errorText?: string
    disabled?: boolean
    required?: boolean
    color?: MdvRadioColor
    orientation?: MdvRadioOrientation
  }>(),
  {
    label: '',
    supportingText: '',
    error: false,
    errorText: '',
    disabled: false,
    required: false,
    orientation: 'vertical',
  },
)

const attrs = useAttrs()
const fieldset = useTemplateRef<HTMLFieldSetElement>('fieldset')
const generatedId = `mdv-radio-group-${useId()}`
const groupId = computed(() =>
  typeof attrs.id === 'string' && attrs.id.length > 0 ? attrs.id : generatedId,
)
const descriptionId = computed(() => `${groupId.value}-description`)
const groupName = computed(() => props.name)
const groupForm = computed(() => (typeof attrs.form === 'string' ? attrs.form : undefined))
const groupDisabled = computed(() => props.disabled || !!fieldset.value?.matches(':disabled'))
const groupColor = computed(() => props.color)
const registrations = shallowRef<MdvRadioRegistration[]>([])
const enabledRegistrations = computed(() =>
  registrations.value.filter((radio) => !radio.disabled.value),
)
const selectedRegistration = computed(
  () =>
    enabledRegistrations.value.find((radio) => Object.is(radio.value.value, model.value)) ?? null,
)
const firstEnabledRegistration = computed(() => enabledRegistrations.value[0] ?? null)
const hasEnabledSelection = computed(() => selectedRegistration.value !== null)
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
const customValidityMessage = ref('')
const hasCustomValidity = ref(false)
let resetForm: HTMLFormElement | null = null
let disposed = false
let pendingValue: MdvRadioValue | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

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
  const result = { ...attrs }
  delete result.class
  delete result.style
  result['aria-describedby'] = joinIds(
    attrs['aria-describedby'],
    supportingMessage.value ? descriptionId.value : undefined,
  )
  result['aria-errormessage'] = joinIds(
    attrs['aria-errormessage'],
    hasError.value && supportingMessage.value ? descriptionId.value : undefined,
  )
  result['aria-invalid'] = hasError.value ? 'true' : attrs['aria-invalid']
  return result
}

function groupStyle() {
  return attrs.style as StyleValue
}

function isSelected(radio: MdvRadioRegistration) {
  return Object.is(radio.value.value, model.value)
}

function syncControls() {
  for (const radio of registrations.value) {
    const input = radio.input.value
    if (!input) continue
    input.checked = isSelected(radio)
    input.tabIndex = tabIndex(radio.id, radio.disabled.value)
    input.required = isRequired(radio.id, radio.disabled.value)
  }
}

function syncCustomValidity() {
  if (!hasCustomValidity.value) return
  const first = firstEnabledRegistration.value?.input.value
  for (const radio of registrations.value) {
    radio.input.value?.setCustomValidity(
      radio.input.value === first ? customValidityMessage.value : '',
    )
  }
}

function refreshValidation() {
  if (!validationReported.value) return
  const invalid = registrations.value
    .map((radio) => radio.input.value)
    .find((input): input is HTMLInputElement => !!input && !input.validity.valid)
  nativeInvalid.value = !!invalid
  nativeErrorText.value = invalid?.validationMessage ?? ''
}

function scheduleSync() {
  if (syncTimer !== undefined) return
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    void nextTick(() => {
      pendingValue = undefined
      if (disposed) return
      syncControls()
      syncCustomValidity()
      refreshValidation()
    })
  }, 0)
}

function register(radio: MdvRadioRegistration) {
  registrations.value = [...registrations.value.filter((current) => current.id !== radio.id), radio]
  syncCustomValidity()
  syncControls()
  syncForm()
  return () => {
    registrations.value = registrations.value.filter((current) => current !== radio)
    syncForm()
  }
}

function tabIndex(id: string, disabled: boolean) {
  if (disabled) return -1
  const target = selectedRegistration.value ?? firstEnabledRegistration.value
  return target?.id === id ? 0 : -1
}

function isRequired(id: string, disabled: boolean) {
  if (!props.required || disabled || hasEnabledSelection.value) return false
  return firstEnabledRegistration.value?.id === id
}

function select(value: MdvRadioValue) {
  if (groupDisabled.value) return
  const current = pendingValue ?? model.value
  if (!Object.is(current, value)) {
    pendingValue = value
    model.value = value
  }
  scheduleSync()
}

function handleKeydown(id: string, event: KeyboardEvent) {
  if (event.defaultPrevented || groupDisabled.value) return
  const key = event.key
  const currentIndex = enabledRegistrations.value.findIndex((radio) => radio.id === id)
  if (currentIndex < 0) return

  let nextIndex = -1
  if (key === 'ArrowDown' || key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % enabledRegistrations.value.length
  } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
    nextIndex =
      (currentIndex - 1 + enabledRegistrations.value.length) % enabledRegistrations.value.length
  } else if (key === 'Home') {
    nextIndex = 0
  } else if (key === 'End') {
    nextIndex = enabledRegistrations.value.length - 1
  }

  if (nextIndex < 0) return
  const next = enabledRegistrations.value[nextIndex]
  if (!next) return
  event.preventDefault()
  select(next.value.value)
  void nextTick(() => next.input.value?.focus())
}

function reportInvalid(element: HTMLInputElement) {
  validationReported.value = true
  nativeInvalid.value = true
  nativeErrorText.value = element.validationMessage
}

function checkValidity() {
  const inputs = registrations.value
    .map((radio) => radio.input.value)
    .filter((input): input is HTMLInputElement => !!input)
  const valid = inputs.every((input) => input.checkValidity())
  refreshValidation()
  return valid
}

function reportValidity() {
  validationReported.value = true
  const inputs = registrations.value
    .map((radio) => radio.input.value)
    .filter((input): input is HTMLInputElement => !!input)
  const valid = inputs.every((input) => input.reportValidity())
  refreshValidation()
  return valid
}

function setCustomValidity(message: string) {
  hasCustomValidity.value = true
  customValidityMessage.value = message
  syncCustomValidity()
  refreshValidation()
}

function resetFromForm(event: Event) {
  const form = event.currentTarget as HTMLFormElement
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented || resetForm !== form) return
    pendingValue = undefined
    model.value = initialModel
    validationReported.value = false
    nativeInvalid.value = false
    nativeErrorText.value = ''
    scheduleSync()
  })
}

function syncForm() {
  const nextForm = registrations.value.find((radio) => radio.input.value)?.input.value?.form ?? null
  if (nextForm === resetForm) return
  resetForm?.removeEventListener('reset', resetFromForm)
  resetForm = nextForm
  resetForm?.addEventListener('reset', resetFromForm)
}

const context: MdvRadioGroupContext = {
  groupId: groupId.value,
  model,
  name: groupName,
  form: groupForm,
  disabled: groupDisabled,
  required: computed(() => props.required),
  color: groupColor,
  hasError,
  descriptionId: computed(() => (supportingMessage.value ? descriptionId.value : undefined)),
  orientation: computed(() => props.orientation),
  initialModel,
  register,
  tabIndex,
  isRequired,
  select,
  handleKeydown,
  scheduleSync,
  reportInvalid,
  checkValidity,
  reportValidity,
  setCustomValidity,
  isInitiallyChecked: (value) => Object.is(initialModel, value),
}

provide(mdvRadioGroupKey, context)

watch([model, registrations], () => {
  syncControls()
  syncForm()
  syncCustomValidity()
  refreshValidation()
})

onMounted(() => {
  syncControls()
  syncForm()
  syncCustomValidity()
})

onUpdated(() => {
  syncForm()
  syncCustomValidity()
  refreshValidation()
})

onBeforeUnmount(() => {
  disposed = true
  pendingValue = undefined
  clearTimeout(syncTimer)
  resetForm?.removeEventListener('reset', resetFromForm)
})

defineExpose({
  focus: (options?: FocusOptions) =>
    (selectedRegistration.value ?? firstEnabledRegistration.value)?.input.value?.focus(options),
  blur: () => document.activeElement instanceof HTMLElement && document.activeElement.blur(),
  checkValidity,
  reportValidity,
  setCustomValidity,
})
</script>

<template>
  <fieldset
    ref="fieldset"
    v-bind="rootAttrs()"
    :style="groupStyle()"
    :class="[
      'mdv-radio-group',
      `mdv-radio-group--${props.orientation}`,
      { 'mdv-radio-group--error': hasError },
    ]"
    :disabled="props.disabled"
    role="radiogroup"
  >
    <legend v-if="props.label || $slots.label" class="mdv-radio-group__label">
      <slot name="label">{{ props.label }}</slot>
    </legend>
    <div class="mdv-radio-group__options">
      <slot />
    </div>
    <div class="mdv-radio-group__supporting" aria-live="polite">
      <span v-if="supportingMessage" :id="descriptionId">{{ supportingMessage }}</span>
    </div>
  </fieldset>
</template>
