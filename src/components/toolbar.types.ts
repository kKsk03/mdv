export type MdvToolbarVariant = 'docked' | 'floating'
export type MdvToolbarColor = 'standard' | 'vibrant'
export type MdvToolbarOrientation = 'horizontal' | 'vertical'
export type MdvToolbarAlignment = 'start' | 'center' | 'end' | 'between'
export type MdvToolbarPosition = 'static' | 'absolute' | 'fixed'
export type MdvToolbarPlacement = 'bottom' | 'start' | 'end'
export type MdvToolbarFabPosition = 'start' | 'end'
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
  /** Floating 的配套 FAB 在主轴上的位置，默认 end。 */
  fabPosition?: MdvToolbarFabPosition
  /** Floating 收合两侧分组；有 fab 插槽时收合整个操作区，不销毁节点。 */
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
  'aria-label'?: string
  onClick: () => void
}

export interface MdvToolbarSlotProps {
  expanded: boolean
  expand: () => Promise<boolean>
  collapse: () => Promise<boolean>
  toggle: () => Promise<boolean>
  toggleProps: MdvToolbarToggleProps
}
