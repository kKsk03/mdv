export type MdvDialogCloseReason = 'escape' | 'scrim' | 'close-button' | 'action' | 'form' | 'model'

export interface MdvDialogCloseDetail {
  reason: MdvDialogCloseReason
  /** method="dialog" 表单提交按钮的 value，或 close() 传入的结果。 */
  returnValue: string
}

export type MdvDialogBeforeClose = (
  detail: Readonly<MdvDialogCloseDetail>,
) => boolean | void | Promise<boolean | void>

export interface MdvDialogProps {
  modelValue?: boolean
  title?: string
  description?: string
  closeOnEsc?: boolean
  closeOnScrim?: boolean
  beforeClose?: MdvDialogBeforeClose
  destroyOnClose?: boolean
}

export interface MdvFullscreenDialogProps extends Omit<MdvDialogProps, 'closeOnScrim'> {
  closable?: boolean
  closeLabel?: string
}

export interface MdvDialogSlotProps {
  /** 返回 true 表示父级已经接受关闭请求；退出动画可能仍在进行。 */
  close: (returnValue?: string) => Promise<boolean>
}
