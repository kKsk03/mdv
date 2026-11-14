import {
  Strategy,
  fullScreenKeylineList,
  heroKeylineList,
  maxScrollOffset,
  multiBrowseKeylineList,
  placeItem,
  snapScrollOffset,
  uncontainedKeylineList,
} from './carousel-keylines'
import type { MdvCarouselAlignment, MdvCarouselVariant } from './carousel.types'

export interface CarouselPlacement {
  offset: number
  size: number
  maskStart: number
  maskSize: number
}

export interface CarouselLayout {
  size: number
  maxScroll: number
  maxItemSize: number
  snaps: number[]
  itemSizes: number[]
  placement: (index: number, scroll: number) => CarouselPlacement
}

export const clampCarousel = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const DEFAULT_ITEM_SIZE = 186
const isRatio = (ratio: number | undefined): ratio is number =>
  ratio !== undefined && Number.isFinite(ratio) && ratio > 0

export function createCarouselLayout(options: {
  size: number
  crossSize: number
  count: number
  variant: MdvCarouselVariant
  alignment: MdvCarouselAlignment
  itemSize?: number
  gap: number
  reducedMotion: boolean
  ratios?: readonly (number | undefined)[]
}): CarouselLayout {
  const size = Math.max(0, options.size)
  const count = Math.max(0, options.count)
  const gap = Number.isFinite(options.gap) ? Math.max(0, options.gap) : 8
  const full = options.variant === 'full-screen'
  const uncontained = options.variant === 'uncontained'
  const explicitSize =
    Number.isFinite(options.itemSize) && options.itemSize! > 0
      ? Math.min(options.itemSize!, Math.max(1, size))
      : undefined
  const preferred = explicitSize ?? (options.variant === 'hero' ? size : DEFAULT_ITEM_SIZE)
  const hasVariableRatios = uncontained && (options.ratios?.some(isRatio) ?? false)

  const keylines = full
    ? fullScreenKeylineList(size, gap)
    : uncontained
      ? uncontainedKeylineList(size, preferred, gap)
      : options.variant === 'hero'
        ? heroKeylineList(size, explicitSize ?? null, gap, count, options.alignment === 'center')
        : multiBrowseKeylineList(
            size,
            preferred,
            gap,
            count,
            40,
            56,
            options.alignment === 'center',
          )
  const strategy = new Strategy(keylines, size, gap, 0, 0)

  if (!hasVariableRatios && strategy.isValid && !options.reducedMotion) {
    const maxScroll = maxScrollOffset(strategy, count)
    return {
      size,
      maxScroll,
      maxItemSize: strategy.maxItemSize,
      snaps: Array.from({ length: count }, (_, index) => snapScrollOffset(strategy, index, count)),
      itemSizes: Array.from({ length: count }, () => strategy.itemMainAxisSize),
      placement(index, scroll) {
        const placement = placeItem(strategy, index, clampCarousel(scroll, 0, maxScroll), maxScroll)
        return { ...placement, size: strategy.itemMainAxisSize }
      },
    }
  }

  const itemSizes = Array.from({ length: count }, (_, index) => {
    const ratio = options.ratios?.[index]
    if (full) return size
    if (uncontained && isRatio(ratio)) {
      return Math.max(1, Math.min(size, options.crossSize * clampCarousel(ratio, 9 / 16, 16 / 9)))
    }
    const fallbackSize =
      uncontained && hasVariableRatios
        ? (explicitSize ?? DEFAULT_ITEM_SIZE)
        : strategy.itemMainAxisSize || preferred
    return Math.max(1, Math.min(size, fallbackSize))
  })
  const itemSize = itemSizes[0] ?? 0
  const before = 0
  const offsets: number[] = []
  let cursor = before
  for (const currentSize of itemSizes) {
    offsets.push(cursor)
    cursor += currentSize + gap
  }
  const total = count ? cursor - gap : 0
  const maxScroll = Math.max(0, total - size)
  const groupOffset =
    options.alignment === 'center' && !full && total < size ? (size - total) / 2 : 0
  const maxItemSize = itemSizes.reduce((maximum, currentSize) => Math.max(maximum, currentSize), 0)

  return {
    size,
    maxScroll,
    maxItemSize,
    itemSizes,
    snaps: offsets.map((offset, index) =>
      clampCarousel(
        full
          ? offset - before
          : options.alignment === 'center'
            ? offset + itemSizes[index]! / 2 - size / 2
            : offset - before,
        0,
        maxScroll,
      ),
    ),
    placement(index, scroll) {
      const currentSize = itemSizes[index] ?? itemSize
      return {
        offset: (offsets[index] ?? 0) + groupOffset - clampCarousel(scroll, 0, maxScroll),
        size: currentSize,
        maskStart: 0,
        maskSize: currentSize,
      }
    },
  }
}

/** 多个大项可能共享吸附位置；平局时保留请求的浏览锚点。 */
export function nearestCarouselIndex(layout: CarouselLayout, scroll: number, preferred = 0) {
  let result = Math.min(Math.max(0, preferred), Math.max(0, layout.snaps.length - 1))
  let distance = Infinity
  layout.snaps.forEach((snap, index) => {
    const next = Math.abs(snap - scroll)
    if (
      next < distance - 0.5 ||
      (Math.abs(next - distance) <= 0.5 &&
        Math.abs(index - preferred) < Math.abs(result - preferred))
    ) {
      result = index
      distance = next
    }
  })
  return result
}
