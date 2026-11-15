export interface MdvLoadingIndicatorProps {
  /** Shows the circular primary-container background. Defaults to false. */
  contained?: boolean
  /** Overall size in CSS pixels, clamped to 24–240. Defaults to 48. */
  size?: number
  /** Accessible name, without visible text. Defaults to 加载中. */
  label?: string
  /** Freezes the current animation frame; resuming retains its phase. */
  paused?: boolean
  /** Hides the indicator from assistive technology when its owner already describes loading. */
  decorative?: boolean
}
