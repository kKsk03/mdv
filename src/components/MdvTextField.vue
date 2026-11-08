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
import close from '@iconify-icons/material-symbols/close'
import visibility from '@iconify-icons/material-symbols/visibility'
import visibilityOff from '@iconify-icons/material-symbols/visibility-off'
import MdvIcon from './MdvIcon.vue'
import MdvIconButton from './MdvIconButton.vue'
import type {
  MdvTextFieldModelModifiers,
  MdvTextFieldType,
  MdvTextFieldValue,
  MdvTextFieldVariant,
} from './text-field.types'

defineOptions({ name: 'MdvTextField', inheritAttrs: false })

defineSlots<{
  leading?(): VNode[]
  trailing?(): VNode[]
}>()

const props = withDefaults(
  defineProps<{
    modelValue?: MdvTextFieldValue
    modelModifiers?: MdvTextFieldModelModifiers
    variant?: MdvTextFieldVariant
    type?: MdvTextFieldType
    label?: string
    placeholder?: string
    supportingText?: string
    error?: boolean
    errorText?: string
    prefixText?: string
    suffixText?: string
    multiline?: boolean
    rows?: number
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    clearable?: boolean
    passwordToggle?: boolean
    /** 省略时，有合法 maxlength 才显示计数；true 也可单独显示当前字数。 */
    showCount?: boolean
    fullWidth?: boolean
  }>(),
  {
    modelValue: '',
    modelModifiers: () => ({}),
    variant: 'outlined',
    type: 'text',
    label: '',
    placeholder: '',
    supportingText: '',
    error: false,
    errorText: '',
    prefixText: '',
    suffixText: '',
    multiline: false,
    rows: 3,
    disabled: false,
    readonly: false,
    required: false,
    clearable: false,
    passwordToggle: false,
    showCount: undefined,
    fullWidth: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: MdvTextFieldValue] }>()
const attrs = useAttrs()
const generatedId = `mdv-text-field-${useId()}`
const descriptionId = `${generatedId}-description`
const counterId = `${generatedId}-counter`
const control = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('control')
const initialValue = props.modelValue
const draft = ref(String(props.modelValue))
const focused = ref(false)
const composing = ref(false)
const autofilled = ref(false)
const passwordVisible = ref(false)
const validationReported = ref(false)
const nativeInvalid = ref(false)
const nativeErrorText = ref('')
let lastCommitted: MdvTextFieldValue = props.modelValue
let resetForm: HTMLFormElement | null = null
let disposed = false
let mounted = false
let preHydrationValue: string | undefined

// Vue 在 hydration 时强制写入 input.value；created 钩子在这之前保存用户已输入的值。
const vPreserveValue: ObjectDirective<HTMLInputElement | HTMLTextAreaElement> = {
  created(element) {
    if (
      !mounted &&
      element.defaultValue === String(initialValue) &&
      element.value !== draft.value
    ) {
      preHydrationValue = element.value
    }
  },
}

const floating = computed(() => focused.value || draft.value.length > 0 || autofilled.value)
const hasError = computed(() => props.error || nativeInvalid.value)
const supportingMessage = computed(() =>
  hasError.value
    ? props.errorText || nativeErrorText.value || props.supportingText
    : props.supportingText,
)
const canTogglePassword = computed(
  () => props.passwordToggle && props.type === 'password' && !props.multiline,
)
const nativeType = computed(() =>
  canTogglePassword.value && passwordVisible.value ? 'text' : props.type,
)
const showClear = computed(
  () =>
    props.clearable &&
    draft.value.length > 0 &&
    !props.disabled &&
    !props.readonly &&
    !composing.value,
)

function normalizeValue(value: string): MdvTextFieldValue {
  const text = props.modelModifiers.trim ? value.trim() : value
  if (props.modelModifiers.number) {
    const number = Number.parseFloat(text)
    if (!Number.isNaN(number)) return number
  }
  return text
}

function commitValue(value: string) {
  const nextValue = normalizeValue(value)
  if (Object.is(nextValue, lastCommitted)) return
  lastCommitted = nextValue
  emit('update:modelValue', nextValue)
}

watch(
  () => props.modelValue,
  (value) => {
    lastCommitted = value
    if (String(value).length === 0) autofilled.value = false
    if (!composing.value && !Object.is(normalizeValue(draft.value), value)) {
      draft.value = String(value)
    }
  },
)

watch([() => props.type, () => props.multiline, () => props.passwordToggle], () => {
  passwordVisible.value = false
})

function controlId() {
  return typeof attrs.id === 'string' && attrs.id.length > 0 ? attrs.id : generatedId
}

function maximumLength() {
  const value = attrs.maxlength ?? attrs.maxLength
  if (value === undefined || value === null || value === '' || typeof value === 'boolean')
    return undefined
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : undefined
}

