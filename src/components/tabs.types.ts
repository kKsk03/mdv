export type MdvTabValue = string | number
export type MdvTabsVariant = 'primary' | 'secondary'
export type MdvTabsIconPosition = 'top' | 'leading'
export type MdvTabsActivation = 'manual' | 'automatic'
export type MdvTabsTabNavigation = 'all' | 'active'

export interface MdvTabsProps {
  modelValue?: MdvTabValue
  variant?: MdvTabsVariant
  scrollable?: boolean
  showDivider?: boolean
  iconPosition?: MdvTabsIconPosition
  activation?: MdvTabsActivation
  /** all：逐项 Tab；active：整组一个 Tab 入口，组内使用方向键。 */
  tabNavigation?: MdvTabsTabNavigation
  /** 仅接管内容区的触摸横滑，不接管鼠标拖选或内层交互。 */
  swipeable?: boolean
}

export interface MdvTabProps {
  value: MdvTabValue
  label?: string
  disabled?: boolean
}

export interface MdvTabPanelProps {
  value: MdvTabValue
  lazy?: boolean
  destroyOnHide?: boolean
}

export interface MdvTabSlotProps {
  active: boolean
}
