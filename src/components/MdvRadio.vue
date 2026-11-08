<script setup lang="ts">
import {
  computed,
  inject,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  toRef,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import type { ObjectDirective, StyleValue, VNode } from 'vue'
import { resolveRadioColor } from './button-color'
import { useButtonRipple } from './button-ripple'
import { mdvRadioGroupKey } from './radio-context'
import type { MdvRadioGroupContext } from './radio-context'
import type { MdvRadioColor, MdvRadioModelValue, MdvRadioValue } from './radio.types'

defineOptions({ name: 'MdvRadio', inheritAttrs: false })

defineSlots<{ default?(): VNode[] }>()

const context = inject<MdvRadioGroupContext | null>(mdvRadioGroupKey, null)
const model = defineModel<MdvRadioModelValue>({ default: null })
const props = withDefaults(
  defineProps<{
    value: MdvRadioValue
    label?: string
    supportingText?: string
    error?: boolean
    errorText?: string
    disabled?: boolean
    required?: boolean
    color?: MdvRadioColor
  }>(),
  {
    label: '',
    supportingText: '',
    error: false,
    errorText: '',
    disabled: false,
    required: false,
  },
)

const attrs = useAttrs()
const control = useTemplateRef<HTMLInputElement>('control')
const surface = useTemplateRef<HTMLSpanElement>('surface')
const radioId = `mdv-radio-${useId()}`
const generatedId = `mdv-radio-control-${useId()}`
const controlId = computed(() =>
  typeof attrs.id === 'string' && attrs.id.length > 0 ? attrs.id : generatedId,
)
const descriptionId = computed(() => `${controlId.value}-description`)
const effectiveColor = computed(() => props.color ?? context?.color.value ?? 'primary')
const colors = computed(() => resolveRadioColor(effectiveColor.value))
const checked = computed(() =>
  context ? Object.is(context.model.value, props.value) : Object.is(model.value, props.value),
)
const disabledState = computed(
  () => props.disabled || !!context?.disabled.value || !!control.value?.matches(':disabled'),
)
const nativeInvalid = ref(false)
const validationReported = ref(false)
const nativeErrorText = ref('')
const hasError = computed(() => props.error || nativeInvalid.value || !!context?.hasError.value)
const supportingMessage = computed(() =>
  context
    ? props.supportingText || ''
    : hasError.value
      ? props.errorText || nativeErrorText.value || props.supportingText
      : props.supportingText,
)
const nativeRequired = computed(() =>
  context ? context.isRequired(radioId, disabledState.value) : props.required,
)
const tabIndex = computed(() =>
  context
    ? context.tabIndex(radioId, disabledState.value)
    : typeof attrs.tabindex === 'number' || typeof attrs.tabindex === 'string'
      ? attrs.tabindex
      : undefined,
)
const initialChecked = context ? context.isInitiallyChecked(props.value) : checked.value
const initialModel = model.value
let unregister: (() => void) | undefined
let resetForm: HTMLFormElement | null = null
let disposed = false
let preHydrationChecked: boolean | undefined
let pendingValue: MdvRadioValue | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

const vNativeState: ObjectDirective<HTMLInputElement> = {
  created(element) {
    if (element.defaultChecked === initialChecked && element.checked !== initialChecked) {
      preHydrationChecked = element.checked
    }
  },
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
    style: [colors.value, attrs.style as StyleValue],
    dir: typeof attrs.dir === 'string' ? attrs.dir : undefined,
    lang: typeof attrs.lang === 'string' ? attrs.lang : undefined,
  }
}

function controlAttrs() {
  const result = { ...attrs }
  for (const key of ['class', 'style', 'type', 'checked', 'defaultChecked', 'defaultchecked']) {
    delete result[key]
  }
  if (context) delete result.tabindex
  result.id = controlId.value
  if (context?.name.value !== undefined && result.name === undefined)
    result.name = context.name.value
  if (context?.form.value !== undefined && result.form === undefined)
    result.form = context.form.value
  result.tabindex = tabIndex.value
  result['aria-checked'] = String(checked.value)
  result['aria-invalid'] = hasError.value ? 'true' : attrs['aria-invalid']
  result['aria-describedby'] = joinIds(
    attrs['aria-describedby'],
    context?.descriptionId.value,
    supportingMessage.value ? descriptionId.value : undefined,
  )
  result['aria-errormessage'] = joinIds(
    attrs['aria-errormessage'],
    hasError.value && supportingMessage.value ? descriptionId.value : undefined,
  )
  return mergeProps(
    {
      onClick: handleClick,
      onInput: handleInput,
      onChange: handleChange,
      onInvalid: handleInvalid,
      onKeydown: handleKeydown,
    },
    result,
  )
}

function syncControl() {
  if (control.value) control.value.checked = checked.value
}