function counterText() {
  const maximum = maximumLength()
  if (props.showCount === false || (props.showCount === undefined && maximum === undefined))
    return ''
  return maximum === undefined ? String(draft.value.length) : `${draft.value.length} / ${maximum}`
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

function rootAttrs() {
  return {
    class: attrs.class,
    style: attrs.style as StyleValue,
    dir: typeof attrs.dir === 'string' ? attrs.dir : undefined,
    lang: typeof attrs.lang === 'string' ? attrs.lang : undefined,
  }
}

function controlAttrs() {
  const result = { ...attrs }
  delete result.class
  delete result.style
  delete result.value
  delete result.defaultValue
  result.id = controlId()
  result['aria-invalid'] = hasError.value ? 'true' : attrs['aria-invalid']
  result['aria-describedby'] = joinIds(
    attrs['aria-describedby'],
    supportingMessage.value ? descriptionId : undefined,
    counterText() ? counterId : undefined,
  )
  result['aria-errormessage'] = joinIds(
    attrs['aria-errormessage'],
    hasError.value && supportingMessage.value ? descriptionId : undefined,
  )
  return mergeProps(
    {
      onInput: handleInput,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onCompositionstart: handleCompositionStart,
      onCompositionend: handleCompositionEnd,
      onInvalid: handleInvalid,
      onAnimationstart: handleAutofill,
    },
    result,
  )
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

function handleInput(event: Event) {
  const element = event.target as HTMLInputElement | HTMLTextAreaElement
  draft.value = element.value
  if (!draft.value) autofilled.value = false
  if (composing.value || (event as InputEvent).isComposing) return
  if (!props.modelModifiers.lazy) commitValue(draft.value)
  refreshValidation()
}

function handleChange(event: Event) {
  draft.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  if (composing.value) return
  commitValue(draft.value)
  if (props.modelModifiers.trim) {
    draft.value = draft.value.trim()
    if (control.value) control.value.value = draft.value
  }
  refreshValidation()
}

function handleCompositionStart() {
  composing.value = true
}

function handleCompositionEnd(event: CompositionEvent) {
  if (!composing.value) return
  composing.value = false
  draft.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  if (!props.modelModifiers.lazy) commitValue(draft.value)
  refreshValidation()
}

function handleFocus() {
  focused.value = true
}

function handleBlur() {
  focused.value = false
  if (props.modelModifiers.trim && !composing.value) {
    draft.value = draft.value.trim()
    if (control.value) control.value.value = draft.value
  }
  refreshValidation()
}

function handleInvalid() {
  validationReported.value = true
  refreshValidation()
}

function handleAutofill(event: AnimationEvent) {
  if (event.animationName === 'mdv-text-field-autofill') {
    autofilled.value = true
    if (control.value) {
      draft.value = control.value.value
      if (!props.modelModifiers.lazy) commitValue(draft.value)
    }
  } else if (event.animationName === 'mdv-text-field-autofill-cancel') {
    autofilled.value = false
  }
}

function focus(options?: FocusOptions) {
  control.value?.focus(options)
}

function focusContainer(event: MouseEvent) {
  const element = control.value
  const container = event.currentTarget
  if (
    !element ||
    element.matches(':disabled') ||
    event.defaultPrevented ||
    !(event.target instanceof Element) ||
    !(container instanceof Element)
  )
    return
  const interactive = event.target.closest(
    'input, textarea, button, a, label, select, [tabindex], [contenteditable]',
  )
  // 只排除当前框内的交互内容，不能被外层可聚焦容器拦截。
  if (interactive && container.contains(interactive)) return
  focus()
}

function clearValue() {
  const element = control.value
  if (!element || props.disabled || props.readonly || element.matches(':disabled')) return
  draft.value = ''
  element.value = ''
  autofilled.value = false
  commitValue('')
  focus({ preventScroll: true })
  element.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
}

async function togglePassword() {
  const element = control.value
  if (!canTogglePassword.value || !element || element.matches(':disabled')) return
  const start = element.selectionStart
  const end = element.selectionEnd
  const direction = element.selectionDirection ?? undefined
  passwordVisible.value = !passwordVisible.value
  await nextTick()
  if (control.value !== element || props.multiline || props.type !== 'password') return
  focus({ preventScroll: true })
  if (start !== null && end !== null) element.setSelectionRange(start, end, direction)
}

function resetFromForm(event: Event) {
  const element = control.value
  const form = event.currentTarget
  // reset 默认动作在事件分发结束后执行；允许调用方取消，并在其后同步 Vue 状态。
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented || control.value !== element || element?.form !== form)
      return
    composing.value = false
    autofilled.value = false
    draft.value = String(initialValue)
    lastCommitted = initialValue
    if (control.value) control.value.value = draft.value
    validationReported.value = false
    nativeInvalid.value = false
    nativeErrorText.value = ''
    emit('update:modelValue', initialValue)
  })
}

function syncForm() {
  const nextForm = control.value?.form ?? null
  if (nextForm === resetForm) return
  resetForm?.removeEventListener('reset', resetFromForm)
  resetForm = nextForm
  resetForm?.addEventListener('reset', resetFromForm)
}

