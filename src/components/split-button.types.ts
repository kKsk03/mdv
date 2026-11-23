import type { AnchorHTMLAttributes, ButtonHTMLAttributes, VNodeRef } from 'vue'
import type { MdvButtonColor, MdvButtonSize, MdvButtonType } from './button.types'

export type MdvSplitButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated'
export type MdvSplitButtonActionAttrs = ButtonHTMLAttributes & AnchorHTMLAttributes
export type MdvSplitButtonMenuAttrs = ButtonHTMLAttributes & { ref?: VNodeRef }

export interface MdvSplitButtonProps {
  variant?: MdvSplitButtonVariant
  size?: MdvButtonSize
  color?: MdvButtonColor
  /** 外部菜单／弹层已接受的展开状态；组件不自行切换。 */
  expanded?: boolean
  /** 描述主操作的更多选择，例如“更多保存选项”。 */
  menuButtonLabel?: string
  disabled?: boolean
  actionDisabled?: boolean
  menuDisabled?: boolean
  loading?: boolean
  loadingText?: string
  iconOnly?: boolean
  type?: MdvButtonType
  href?: string
  hoverShadow?: boolean
  fullWidth?: boolean
  /** 主按钮／链接的原生属性；组级属性直接传给组件。 */
  actionAttrs?: MdvSplitButtonActionAttrs
  /** 接收 MdvMenu 的 triggerProps；ref 和事件转交真实尾按钮。 */
  menuButtonAttrs?: MdvSplitButtonMenuAttrs
}
