import { describe, expect, it } from 'vitest'
import { createCarouselLayout, nearestCarouselIndex } from '../components/carousel-layout'
import type { CarouselLayout } from '../components/carousel-layout'
import type { MdvCarouselVariant } from '../components/carousel.types'

function visible(layout: CarouselLayout, scroll: number) {
  return layout.itemSizes
    .map((_, index) => {
      const placement = layout.placement(index, scroll)
      return {
        start: placement.offset + placement.maskStart,
        end: placement.offset + placement.maskStart + placement.maskSize,
        size: placement.maskSize,
      }
    })
    .filter((placement) => placement.end > 0.01 && placement.start < layout.size - 0.01)
}
const options = {
  size: 348,
  crossSize: 200,
  count: 8,
  variant: 'multi-browse' as const,
  alignment: 'start' as const,
  itemSize: 186,
  gap: 8,
  reducedMotion: false,
}

describe('Carousel 关键线与边界', () => {
  it.each(['multi-browse', 'hero'] as const)(
    '%s 的首项／末项完整可见，每一项都能定位',
    (variant) => {
      const layout = createCarouselLayout({ ...options, variant })
      for (let index = 0; index < options.count; index++) {
        const placement = layout.placement(index, layout.snaps[index]!)
        expect(placement.maskSize).toBeCloseTo(placement.size, 3)
        expect(placement.offset + placement.maskStart).toBeGreaterThanOrEqual(-0.01)
        expect(placement.offset + placement.maskStart + placement.maskSize).toBeLessThanOrEqual(
          layout.size + 0.01,
        )
      }
      expect(visible(layout, 0)[0]!.start).toBeCloseTo(0, 3)
      const endItems = visible(layout, layout.maxScroll)
      expect(endItems[endItems.length - 1]!.end).toBeCloseTo(layout.size, 3)
    },
  )
  it.each(['start', 'center'] as const)(
    'Multi-browse 在 %s 对齐的滚动过程中保持 8px 间距',
    (alignment) => {
      const layout = createCarouselLayout({ ...options, alignment })
      for (let step = 0; step <= 24; step++) {
        const placements = visible(layout, (layout.maxScroll * step) / 24)
        for (let index = 1; index < placements.length; index++)
          expect(placements[index]!.start - placements[index - 1]!.end).toBeCloseTo(8, 2)
      }
    },
  )
  it('起始 Hero 与居中 Hero 不共用同一种默认排布', () => {
    const start = createCarouselLayout({ ...options, variant: 'hero', itemSize: 348 })
    const center = createCarouselLayout({
      ...options,
      variant: 'hero',
      itemSize: 348,
      alignment: 'center',
    })
    const position = center.placement(3, center.snaps[3]!)
    expect(position.offset + position.size / 2).toBeCloseTo(center.size / 2, 2)
    const previews = visible(center, center.snaps[3]!).filter(
      (item) => item.size < position.size - 1,
    )
    expect(previews).toHaveLength(2)
    previews.forEach((item) => {
      expect(item.size).toBeGreaterThanOrEqual(40)
      expect(item.size).toBeLessThanOrEqual(56)
    })
    expect(visible(start, start.snaps[3]!)).toHaveLength(2)
  })
  it('多宽高比保持媒体高度，宽度按 9:16–16:9 限制，并能到达尾部', () => {
    const layout = createCarouselLayout({
      ...options,
      variant: 'uncontained',
      size: 600,
      count: 4,
      ratios: [16 / 9, 9 / 16, 1, 8],
    })
    expect(layout.itemSizes).toEqual([(200 * 16) / 9, (200 * 9) / 16, 200, (200 * 16) / 9])
    expect(layout.placement(0, 0).offset).toBe(0)
    const end = layout.placement(3, layout.maxScroll)
    expect(end.offset + end.size).toBeCloseTo(layout.size, 3)
    expect(end.maskStart).toBe(0)
  })
  it('减弱动画保留同一大项尺寸，全程取消动态遮罩和展开', () => {
    const standard = createCarouselLayout(options)
    const reduced = createCarouselLayout({ ...options, reducedMotion: true })
    expect(new Set(reduced.itemSizes).size).toBe(1)
    expect(reduced.itemSizes[0]).toBe(standard.itemSizes[0])
    for (let index = 0; index < options.count; index++) {
      const placement = reduced.placement(index, reduced.maxScroll / 2)
      expect(placement.maskStart).toBe(0)
      expect(placement.maskSize).toBe(placement.size)
    }
  })
  it('Uncontained 等宽媒体也使用关键线遮罩，宽高比媒体维持独立宽度', () => {
    const layout = createCarouselLayout({
      ...options,
      variant: 'uncontained',
      size: 600,
      count: 4,
      itemSize: 186,
    })
    expect(new Set(layout.itemSizes).size).toBe(1)
    expect(layout.itemSizes[0]).toBeGreaterThan(186)
    expect(layout.maxScroll).toBeGreaterThan(0)

    const variable = createCarouselLayout({
      ...options,
      variant: 'uncontained',
      size: 600,
      count: 4,
      ratios: [16 / 9, 9 / 16, 1, 8],
    })
    expect(variable.itemSizes).toEqual([(200 * 16) / 9, (200 * 9) / 16, 200, (200 * 16) / 9])
    expect(variable.placement(0, 0).maskSize).toBe(variable.itemSizes[0])
  })
  it('Full-screen 每项与内容视口同高，并留出 16px 页间隔', () => {
    const layout = createCarouselLayout({ ...options, variant: 'full-screen', size: 560, gap: 16 })
    expect(layout.itemSizes).toEqual(Array.from({ length: 8 }, () => 560))
    expect(layout.snaps[1]).toBe(576)
    expect(layout.placement(7, layout.snaps[7]!).offset).toBe(0)
  })
  it.each([0, 1, 2])('%i 项不生成虚构项或负尺寸', (count) => {
    for (const variant of [
      'multi-browse',
      'hero',
      'uncontained',
      'full-screen',
    ] satisfies MdvCarouselVariant[]) {
      const layout = createCarouselLayout({
        ...options,
        count,
        variant,
        alignment: 'center',
        size: 60,
      })
      expect(layout.itemSizes).toHaveLength(count)
      expect(layout.maxScroll).toBeGreaterThanOrEqual(0)
      layout.itemSizes.forEach((size) => expect(size).toBeGreaterThan(0))
    }
  })
  it('多个项目共享停靠位置时仍保留请求的锚点', () => {
    const layout = createCarouselLayout({ ...options, count: 2, size: 800 })
    expect(layout.maxScroll).toBe(0)
    expect(nearestCarouselIndex(layout, 0, 1)).toBe(1)
  })
})
