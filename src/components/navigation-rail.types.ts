export type MdvNavigationRailAlignment = 'top' | 'center'

export interface MdvNavigationRailProps {
  expanded?: boolean
  alignment?: MdvNavigationRailAlignment
  /** 展开宽度受 220–360px 和可用空间约束；省略时按内容测量。 */
  expandedWidth?: string
  transparent?: boolean
  showDivider?: boolean
}

export interface MdvModalNavigationRailProps extends MdvNavigationRailProps {
  hideOnCollapse?: boolean
  closeOnEsc?: boolean
  closeOnScrim?: boolean
  closeOnSelect?: boolean
  destroyOnClose?: boolean
}

export type MdvNavigationRailCloseReason = 'menu' | 'escape' | 'scrim' | 'select' | 'model'

export interface MdvNavigationRailCloseDetail {
  reason: MdvNavigationRailCloseReason
}

export interface MdvNavigationRailSlotProps {
  expanded: boolean
  toggle: () => void
  /** 绑定到菜单按钮即可同时获得原生语义和展开／收起操作。 */
  menuAttrs: {
    'aria-controls': string
    'aria-expanded': boolean
    onClick: () => void
  }
}

export interface MdvNavigationRailItemProps {
  label: string
  href?: string
  active?: boolean
  disabled?: boolean
}

export interface MdvNavigationRailItemSlotProps {
  active: boolean
  expanded: boolean
}
