import { argbFromHex, Hct, hexFromArgb, TonalPalette } from '@material/material-color-utilities'
import type { CSSProperties } from 'vue'
import type { MdvButtonColor } from './button.types'

type ColorPreset = Exclude<MdvButtonColor, `#${string}`>

const presets = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'info'] as const
const presetStyles = new Map<ColorPreset, Readonly<CSSProperties>>(
  presets.map((preset) => [
    preset,
    Object.freeze({
      '--mdv-button-color': `var(--mdv-sys-color-${preset})`,
      '--mdv-button-on-color': `var(--mdv-sys-color-on-${preset})`,
      '--mdv-button-container-color': `var(--mdv-sys-color-${preset}-container)`,
      '--mdv-button-on-container-color': `var(--mdv-sys-color-on-${preset}-container)`,
    }),
  ]),
)

// 只缓存局部种子色的四组角色；限制容量，避免长期编辑色号时无限增长。
const seedStyles = new Map<string, Readonly<CSSProperties>>()
const maxCachedSeeds = 64

/** 按钮内部配色；纯计算，无 DOM、主题监听或全局主题写入。 */
export function resolveButtonColor(color: unknown): Readonly<CSSProperties> | undefined {
  if (typeof color !== 'string') return undefined

  const preset = presetStyles.get(color as ColorPreset)
  if (preset) return preset
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) return undefined

  const seed = (
    color.length === 4
      ? `#${Array.from(color.slice(1), (channel) => channel + channel).join('')}`
      : color
  ).toLowerCase()
  const cached = seedStyles.get(seed)
  if (cached) {
    seedStyles.delete(seed)
    seedStyles.set(seed, cached)
    return cached
  }

  // 与全局 Tonal Spot／2021／标准对比度的 primary 色系一致。
  // 只用 HCT 和 TonalPalette，不生成完整 DynamicScheme 或 49 个全局角色。
  const source = Hct.fromInt(argbFromHex(seed))
  const palette = TonalPalette.fromHueAndChroma(source.hue, 36)
  const paired = (lightTone: number, darkTone: number) =>
    `light-dark(${hexFromArgb(palette.tone(lightTone))}, ${hexFromArgb(palette.tone(darkTone))})`
  const style = Object.freeze({
    '--mdv-button-color': paired(40, 80),
    '--mdv-button-on-color': paired(100, 20),
    '--mdv-button-container-color': paired(90, 30),
    '--mdv-button-on-container-color': paired(30, 90),
  })

  if (seedStyles.size >= maxCachedSeeds) {
    const oldest = seedStyles.keys().next().value
    if (oldest !== undefined) seedStyles.delete(oldest)
  }
  seedStyles.set(seed, style)
  return style
}
