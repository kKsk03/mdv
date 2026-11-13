import type { ButtonHTMLAttributes, VNodeRef } from 'vue'
import type { MdvFabColor, MdvFabPosition, MdvFabSize } from './fab.types'
import type { MdvIconData } from './icon.types'
import type { MdvMenuCloseDetail, MdvMenuCloseReason, MdvMenuSelectEvent } from './menu.types'

export type MdvFabMenuVariant = 'expressive' | 'baseline'
export type MdvFabMenuColor = Exclude<MdvFabColor, 'surface'>
export type MdvFabMenuSize = Exclude<MdvFabSize, 'small'>
export type MdvFabMenuTriggerAttrs = ButtonHTMLAttributes & { ref?: VNodeRef }
export type MdvFabMenuCloseReason = MdvMenuCloseReason
export type MdvFabMenuCloseDetail = MdvMenuCloseDetail
export type MdvFabMenuSelectEvent = MdvMenuSelectEvent

export interface MdvFabMenuProps {
  modelValue?: boolean
  variant?: MdvFabMenuVariant
  color?: MdvFabMenuColor
  size?: MdvFabMenuSize
  elevated?: boolean
  position?: MdvFabPosition
  /** 省略时普通窗口16px、大窗口24px；另计安全区。 */
  offset?: number
  /** 描述将打开的操作，例如“新建内容”。 */
  label: string
  closeLabel?: string
  triggerAttrs?: MdvFabMenuTriggerAttrs
}

export interface MdvFabMenuItemProps {
  label?: string
  icon?: MdvIconData
  value?: string | number
  href?: string
  disabled?: boolean
  keepOpen?: boolean
}
