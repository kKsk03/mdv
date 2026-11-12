export type MdvNavigationDrawerCloseReason =
  'action' | 'escape' | 'scrim' | 'select' | 'swipe' | 'model'

export interface MdvNavigationDrawerCloseDetail {
  reason: MdvNavigationDrawerCloseReason
}

export interface MdvNavigationDrawerProps {
  modelValue?: boolean
  title?: string
  /** CSS 长度，默认 360px，并受可用空间约束。 */
  width?: string
  beforeClose?: (
    detail: Readonly<MdvNavigationDrawerCloseDetail>,
  ) => boolean | void | Promise<boolean | void>
  destroyOnClose?: boolean
}

export interface MdvModalNavigationDrawerProps extends MdvNavigationDrawerProps {
  closeOnEsc?: boolean
  closeOnScrim?: boolean
  closeOnSelect?: boolean
  closeOnSwipe?: boolean
}

export interface MdvNavigationDrawerSlotProps {
  close: () => Promise<boolean>
}

export interface MdvNavigationDrawerItemProps {
  label: string
  href?: string
  active?: boolean
  disabled?: boolean
  badge?: string | number
}

export interface MdvNavigationDrawerItemSlotProps {
  active: boolean
}

export interface MdvNavigationDrawerGroupProps {
  label: string
  collapsible?: boolean
  expanded?: boolean
  disabled?: boolean
  divider?: boolean
}

export interface MdvNavigationDrawerGroupSlotProps {
  expanded: boolean
}
