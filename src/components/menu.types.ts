import type { ComponentPublicInstance, VNodeRef } from 'vue'

export type MdvMenuVariant = 'expressive' | 'baseline'
export type MdvMenuColorScheme = 'standard' | 'vibrant'
export type MdvMenuLayout = 'standard' | 'grouped'
export type MdvMenuSubmenuMode = 'flyout' | 'push'
export type MdvMenuPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
export type MdvMenuSelectionMode = 'none' | 'single' | 'multiple'
export type MdvMenuValue = string | number
export type MdvMenuModelValue = MdvMenuValue | MdvMenuValue[] | null
export type MdvMenuCloseReason =
  'escape' | 'outside' | 'focus-out' | 'tab' | 'select' | 'trigger' | 'model' | 'programmatic'

export interface MdvMenuCloseDetail {
  reason: MdvMenuCloseReason
}

export interface MdvMenuSelectDetail {
  value: MdvMenuValue | undefined
  /** 本次动作希望提交的选择状态；普通操作为 false。 */
  selected: boolean
  originalEvent: MouseEvent
}

/** 可同步调用 preventDefault()，取消选值、链接导航及自动关闭。 */
export type MdvMenuSelectEvent = CustomEvent<MdvMenuSelectDetail>

export interface MdvMenuProps {
  modelValue?: boolean
  variant?: MdvMenuVariant
  colorScheme?: MdvMenuColorScheme
  layout?: MdvMenuLayout
  submenuMode?: MdvMenuSubmenuMode
  placement?: MdvMenuPlacement
  offset?: number
}

export interface MdvMenuTriggerProps {
  ref: VNodeRef
  id: string
  'aria-haspopup': 'menu'
  'aria-controls': string
  'aria-expanded': boolean
  'data-mdv-menu-trigger-open': '' | undefined
  onClick?: (event: MouseEvent) => void
  onContextmenu?: (event: MouseEvent) => void
  onKeydown: (event: KeyboardEvent) => void
}

export interface MdvMenuSlotProps {
  open: boolean
  close: () => void
}

export interface MdvMenuTriggerSlotProps extends MdvMenuSlotProps {
  /** 绑定到一个原生元素或根元素为原生控件的 Vue 组件。 */
  triggerProps: MdvMenuTriggerProps
}

export interface MdvMenuItemSlotProps {
  selected: boolean
  disabled: boolean
  expanded: boolean
}

// 用于内部 ref 回调的窄类型，不作为运行时平台假设。
export type MenuTriggerElement = Element | ComponentPublicInstance | null
