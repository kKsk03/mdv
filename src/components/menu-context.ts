import type { ComputedRef, InjectionKey, Ref, ShallowRef } from 'vue'
import type { ReferenceElement } from '@floating-ui/dom'
import type {
  MdvMenuCloseReason,
  MdvMenuColorScheme,
  MdvMenuLayout,
  MdvMenuModelValue,
  MdvMenuPlacement,
  MdvMenuSelectionMode,
  MdvMenuSubmenuMode,
  MdvMenuValue,
  MdvMenuVariant,
} from './menu.types'

export interface MenuItemEntry {
  element: () => HTMLElement | null
  text: () => string
  disabled: () => boolean
  open: () => void
  hasChildren: () => boolean
}

export interface MenuPanelContext {
  element: ShallowRef<HTMLElement | null>
  parent: MenuPanelContext | null
  trigger: () => HTMLElement | null
  child: ShallowRef<MenuPanelContext | null>
  active: Ref<boolean>
  visible: Ref<boolean>
  keyboard: Ref<boolean>
  focus: (edge?: 'first' | 'last') => void
  close: (restore?: boolean) => void
  closeChildren: (except?: MenuPanelContext) => void
  register: (item: MenuItemEntry) => () => void
  activate: () => void
  schedule: (action: () => void) => void
  cancelSchedule: () => void
  deferClose: (event: PointerEvent) => void
  protectsPointer: (event: PointerEvent) => boolean
}

export interface MenuTreeContext {
  id: string
  variant: ComputedRef<MdvMenuVariant>
  colorScheme: ComputedRef<MdvMenuColorScheme>
  layout: ComputedRef<MdvMenuLayout>
  submenuMode: ComputedRef<MdvMenuSubmenuMode>
  placement: ComputedRef<MdvMenuPlacement>
  offset: ComputedRef<number>
  anchor: ShallowRef<ReferenceElement | null>
  trigger: ShallowRef<HTMLElement | null>
  root: ShallowRef<MenuPanelContext | null>
  intent: Ref<'first' | 'last'>
  keyboard: Ref<boolean>
  close: (reason?: MdvMenuCloseReason, restore?: boolean) => void
  acquire: (panel: MenuPanelContext) => () => void
}

export interface MenuGroupContext {
  selectionMode: ComputedRef<MdvMenuSelectionMode>
  selected: (value: MdvMenuValue | undefined) => boolean
  select: (value: MdvMenuValue) => MdvMenuModelValue
}

export const menuTreeKey: InjectionKey<MenuTreeContext> = Symbol('mdv-menu-tree')
export const menuPanelKey: InjectionKey<MenuPanelContext | null> = Symbol('mdv-menu-panel')
export const menuGroupKey: InjectionKey<MenuGroupContext | null> = Symbol('mdv-menu-group')
