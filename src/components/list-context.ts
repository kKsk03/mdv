import type { ComputedRef, InjectionKey } from 'vue'
import type { MdvListSelectionMode, MdvListValue } from './list.types'

export interface ListRegistration {
  id: string
  value(): MdvListValue | undefined
  primary(): HTMLElement | null
  element(): HTMLLIElement | null
  focusable(): boolean
  disabled(): boolean
  selectable(): boolean
}

export interface ListContext {
  selectionMode: ComputedRef<MdvListSelectionMode>
  lines: ComputedRef<1 | 2 | 3 | undefined>
  isSelected(value: MdvListValue | undefined): boolean
  toggle(value: MdvListValue): void
  register(item: ListRegistration): () => void
  tabIndex(id: string, value: MdvListValue | undefined): number
  setTabStop(id: string): void
}

export const mdvListKey: InjectionKey<ListContext> = Symbol('mdv-list')
