import type { MdvDialogCloseReason } from './dialog.types'

export type MdvSideSheetPlacement = 'start' | 'end'
export type MdvSideSheetCloseReason = MdvDialogCloseReason | 'swipe'

export interface MdvSideSheetCloseDetail {
  reason: MdvSideSheetCloseReason
  returnValue: string
}

export type MdvSideSheetBeforeClose = (
  detail: Readonly<MdvSideSheetCloseDetail>,
) => boolean | void | Promise<boolean | void>

interface SideSheetAppearanceProps {
  modelValue?: boolean
  title?: string
  description?: string
  /** CSS 长度；默认 256px，最大 400px，且不超过可用区域。 */
  width?: string
  placement?: MdvSideSheetPlacement
  detached?: boolean
  showBack?: boolean
  backLabel?: string
  closeLabel?: string
  /** 标题和操作区的可选水平分隔线。 */
  dividers?: boolean
  beforeClose?: MdvSideSheetBeforeClose
  destroyOnClose?: boolean
}

export interface MdvSideSheetProps extends SideSheetAppearanceProps {
  closeOnEsc?: boolean
  closeOnScrim?: boolean
  /** 从面向主内容的一侧边缘横向滑动关闭。 */
  closeOnSwipe?: boolean
}

export interface MdvSideSheetScaffoldProps extends SideSheetAppearanceProps {
  /** 贴边面板与主内容之间的竖直分隔线；分离时不显示。 */
  showDivider?: boolean
}

export interface MdvSideSheetSlotProps {
  /** true 表示父级已接受关闭请求，退出动画可能仍在进行。 */
  close: (returnValue?: string) => Promise<boolean>
}
