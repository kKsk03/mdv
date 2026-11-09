import type { MdvButtonColor } from './button.types'

export type MdvChipVariant = 'assist' | 'filter' | 'input' | 'suggestion'

export type MdvChipColor = MdvButtonColor

export type MdvChipValue = string | number

export type MdvChipSetSelection = 'none' | 'single' | 'multiple'

export type MdvChipSetModelValue = MdvChipValue | MdvChipValue[] | null
