import type { VNode } from 'vue'

export type MdvCarouselKey = string | number
export type MdvCarouselVariant = 'multi-browse' | 'uncontained' | 'hero' | 'full-screen'
export type MdvCarouselAlignment = 'start' | 'center'
export type MdvCarouselFlingBehavior = 'auto' | 'single-advance' | 'multi-browse' | 'no-snap'
export type MdvCarouselChangeReason =
  'drag' | 'wheel' | 'keyboard' | 'control' | 'item' | 'programmatic' | 'items'

export interface MdvCarouselItem {
  key: MdvCarouselKey
  src?: string
  alt?: string
  label?: string
  href?: string
  target?: string
  rel?: string
  disabled?: boolean
  /** 仅 Uncontained 使用；媒体宽／高比，限制在 9:16 至 16:9。 */
  aspectRatio?: number
}

export interface MdvCarouselLabels {
  carousel: string
  slide: string
  previous: string
  next: string
  skip: string
  empty: string
  /** 可覆盖项序号文案，index 从 0 开始。 */
  item: (index: number, count: number) => string
}

export interface MdvCarouselProps<T extends object = MdvCarouselItem> {
  items: readonly T[]
  /** 浏览锚点的稳定 key；undefined 为非受控，null 表示没有指定锚点。 */
  modelValue?: MdvCarouselKey | null
  /** 默认读取 key 字段；每一项必须具有唯一、有效的稳定 key。 */
  itemKey?: keyof T | ((item: T) => MdvCarouselKey)
  variant?: MdvCarouselVariant
  alignment?: MdvCarouselAlignment
  /** Multi-browse／Hero 的首选大项宽；Uncontained 使用其固定项宽。默认 186px，Hero 省略时尽量填满容器。 */
  itemSize?: number
  /** 内容视口高度；普通布局默认 205px，全屏默认填充容器。 */
  height?: number | string
  /** 默认普通布局 8px、Full-screen 16px。 */
  gap?: number
  flingBehavior?: MdvCarouselFlingBehavior
  /** 关闭用户拖动／滚轮，保留键盘与外置控制。 */
  userScrollEnabled?: boolean
  /** 默认横向显示外置控制；Full-screen 默认不显示。 */
  showControls?: boolean
  labels?: Partial<MdvCarouselLabels>
}

export interface MdvCarouselNavigateOptions {
  animate?: boolean
  /** 定位后聚焦项目；带焦点的定位直接显露目标，避免焦点落入裁切区域。 */
  focus?: boolean
}

export interface MdvCarouselChangeDetail<T extends object = MdvCarouselItem> {
  key: MdvCarouselKey | null
  index: number
  item: T | undefined
  reason: MdvCarouselChangeReason
}

export interface MdvCarouselControlsSlotProps {
  key: MdvCarouselKey | null
  index: number
  count: number
  canPrevious: boolean
  canNext: boolean
  previous: () => Promise<boolean>
  next: () => Promise<boolean>
}

export interface MdvCarouselItemSlotProps<T extends object = MdvCarouselItem> {
  item: T
  index: number
  active: boolean
}

export interface MdvCarouselSlots<T extends object = MdvCarouselItem> {
  item?: (props: MdvCarouselItemSlotProps<T>) => VNode[]
  header?: (props: MdvCarouselControlsSlotProps) => VNode[]
  controls?: (props: MdvCarouselControlsSlotProps) => VNode[]
  empty?: () => VNode[]
}

export interface MdvCarouselExpose {
  /** 返回请求是否被接受；不表示动画已经结束。 */
  scrollTo: (key: MdvCarouselKey, options?: MdvCarouselNavigateOptions) => Promise<boolean>
  next: (options?: MdvCarouselNavigateOptions) => Promise<boolean>
  prev: (options?: MdvCarouselNavigateOptions) => Promise<boolean>
  focus: (options?: FocusOptions) => void
  readonly element: HTMLElement | null
}
