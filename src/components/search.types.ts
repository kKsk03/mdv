import type { InputHTMLAttributes, VNodeRef } from 'vue'
import type { MdvAppBarAppearance, MdvAppBarScrollTarget } from './app-bar.types'

export type MdvSearchVariant = 'contained' | 'divided'
export type MdvSearchLayout = 'auto' | 'docked' | 'fullscreen'
export type MdvSearchCloseReason = 'back' | 'escape' | 'scrim' | 'programmatic' | 'model'

export interface MdvSearchCloseDetail {
  reason: MdvSearchCloseReason
}

export type MdvSearchBeforeClose = (
  detail: Readonly<MdvSearchCloseDetail>,
) => boolean | void | Promise<boolean | void>

export interface MdvSearchBarProps {
  modelValue?: string
  placeholder?: string
  /** 省略时以 placeholder 作为输入名称。 */
  label?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  clearLabel?: string
  loading?: boolean
}

export interface MdvSearchViewProps extends MdvSearchBarProps {
  open?: boolean
  variant?: MdvSearchVariant
  layout?: MdvSearchLayout
  backLabel?: string
  closeOnEsc?: boolean
  closeOnScrim?: boolean
  destroyOnClose?: boolean
  beforeClose?: MdvSearchBeforeClose
  /** 输入的原生属性和事件；根 class/style/ARIA 保留在组件根节点。 */
  inputAttrs?: InputHTMLAttributes
  /** 简短的结果状态播报，例如“找到 5 条结果”；不自动朗读整个列表。 */
  statusText?: string
}

export interface MdvSearchAppBarProps extends MdvSearchViewProps {
  appearance?: MdvAppBarAppearance
  scrollBehavior?: 'none' | 'pinned' | 'enter-always'
  scrollTarget?: MdvAppBarScrollTarget
  scrolled?: boolean
}

export interface MdvSearchSlotProps {
  query: string
  expanded: boolean
  close: () => Promise<boolean>
  search: (event?: Event) => void
}

export interface MdvSearchTriggerProps {
  ref: VNodeRef
  'aria-haspopup': 'dialog'
  'aria-controls': string
  'aria-expanded': boolean
  disabled?: boolean
  onClick: (event: MouseEvent) => void
}

export interface MdvSearchTriggerSlotProps extends MdvSearchSlotProps {
  triggerProps: MdvSearchTriggerProps
}
