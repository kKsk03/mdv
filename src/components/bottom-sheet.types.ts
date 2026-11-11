import type { MdvDialogCloseReason } from './dialog.types'

export type MdvBottomSheetState = 'hidden' | 'partial' | 'expanded'
export type MdvBottomSheetCloseReason = MdvDialogCloseReason | 'handle' | 'swipe'
export type MdvBottomSheetChangeReason = 'model' | 'handle' | 'swipe' | 'action' | 'resize'

export interface MdvBottomSheetCloseDetail {
  reason: MdvBottomSheetCloseReason
  returnValue: string
}

export interface MdvBottomSheetChangeDetail {
  state: MdvBottomSheetState
  previousState: MdvBottomSheetState
  reason: MdvBottomSheetChangeReason
}

export type MdvBottomSheetBeforeClose = (
  detail: Readonly<MdvBottomSheetCloseDetail>,
) => boolean | void | Promise<boolean | void>

interface BottomSheetAppearanceProps {
  title?: string
  description?: string
  /** CSS 长度；省略时按官方响应式顶部留白限制高度。 */
  maxHeight?: string
  showHandle?: boolean
  draggable?: boolean
  expandLabel?: string
  collapseLabel?: string
  closeLabel?: string
}

export interface MdvBottomSheetProps extends BottomSheetAppearanceProps {
  modelValue?: boolean
  expanded?: boolean
  /** true 为半屏，数字为视口高度比例；false 不设半展开位置。 */
  partial?: boolean | number
  closeOnEsc?: boolean
  closeOnScrim?: boolean
  closeOnSwipe?: boolean
  beforeClose?: MdvBottomSheetBeforeClose
  destroyOnClose?: boolean
}

export interface MdvBottomSheetScaffoldProps extends BottomSheetAppearanceProps {
  modelValue?: MdvBottomSheetState
  peekHeight?: number
  /** 是否允许用户通过拖动或手柄隐藏；程序设置 hidden 始终生效。 */
  hideable?: boolean
}

export interface MdvBottomSheetSlotProps {
  state: MdvBottomSheetState
  expanded: boolean
  close: (returnValue?: string) => Promise<boolean>
  expand: () => Promise<boolean>
  collapse: () => Promise<boolean>
}
