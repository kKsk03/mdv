import type { MdvIconData } from './icon.types'

/** Material 3 list variant. Expressive is the recommended variant for new designs. */
export type MdvListVariant = 'expressive' | 'baseline'

/** Visual arrangement, available for both Expressive and Baseline. */
export type MdvListLayout = 'standard' | 'segmented'

export type MdvListSelectionMode = 'none' | 'single' | 'multiple'
export type MdvListDivider = 'none' | 'full-width' | 'inset'
export type MdvListValue = string | number
export type MdvListModelValue = MdvListValue | MdvListValue[] | null

export type MdvListLeading = 'icon' | 'avatar' | 'image' | 'checkbox' | 'radio' | 'switch'

export type MdvListTrailing = 'icon' | 'text' | 'checkbox' | 'radio' | 'switch'

export interface MdvListItemSlotProps {
  selected: boolean
  disabled: boolean
}

export interface MdvListItemContentProps {
  overline?: string
  headline?: string
  supportingText?: string
  trailingText?: string
  lines?: 1 | 2 | 3
  icon?: MdvIconData
  leading?: MdvListLeading
  avatarName?: string
  image?: string
  trailingIcon?: MdvIconData
  trailing?: MdvListTrailing
}
