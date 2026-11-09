import type { ComputedRef, InjectionKey } from 'vue'
import type { MdvChipSetSelection, MdvChipValue } from './chip.types'

export type ChipActionPart = 'primary' | 'remove'

export interface ChipAction {
  part: ChipActionPart
  element: HTMLButtonElement | HTMLAnchorElement
}

export interface ChipRegistration {
  id: string
  root(): HTMLElement | null
  actions(): ChipAction[]
  disabled(): boolean
  selected(): boolean
}

export interface ChipSetContext {
  disabled: ComputedRef<boolean>
  selection: ComputedRef<MdvChipSetSelection>
  isSelected(value: MdvChipValue | undefined): boolean
  toggle(value: MdvChipValue): void
  register(chip: ChipRegistration): () => void
  tabIndex(id: string, part: ChipActionPart): number
  syncTabIndices(): void
}

export const mdvChipSetKey: InjectionKey<ChipSetContext> = Symbol('mdv-chip-set')
