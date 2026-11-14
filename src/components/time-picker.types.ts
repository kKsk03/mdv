import type { VNode } from 'vue'

/** 纯时间，格式 HH:mm，00:00 至 23:59；不包含日期、秒或时区。 */
export type MdvTimeValue = string | null
export type MdvTimePickerView = 'auto' | 'dial' | 'input'
export type MdvTimePickerOrientation = 'auto' | 'vertical' | 'horizontal'
export type MdvTimePickerHourCycle = 'auto' | 'h12' | 'h23'
export type MdvTimePickerCloseReason =
  'confirm' | 'cancel' | 'escape' | 'scrim' | 'model' | 'programmatic' | 'disabled'
export interface MdvTimePickerCloseDetail {
  reason: MdvTimePickerCloseReason
}
export interface MdvTimePickerLabels {
  title: string
  time: string
  hour: string
  minute: string
  period: string
  open: string
  dial: string
  input: string
  cancel: string
  confirm: string
  clear: string
  formatHint: string
  keyboardHint: string
  invalidTime: string
  required: string
  outOfBounds: string
  disabledTime: string
  invalidBounds: string
  invalidStep: string
  stepMismatch: string
  noAvailableTime: string
}
export interface MdvTimePickerProps {
  modelValue?: MdvTimeValue
  open?: boolean
  initialView?: MdvTimePickerView
  orientation?: MdvTimePickerOrientation
  hourCycle?: MdvTimePickerHourCycle
  locale?: string
  min?: string
  max?: string
  disabledTime?: (time: string) => boolean
  /** 60 的正整数约数；以每小时 00 分锚定，默认 1。 */
  minuteStep?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  label?: string
  supportingText?: string
  error?: boolean
  errorText?: string
  name?: string
  labels?: Partial<MdvTimePickerLabels>
}
export interface MdvTimePickerTriggerProps {
  type: 'button'
  disabled: boolean
  'aria-haspopup': 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
  'aria-label': string
  onClick: (event: MouseEvent) => void
}
export interface MdvTimePickerTriggerSlotProps {
  open: (event?: Event) => Promise<boolean>
  close: () => Promise<boolean>
  triggerProps: MdvTimePickerTriggerProps
}
export interface MdvTimePickerSlots {
  trigger?(props: MdvTimePickerTriggerSlotProps): VNode[]
  title?(): VNode[]
}
export interface MdvTimePickerExpose {
  open: (event?: Event) => Promise<boolean>
  close: () => Promise<boolean>
  focus: (options?: FocusOptions) => void
  checkValidity: () => boolean
  reportValidity: () => boolean
  setCustomValidity: (message: string) => void
}
