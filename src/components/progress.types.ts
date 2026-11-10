/** Material 3 progress indicator shape. */
export type MdvProgressVariant = 'flat' | 'wavy'

export interface MdvProgressProps {
  /** Current progress in the range 0–max. Defaults to 0. */
  value?: number
  /** Positive upper bound. Defaults to 100. */
  max?: number
  /** Displays unknown progress without exposing an invented current value. */
  indeterminate?: boolean
  /** Defaults to flat. */
  variant?: MdvProgressVariant
  /** Stroke width in CSS pixels. Defaults to 4. */
  thickness?: number
  /** Optional visible label, also used as the accessible name. */
  label?: string
}

export interface MdvCircularProgressProps extends MdvProgressProps {
  /** Diameter in CSS pixels. Defaults to 40 for flat, 48 for wavy. */
  size?: number
}
