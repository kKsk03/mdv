import type { VNodeRef } from 'vue'

export type MdvTooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type MdvTooltipCloseReason =
  | 'leave'
  | 'focus-out'
  | 'escape'
  | 'outside'
  | 'trigger'
  | 'replaced'
  | 'owner'
  | 'disabled'
  | 'empty'
  | 'model'
  | 'programmatic'

export interface MdvTooltipCloseDetail {
  reason: MdvTooltipCloseReason
}

export interface MdvTooltipProps {
  modelValue?: boolean
  text?: string
  placement?: MdvTooltipPlacement
  offset?: number
  openDelay?: number
  /** 离开或长按释放后的关闭延迟，单位 ms；省略时按交互场景处理。 */
  closeDelay?: number
  disabled?: boolean
}

export interface MdvRichTooltipProps extends MdvTooltipProps {
  title?: string
  persistent?: boolean
}

export interface MdvTooltipSlotProps {
  open: boolean
  close: () => void
}

export interface MdvTooltipTriggerProps {
  ref: VNodeRef
  onPointerenter: (event: PointerEvent) => void
  onPointerleave: (event: PointerEvent) => void
  onPointerdown: (event: PointerEvent) => void
  onFocusin: (event: FocusEvent) => void
  onFocusout: (event: FocusEvent) => void
  onKeydown: (event: KeyboardEvent) => void
  onClick: (event: MouseEvent) => void
  onClickCapture: (event: MouseEvent) => void
  onContextmenuCapture: (event: MouseEvent) => void
}

export interface MdvTooltipTriggerSlotProps extends MdvTooltipSlotProps {
  /** 绑定到一个原生元素或根节点为原生元素的 Vue 组件。 */
  triggerProps: MdvTooltipTriggerProps
}
