import type { MdvButtonColor } from './button.types'

export type MdvCheckboxValue = string | number

export type MdvCheckboxModelValue = boolean | MdvCheckboxValue[]

/** 主题／语义色，或 #RGB／#RRGGBB 种子色。 */
export type MdvCheckboxColor = MdvButtonColor