function scheduleSync() {
  if (syncTimer !== undefined) return
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    void nextTick(() => {
      pendingValue = undefined
      if (disposed) return
      syncControl()
      context?.scheduleSync()
      refreshValidation()
    })
  }, 0)
}

function commitValue(nextValue: MdvRadioValue) {
  if (context) {
    context.select(nextValue)
    return
  }
  const current = pendingValue ?? model.value
  if (!Object.is(current, nextValue)) {
    pendingValue = nextValue
    model.value = nextValue
  }
  scheduleSync()
}

function handleClick(event: MouseEvent) {
  if (disabledState.value) {
    event.preventDefault()
    return
  }
  scheduleSync()
}

function handleInput() {
  if (disabledState.value) return
  commitValue(props.value)
  refreshValidation()
}

function handleChange() {
  if (disabledState.value) return
  commitValue(props.value)
  refreshValidation()
}

function handleKeydown(event: KeyboardEvent) {
  if (disabledState.value || !context) return
  context.handleKeydown(radioId, event)
}

function refreshValidation() {
  if (!validationReported.value) return
  const element = control.value
  nativeInvalid.value = !!(element?.willValidate && !element.validity.valid)
  nativeErrorText.value = nativeInvalid.value ? (element?.validationMessage ?? '') : ''
}

function handleInvalid() {
  validationReported.value = true
  if (control.value) {
    nativeInvalid.value = !control.value.validity.valid
    nativeErrorText.value = control.value.validationMessage
    context?.reportInvalid(control.value)
  }
}

function pointerDown(event: PointerEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('a, button, select, textarea, [contenteditable]'))
    return
  showRipple(event)
}

function keyDown(event: KeyboardEvent) {
  if (event.target === control.value && event.key === ' ') showRipple(event)
}

function resetFromForm(event: Event) {
  const element = control.value
  const form = event.currentTarget
  queueMicrotask(() => {
    if (disposed || event.defaultPrevented || control.value !== element || element?.form !== form)
      return
    pendingValue = undefined
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

onMounted(() => {
  if (context) {
    unregister = context.register({
      id: radioId,
      value: toRef(props, 'value'),
      input: control,
      disabled: disabledState,
    })
  }
  if (control.value && preHydrationChecked === true && !initialChecked) {
    preHydrationChecked = undefined
    commitValue(props.value)
  } else {
    syncControl()
  }
  if (!context) syncForm()
})

onUpdated(() => {
  if (!context) {
    syncForm()
    refreshValidation()
  }
})

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: () => disabledState.value,
  isLink: () => false,
  surface: () => surface.value,
})

onDeactivated(() => {
  ripple.value = null
})

onBeforeUnmount(() => {
  disposed = true
  clearTimeout(syncTimer)
  unregister?.()
  resetForm?.removeEventListener('reset', resetFromForm)
})

if (import.meta.env.DEV) {
  watch(
    effectiveColor,
    (color) => {
      if (!colors.value) {
        console.warn(
          `[MDV] MdvRadio: unsupported color "${color}". Use a theme color or a #RGB/#RRGGBB seed.`,
        )
      }
    },
    { immediate: true },
  )
}

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
    class="mdv-radio"
    :class="{
      'mdv-radio--selected': checked,
      'mdv-radio--error': hasError,
    }"
  >
    <label
      class="mdv-radio__row"
      :for="controlId"
      @pointerdown="pointerDown"
      @pointerup="releaseRipple"
      @pointercancel="releaseRipple"
      @pointerleave="releaseRipple"
      @keydown="keyDown"
      @keyup="releaseRipple"
      @focusout="releaseRipple"
    >
      <span class="mdv-radio__control">
        <input
          ref="control"
          v-native-state
          v-bind="controlAttrs()"
          class="mdv-radio__input"
          type="radio"
          :value="props.value"
          :checked="checked"
          :disabled="props.disabled"
          :required="nativeRequired"
        />
        <span ref="surface" class="mdv-radio__state" aria-hidden="true">
          <span
            v-if="ripple"
            :key="ripple.key"
            class="mdv-radio__ripple"
            :class="{ 'mdv-radio__ripple--released': ripple.released }"
            @animationend="finishRipple"
          >
            <span
              class="mdv-radio__ripple-wave"
              :style="{
                left: `${ripple.x}px`,
                top: `${ripple.y}px`,
                width: `${ripple.size}px`,
                height: `${ripple.size}px`,
              }"
            />
          </span>
        </span>
        <span class="mdv-radio__container" aria-hidden="true">
          <span class="mdv-radio__outline" />
          <span class="mdv-radio__dot" />
        </span>
      </span>
      <span v-if="props.label || $slots.default" class="mdv-radio__label">
        <slot>{{ props.label }}</slot>
      </span>
    </label>
    <div v-if="supportingMessage" class="mdv-radio__supporting" aria-live="polite">
      <span :id="descriptionId">{{ supportingMessage }}</span>
    </div>
  </div>
</template>
