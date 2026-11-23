export interface MdvLoadingIndicatorProps {
  /** Shows the circular primary-container background. Defaults to false. */
  contained?: boolean
  /** Overall size in CSS pixels, clamped to 24–240. Defaults to 48. */
  size?: number
  /** Optional accessible name; omitted values do not get a fallback. */
  label?: string
  /** Freezes the current animation frame; resuming retains its phase. */
  paused?: boolean
  /** Hides the indicator from assistive technology when its owner already describes loading. */
  decorative?: boolean
}
