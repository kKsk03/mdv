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
import { resolveCheckboxColor } from './button-color'
import { useButtonRipple } from './button-ripple'
import type { MdvCheckboxColor, MdvCheckboxModelValue, MdvCheckboxValue } from './checkbox.types'

defineOptions({ name: 'MdvCheckbox', inheritAttrs: false })
defineSlots<{ default?(): VNode[] }>()

const model = defineModel<MdvCheckboxModelValue>({ default: false })
const indeterminate = defineModel<boolean>('indeterminate', { default: false })
const props = withDefaults(
  defineProps<{
    value?: MdvCheckboxValue
    label?: string
    supportingText?: string
    error?: boolean
    errorText?: string
    disabled?: boolean
    required?: boolean
    color?: MdvCheckboxColor
  }>(),
  {
    value: 'on',
    label: '',
    supportingText: '',
    error: false,
    errorText: '',
    disabled: false,
    required: false,
    color: 'primary',
  },
)

const attrs = useAttrs()
const control = useTemplateRef<HTMLInputElement>('control')
const surface = useTemplateRef<HTMLSpanElement>('surface')
const generatedId = `mdv-checkbox-${useId()}`
const descriptionId = `${generatedId}-description`
const colors = computed(() => resolveCheckboxColor(props.color))
const checked = computed(() => isChecked(model.value))
const selected = computed(() => checked.value || indeterminate.value)
const markIndeterminate = ref(indeterminate.value)
const enteringChecked = ref(false)
const validationReported = ref(false)
const nativeInvalid = ref(false)
const nativeErrorText = ref('')
const hasError = computed(() => props.error || nativeInvalid.value)
const supportingMessage = computed(() =>
  hasError.value
    ? props.errorText || nativeErrorText.value || props.supportingText
    : props.supportingText,
)
const initialModel = copyValue(model.value)
const initialIndeterminate = indeterminate.value
const initialChecked = isChecked(initialModel)
let resetForm: HTMLFormElement | null = null
let disposed = false
let preHydrationChecked: boolean | undefined
let pendingModel: MdvCheckboxModelValue | undefined
let pendingIndeterminate: boolean | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

function copyValue(value: MdvCheckboxModelValue): MdvCheckboxModelValue {
  return Array.isArray(value) ? [...value] : value
}

function isChecked(value: MdvCheckboxModelValue) {
  return Array.isArray(value) ? value.includes(props.value) : value
}

function isDisabled() {
  return props.disabled || !!control.value?.matches(':disabled')
}

const { ripple, showRipple, releaseRipple, finishRipple } = useButtonRipple({
  disabled: isDisabled,
  isLink: () => false,
  surface: () => surface.value,
})

watch([checked, indeterminate], ([nextChecked, nextMixed], [previousChecked, previousMixed]) => {
  enteringChecked.value = nextChecked && !nextMixed && !previousChecked && !previousMixed
  // 退出时保留原图形，仅缩小与淡出，避免勾线跳回横线。
  if (nextChecked || nextMixed) markIndeterminate.value = nextMixed
})

if (import.meta.env.DEV) {
  watch(
    () => props.color,
    (color) => {
      if (!colors.value) {
        console.warn(
          `[MDV] MdvCheckbox: unsupported color "${color}". Use a theme color or a #RGB/#RRGGBB seed.`,
        )
      }
    },
    { immediate: true },
  )
}

// Vue 写入 checked 之前保存 hydration 前的用户选择。
const vNativeState: ObjectDirective<HTMLInputElement> = {
  created(element) {
    if (element.defaultChecked === initialChecked && element.checked !== initialChecked) {
      preHydrationChecked = element.checked
    }
  },
  mounted(element) {
    element.indeterminate = indeterminate.value
  },
  updated(element) {
    element.indeterminate = indeterminate.value
  },
}

function controlId() {
  return typeof attrs.id === 'string' && attrs.id.length > 0 ? attrs.id : generatedId
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
  result.id = controlId()
  result['aria-checked'] = indeterminate.value ? 'mixed' : String(checked.value)
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
  if (!control.value) return
  control.value.checked = checked.value
  control.value.indeterminate = indeterminate.value
}

