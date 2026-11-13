import type { MdvButtonType } from './button.types'

export type MdvFabColor =
  | 'primary-container'
  | 'secondary-container'
  | 'tertiary-container'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'surface'
export type MdvFabSize = 'small' | 'regular' | 'medium' | 'large'
export type MdvExtendedFabSize = 'small' | 'medium' | 'large'
export type MdvFabType = MdvButtonType
export type MdvFabPosition = 'static' | 'absolute' | 'fixed'
export type MdvFabPlacement = 'bottom-start' | 'bottom-center' | 'bottom-end'
export type MdvExtendedFabScrollBehavior = 'none' | 'collapse'
export type MdvFabScrollTarget =
  Window | HTMLElement | string | (() => Window | HTMLElement | null | undefined)

interface FabBaseProps {
  /** 省略为 primary-container；Floating Toolbar 的 fab 插槽另有上下文默认色。 */
  color?: MdvFabColor
  elevated?: boolean
  type?: MdvFabType
  href?: string
  position?: MdvFabPosition
  placement?: MdvFabPlacement
  /** 贴边距离（px），另计安全区，默认 16。 */
  offset?: number
}

export interface MdvFabProps extends FabBaseProps {
  /** small 为旧版 40px，regular／medium／large 为 56／80／96px。 */
  size?: MdvFabSize
}

export interface MdvExtendedFabProps extends FabBaseProps {
  size?: MdvExtendedFabSize
  /** 仅有 leading 图标时允许收合；省略时内部管理，默认展开。 */
  expanded?: boolean
  scrollBehavior?: MdvExtendedFabScrollBehavior
  /** 省略跟随 window；显式目标不存在时不回退。 */
  scrollTarget?: MdvFabScrollTarget
  /** 同方向累计滚动距离（px），默认 40。 */
  scrollThreshold?: number
}
