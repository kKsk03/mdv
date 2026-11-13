import type { MdvButtonColor, MdvButtonShape, MdvButtonSize, MdvButtonType } from './button.types'
import type { MdvIconButtonWidth } from './icon-button.types'

export type MdvButtonGroupVariant = 'standard' | 'connected'
export type MdvButtonGroupSelection = 'none' | 'single' | 'multiple'
export type MdvButtonGroupValue = string | number
export type MdvButtonGroupModelValue = MdvButtonGroupValue | MdvButtonGroupValue[] | null
export type MdvButtonGroupDensity = 0 | -1 | -2 | -3
export type MdvButtonGroupItemVariant = 'filled' | 'tonal' | 'outlined' | 'elevated'

export interface MdvButtonGroupProps {
  modelValue?: MdvButtonGroupModelValue
  variant?: MdvButtonGroupVariant
  size?: MdvButtonSize
  shape?: MdvButtonShape
  /** 省略时 Standard 为 none，Connected 为 single。 */
  selection?: MdvButtonGroupSelection
  /** 只阻止取消最后一项，不自动选择，也不是 HTML required。 */
  selectionRequired?: boolean
  disabled?: boolean
  density?: MdvButtonGroupDensity
  /** 省略时 Standard 随内容、Connected 填满所属表面。 */
  fullWidth?: boolean
  name?: string
  form?: string
}

export interface MdvButtonGroupItemProps {
  value?: MdvButtonGroupValue
  variant?: MdvButtonGroupItemVariant
  color?: MdvButtonColor
  /** Standard 可覆盖；Connected 统一继承组。 */
  size?: MdvButtonSize
  shape?: MdvButtonShape
  iconOnly?: boolean
  width?: MdvIconButtonWidth
  /** 仅在组 selection=none 时使用，提供布尔值即为受控独立切换。 */
  selected?: boolean
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  type?: MdvButtonType
  /** 仅普通操作使用链接，选择模式忽略 href。 */
  href?: string
}

export interface MdvButtonGroupItemSlotProps {
  selected: boolean
}