function scheduleSync() {
  if (syncTimer !== undefined) return
  // input/change 之间也可能刷新微任务；等整次原生激活结束后再恢复受控状态。
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    void nextTick(() => {
      pendingModel = undefined
      pendingIndeterminate = undefined
      if (disposed) return
      syncControl()
      refreshValidation()
    })
  }, 0)
}

function commitChecked(nextChecked: boolean) {
  const current = pendingModel ?? model.value
  if (pendingIndeterminate ?? indeterminate.value) {
    pendingIndeterminate = false
    indeterminate.value = false
  }
  if (Array.isArray(current)) {
    if (current.includes(props.value) !== nextChecked) {
      pendingModel = nextChecked
        ? [...current, props.value]
        : current.filter((value) => value !== props.value && !Object.is(value, props.value))
      model.value = pendingModel
    }
  } else if (current !== nextChecked) {
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
  // 原生预激活已切换 checked；半选无论底层 checked 是什么都转为选中。
  if ((pendingIndeterminate ?? indeterminate.value) && control.value) {
    control.value.checked = true
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
    pendingModel = undefined
    pendingIndeterminate = undefined
    model.value = copyValue(initialModel)
    indeterminate.value = initialIndeterminate
    validationReported.value = false
    nativeInvalid.value = false
    nativeErrorText.value = ''
    ripple.value = null
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
    const resetChecked = isChecked(initialModel)
    if (control.value.defaultChecked !== resetChecked) control.value.defaultChecked = resetChecked
  }
  syncForm()
  refreshValidation()
})

onDeactivated(() => {
  ripple.value = null
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
    class="mdv-checkbox"
    :class="{
      'mdv-checkbox--selected': selected,
      'mdv-checkbox--checked-mark': !markIndeterminate,
      'mdv-checkbox--entering-checked': enteringChecked,
      'mdv-checkbox--error': hasError,
    }"
  >
    <label
      class="mdv-checkbox__row"
      :for="controlId()"
      @pointerdown="pointerDown"
      @pointerup="releaseRipple"
      @pointercancel="releaseRipple"
      @pointerleave="releaseRipple"
      @keydown="keyDown"
      @keyup="releaseRipple"
      @focusout="releaseRipple"
    >
      <span class="mdv-checkbox__control">
        <input
          ref="control"
          v-native-state
          v-bind="controlAttrs()"
          class="mdv-checkbox__input"
          type="checkbox"
          :value="props.value"
          :checked="checked"
          :disabled="props.disabled"
          :required="props.required"
        />
        <span ref="surface" class="mdv-checkbox__state" aria-hidden="true">
          <span
            v-if="ripple"
            :key="ripple.key"
            class="mdv-checkbox__ripple"
            :class="{ 'mdv-checkbox__ripple--released': ripple.released }"
            @animationend="finishRipple"
          >
            <span
              class="mdv-checkbox__ripple-wave"
              :style="{
                left: `${ripple.x}px`,
                top: `${ripple.y}px`,
                width: `${ripple.size}px`,
                height: `${ripple.size}px`,
              }"
            />
          </span>
        </span>
        <span class="mdv-checkbox__container" aria-hidden="true">
          <span class="mdv-checkbox__outline" />
          <span class="mdv-checkbox__background" />
          <span class="mdv-checkbox__icon">
            <span class="mdv-checkbox__mark mdv-checkbox__mark--short" />
            <span class="mdv-checkbox__mark mdv-checkbox__mark--long" />
          </span>
        </span>
      </span>
      <span v-if="props.label || $slots.default" class="mdv-checkbox__label">
        <slot>{{ props.label }}</slot>
      </span>
    </label>
    <div class="mdv-checkbox__supporting" aria-live="polite">
      <span v-if="supportingMessage" :id="descriptionId">{{ supportingMessage }}</span>
    </div>
  </div>
</template>
