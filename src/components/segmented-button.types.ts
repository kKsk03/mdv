export type MdvSegmentedButtonValue = string | number

export type MdvSegmentedButtonModelValue =
  MdvSegmentedButtonValue | MdvSegmentedButtonValue[] | null

export type MdvSegmentedButtonSelection = 'single' | 'multiple'

/** 每档只减少可见高度 4px，实际点击目标始终至少为 48px。 */
export type MdvSegmentedButtonDensity = 0 | -1 | -2 | -3
