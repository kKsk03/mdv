import type { VNode } from 'vue'
import type { MdvButtonColor } from './button.types'

export type MdvSnackbarColor = MdvButtonColor
export type MdvSnackbarPlacement = 'bottom' | 'bottom-start'
export type MdvSnackbarActionLayout = 'auto' | 'inline' | 'stacked'
export type MdvSnackbarCloseReason =
  'timeout' | 'escape' | 'close-button' | 'action' | 'programmatic' | 'model'

export interface MdvSnackbarCloseDetail {
  reason: MdvSnackbarCloseReason
}

export interface MdvSnackbarAction {
  label: string
  onClick?: () => void | Promise<void>
}

export interface MdvSnackbarOptions {
  message: string
  color?: MdvSnackbarColor
  action?: MdvSnackbarAction
  duration?: number
  closable?: boolean
  closeLabel?: string
  actionLayout?: MdvSnackbarActionLayout
  placement?: MdvSnackbarPlacement
  offset?: number
  pauseOnHover?: boolean
  closeOnEsc?: boolean
  focusShortcut?: string | false
  key?: string
}

export type MdvSnackbarInput = string | MdvSnackbarOptions

export interface MdvSnackbarProps extends Omit<MdvSnackbarOptions, 'key' | 'message'> {
  modelValue?: boolean
  message?: string
}

export interface MdvSnackbarSlotProps {
  close: () => void
}

export interface MdvSnackbarActionSlotProps extends MdvSnackbarSlotProps {
  pending: boolean
}

export interface MdvSnackbarProviderApi {
  show: (message: MdvSnackbarInput) => string
  update: (id: string, patch: Partial<MdvSnackbarOptions>) => boolean
  close: (id: string) => boolean
  clear: () => void
}

export interface MdvSnackbarSlots {
  default?(props: MdvSnackbarSlotProps): VNode[]
  action?(props: MdvSnackbarActionSlotProps): VNode[]
}
