import type { ComputedRef, InjectionKey } from 'vue'
import type { MdvSegmentedButtonSelection, MdvSegmentedButtonValue } from './segmented-button.types'

export interface SegmentedButtonRegistration {
  id: string
  value(): MdvSegmentedButtonValue
  input(): HTMLInputElement | null
  disabled(): boolean
  activating(): boolean
}

export interface SegmentedButtonContext {
  selection: ComputedRef<MdvSegmentedButtonSelection>
  disabled: ComputedRef<boolean>
  name: ComputedRef<string | undefined>
  form: ComputedRef<string | undefined>
  showSelectedIcon: ComputedRef<boolean>
  isSelected(value: MdvSegmentedButtonValue): boolean
  isInitiallySelected(value: MdvSegmentedButtonValue): boolean
  isCurrentlySelected(value: MdvSegmentedButtonValue): boolean
  canDeselect(value: MdvSegmentedButtonValue): boolean
  setSelected(value: MdvSegmentedButtonValue, selected: boolean): boolean
  register(item: SegmentedButtonRegistration): () => void
  tabIndex(id: string): number
  scheduleSync(): void
  syncForm(): void
  handleKeydown(event: KeyboardEvent): void
}

export const mdvSegmentedButtonKey: InjectionKey<SegmentedButtonContext> =
  Symbol('mdv-segmented-button')
