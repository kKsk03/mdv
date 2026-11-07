export type MdvButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text' | 'link'

/** 主题色／MDV 语义色，或 #RGB／#RRGGBB 种子色；十六进制格式在运行时校验。 */
export type MdvButtonColor =
  'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | `#${string}`

export type MdvButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl'

export type MdvButtonShape = 'round' | 'square'

export type MdvButtonType = 'button' | 'submit' | 'reset'
