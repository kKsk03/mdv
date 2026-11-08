import type { MdvButtonColor } from './button.types'

export type MdvRadioValue = string | number

export type MdvRadioModelValue = MdvRadioValue | null

/** 主题／语义色，或 #RGB／#RRGGBB 种子色。 */
export type MdvRadioColor = MdvButtonColor

export type MdvRadioOrientation = 'vertical' | 'horizontal'
