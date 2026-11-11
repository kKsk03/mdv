export type MdvNavigationBarOrientation = 'auto' | 'vertical' | 'horizontal'

export interface MdvNavigationBarProps {
  /** auto 在 compact 宽度纵向排列，在 medium 宽度横向排列。 */
  orientation?: MdvNavigationBarOrientation
}

export interface MdvNavigationBarItemProps {
  /** 始终显示的目的地名称。 */
  label: string
  /** 提供时渲染原生链接；省略时渲染原生 button。 */
  href?: string
  /** 当前目的地由调用方控制。 */
  active?: boolean
  disabled?: boolean
}

export interface MdvNavigationBarItemSlotProps {
  active: boolean
}