onMounted(() => {
  mounted = true
  if (control.value) {
    const liveValue = preHydrationValue ?? control.value.value
    preHydrationValue = undefined
    control.value.defaultValue = String(initialValue)
    // 服务端 HTML 在 hydration 前可能已被浏览器自动填充。
    control.value.value = liveValue
    if (liveValue !== draft.value) {
      draft.value = liveValue
      commitValue(draft.value)
    }
  }
  syncForm()
})

onUpdated(() => {
  const element = control.value
  if (element) {
    if (element.defaultValue !== String(initialValue)) element.defaultValue = String(initialValue)
    if (
      focused.value &&
      (element.matches(':disabled') || element.ownerDocument.activeElement !== element)
    ) {
      focused.value = false
    }
  }
  syncForm()
  refreshValidation()
})

onBeforeUnmount(() => {
  disposed = true
  resetForm?.removeEventListener('reset', resetFromForm)
})

onDeactivated(() => {
  focused.value = false
})

defineExpose({
  focus,
  blur: () => control.value?.blur(),
  select: () => control.value?.select(),
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
    class="mdv-text-field"
    :class="[
      `mdv-text-field--${props.variant}`,
      {
        'mdv-text-field--focused': focused,
        'mdv-text-field--floating': floating,
        'mdv-text-field--has-label': !!props.label,
        'mdv-text-field--has-leading': !!$slots.leading,
        'mdv-text-field--has-trailing': !!$slots.trailing || props.clearable || canTogglePassword,
        'mdv-text-field--has-prefix': !!props.prefixText,
        'mdv-text-field--has-suffix': !!props.suffixText,
        'mdv-text-field--auto-actions': !$slots.trailing && (props.clearable || canTogglePassword),
        'mdv-text-field--multiline': props.multiline,
        'mdv-text-field--disabled': props.disabled,
        'mdv-text-field--readonly': props.readonly,
        'mdv-text-field--error': hasError,
        'mdv-text-field--full-width': props.fullWidth,
      },
    ]"
  >
    <div class="mdv-text-field__container" @click="focusContainer">
      <fieldset
        v-if="props.variant === 'outlined'"
        class="mdv-text-field__outline"
        aria-hidden="true"
      >
        <legend v-if="props.label">
          <span>{{ props.label }}{{ props.label && props.required ? '*' : '' }}</span>
        </legend>
      </fieldset>
      <span v-else class="mdv-text-field__state-layer" aria-hidden="true" />

      <label v-if="props.label" :for="controlId()" class="mdv-text-field__label">
        {{ props.label }}<span v-if="props.required" aria-hidden="true">*</span>
      </label>

      <div class="mdv-text-field__content">
        <span v-if="$slots.leading" class="mdv-text-field__leading"><slot name="leading" /></span>

        <div class="mdv-text-field__body">
          <span
            v-if="props.prefixText"
            class="mdv-text-field__affix mdv-text-field__prefix"
            aria-hidden="true"
          >
            {{ props.prefixText }}
          </span>
          <textarea
            v-if="props.multiline"
            v-preserve-value
            ref="control"
            v-bind="controlAttrs()"
            class="mdv-text-field__input"
            :value="draft"
            :rows="props.rows"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            :readonly="props.readonly"
            :required="props.required"
          />
          <input
            v-else
            v-preserve-value
            ref="control"
            v-bind="controlAttrs()"
            class="mdv-text-field__input"
            :type="nativeType"
            :value="draft"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            :readonly="props.readonly"
            :required="props.required"
          />
          <span
            v-if="props.suffixText"
            class="mdv-text-field__affix mdv-text-field__suffix"
            aria-hidden="true"
          >
            {{ props.suffixText }}
          </span>
        </div>

        <span
          v-if="$slots.trailing || props.clearable || canTogglePassword"
          class="mdv-text-field__trailing"
        >
          <slot name="trailing">
            <span v-if="props.clearable" class="mdv-text-field__action-space">
              <MdvIconButton
                v-if="showClear"
                variant="standard"
                aria-label="清除输入"
                @mousedown.prevent
                @click="clearValue"
              >
                <MdvIcon :icon="close" />
              </MdvIconButton>
            </span>
            <MdvIconButton
              v-if="canTogglePassword"
              variant="standard"
              :disabled="props.disabled"
              :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
              :aria-pressed="passwordVisible"
              @mousedown.prevent
              @click="togglePassword"
            >
              <MdvIcon :icon="passwordVisible ? visibilityOff : visibility" />
            </MdvIconButton>
          </slot>
        </span>
      </div>
    </div>

    <div v-if="supportingMessage || counterText()" class="mdv-text-field__supporting">
      <span
        :id="descriptionId"
        class="mdv-text-field__supporting-text"
        aria-live="polite"
        aria-atomic="true"
        >{{ supportingMessage }}</span
      >
      <span v-if="counterText()" :id="counterId" class="mdv-text-field__counter">{{
        counterText()
      }}</span>
    </div>
  </div>
</template>
