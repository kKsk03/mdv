import type { ComputedRef, InjectionKey } from 'vue'
import type { MdvTabValue, MdvTabsIconPosition, MdvTabsVariant } from './tabs.types'

export interface TabRegistration {
  value: () => MdvTabValue
  id: () => string
  element: () => HTMLButtonElement | null
  content: () => HTMLElement | null
  unavailable: () => boolean
}

export interface TabPanelRegistration {
  value: () => MdvTabValue
  element: () => HTMLElement | null
}

export interface TabsContext {
  variant: ComputedRef<MdvTabsVariant>
  iconPosition: ComputedRef<MdvTabsIconPosition>
  isSelected: (value: MdvTabValue) => boolean
  hasTab: (value: MdvTabValue) => boolean
  tabId: (value: MdvTabValue) => string
  labelId: (value: MdvTabValue) => string
  panelId: (value: MdvTabValue) => string
  tabIndex: (value: MdvTabValue) => number
  registerTab: (tab: TabRegistration) => () => void
  registerPanel: (panel: TabPanelRegistration) => () => void
  changed: () => void
  select: (value: MdvTabValue) => Promise<boolean>
  focused: (value: MdvTabValue) => void
  restoreFocus: (panel: HTMLElement) => void
}

export const mdvTabsKey: InjectionKey<TabsContext> = Symbol('mdv-tabs')
