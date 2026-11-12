import type { HTMLAttributes } from 'vue'

export type MdvAppBarVariant = 'small' | 'medium' | 'large'
export type MdvAppBarAppearance = 'default' | 'elevated' | 'bordered'
export type MdvAppBarTitleAlignment = 'start' | 'center'
export type MdvAppBarScrollBehavior = 'none' | 'pinned' | 'exit-until-collapsed' | 'enter-always'

export type MdvAppBarScrollTarget =
  Window | HTMLElement | string | (() => Window | HTMLElement | null | undefined)

export interface MdvAppBarProps {
  variant?: MdvAppBarVariant
  /** 默认无阴影／边框；elevated 随滚动进度显示阴影，bordered 显示底部分隔线。 */
  appearance?: MdvAppBarAppearance
  title?: string
  subtitle?: string
  /** 默认标题在收合时可替换为简短文字；自定义 title 插槽使用 collapsed 状态。 */
  collapsedTitle?: string
  titleAlignment?: MdvAppBarTitleAlignment
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  scrollBehavior?: MdvAppBarScrollBehavior
  /** 省略时跟随所在 Scaffold 的正文，否则跟随 window。显式目标未找到时不回退。 */
  scrollTarget?: MdvAppBarScrollTarget
  /** 省略时自动根据目标滚动位置决定外观，不控制收合／隐藏进度。 */
  scrolled?: boolean
  transparentOnScroll?: boolean
}

export interface MdvAppBarSlotProps {
  scrolled: boolean
  collapsed: boolean
}

export interface MdvAppBarScaffoldProps {
  /** 正文滚动区的原生属性与事件，例如 aria-label、tabindex 和 onScroll。 */
  contentAttrs?: HTMLAttributes
}
