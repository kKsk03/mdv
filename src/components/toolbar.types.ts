export type MdvToolbarVariant = 'docked' | 'floating'
export type MdvToolbarColor = 'standard' | 'vibrant'
export type MdvToolbarOrientation = 'horizontal' | 'vertical'
export type MdvToolbarAlignment = 'start' | 'center' | 'end' | 'between'
export type MdvToolbarPosition = 'static' | 'absolute' | 'fixed'
export type MdvToolbarPlacement = 'bottom' | 'start' | 'end'
export type MdvToolbarScrollBehavior = 'none' | 'hide' | 'collapse'
export type MdvToolbarScrollTarget =
  Window | HTMLElement | string | (() => Window | HTMLElement | null | undefined)

export interface MdvToolbarProps {
  variant?: MdvToolbarVariant
  color?: MdvToolbarColor
  /** 竖向仅适用于 Floating。 */
  orientation?: MdvToolbarOrientation
  align?: MdvToolbarAlignment
  /** 省略时 Floating 有柔和阴影，Docked 无阴影。 */
  elevated?: boolean
  position?: MdvToolbarPosition
  /** Docked 仅支持 bottom；start／end 使用逻辑方向。 */
  placement?: MdvToolbarPlacement
  /** 仅 Floating 收合 leading／trailing；不销毁插槽节点。 */
  expanded?: boolean
  scrollBehavior?: MdvToolbarScrollBehavior
  /** 省略跟随 window；显式目标不存在时不监听其它滚动区。 */
  scrollTarget?: MdvToolbarScrollTarget
  /** 同方向累计滚动距离，默认 40px。 */
  scrollThreshold?: number
  expandLabel?: string
  collapseLabel?: string
}

export interface MdvToolbarToggleProps {
  'aria-expanded': boolean
  'aria-controls': string
  'aria-label': string
  onClick: () => void
}

export interface MdvToolbarSlotProps {
  expanded: boolean
  expand: () => Promise<boolean>
  collapse: () => Promise<boolean>
  toggle: () => Promise<boolean>
  toggleProps: MdvToolbarToggleProps
}
