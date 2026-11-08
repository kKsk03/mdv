// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { CSSProperties } from 'vue'
import {
  resolveButtonColor,
  resolveCheckboxColor,
  resolveIconButtonColor,
} from '../components/button-color'
import { createMdvColorScheme } from '../dynamic-color'

function readPair(value: unknown): [string, string] {
  const match =
    typeof value === 'string' && /^light-dark\((#[\da-f]{6}), (#[\da-f]{6})\)$/.exec(value)
  if (!match || !match[1] || !match[2]) throw new Error(`Expected paired colors, received ${value}`)
  return [match[1], match[2]]
}

function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channel = (offset: number) => {
      const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }
    return channel(1) * 0.2126 + channel(3) * 0.7152 + channel(5) * 0.0722
  }
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function contrastRatios(style: Readonly<CSSProperties>): number[] {
  const main = readPair(style['--mdv-button-color'])
  const onMain = readPair(style['--mdv-button-on-color'])
  const container = readPair(style['--mdv-button-container-color'])
  const onContainer = readPair(style['--mdv-button-on-container-color'])
  const ratios: number[] = []

  for (const mode of [0, 1] as const) {
    ratios.push(contrastRatio(main[mode], onMain[mode]))
    ratios.push(contrastRatio(container[mode], onContainer[mode]))
    const surfaces = mode === 0 ? ['#fef7ff', '#f7f2fa'] : ['#141218', '#1d1b20']
    for (const surface of surfaces) {
      ratios.push(contrastRatio(main[mode], surface))
    }
  }
  return ratios
}

describe('button color resolution', () => {
  it.each(['success', '#06C'])(
    'shares the %s seed and theme roles with Checkbox without leaking button variables',
    (color) => {
      const button = resolveButtonColor(color)
      const checkbox = resolveCheckboxColor(color)
      expect(checkbox).toBeDefined()
      expect(Object.isFrozen(checkbox)).toBe(true)
      expect(resolveCheckboxColor(color)).toBe(checkbox)
      expect(checkbox?.['--mdv-checkbox-color']).toBe(button?.['--mdv-button-color'])
      expect(checkbox?.['--mdv-checkbox-on-color']).toBe(button?.['--mdv-button-on-color'])
      expect(checkbox?.['--mdv-button-color']).toBeUndefined()
      expect(resolveCheckboxColor('#invalid')).toBeUndefined()
    },
  )

  it.each(['success', '#06C'])(
    'shares the %s color roles across both button kinds with separate CSS variables',
    (color) => {
      const button = resolveButtonColor(color)
      const icon = resolveIconButtonColor(color)

      expect(button).toBeDefined()
      expect(icon).toBeDefined()
      expect(Object.isFrozen(icon)).toBe(true)
      expect(resolveIconButtonColor(color)).toBe(icon)
      for (const role of ['color', 'on-color', 'container-color', 'on-container-color']) {
        expect(icon?.[`--mdv-icon-button-${role}`]).toBe(button?.[`--mdv-button-${role}`])
        expect(icon?.[`--mdv-button-${role}`]).toBeUndefined()
      }
      expect(resolveIconButtonColor('#invalid')).toBeUndefined()
    },
  )

  it('keeps preset colors as theme references for inherited and locally overridden themes', () => {
    const style = resolveButtonColor('error')

    expect(style).toMatchObject({
      '--mdv-button-color': 'var(--mdv-sys-color-error)',
      '--mdv-button-on-color': 'var(--mdv-sys-color-on-error)',
      '--mdv-button-container-color': 'var(--mdv-sys-color-error-container)',
      '--mdv-button-on-container-color': 'var(--mdv-sys-color-on-error-container)',
    })
  })

  it.each([
    undefined,
    null,
    42,
    false,
    {},
    '',
    'toString',
    'red',
    '#abcd',
    '#12345678',
    '#xyz',
    ' #abc',
  ])('leaves the official default colors in place for unsupported input %j', (color) => {
    expect(resolveButtonColor(color)).toBeUndefined()
  })

  it('normalizes short and mixed-case seeds and safely shares immutable cached colors', () => {
    const short = resolveButtonColor('#06C')
    const full = resolveButtonColor('#0066cc')

    expect(short).toBeDefined()
    expect(short).toBe(full)
    expect(Object.isFrozen(short)).toBe(true)
    expect(resolveButtonColor('#ff0000')).not.toBe(short)
  })

  it.each(['#006c4c', '#6750a4', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000', '#ffffff'])(
    'matches the global standard-contrast Tonal Spot primary family and stays readable for %s',
    (seed) => {
      const style = resolveButtonColor(seed)
      if (!style) throw new Error('Expected seed colors')
      const scheme = createMdvColorScheme(seed)

      expect(readPair(style['--mdv-button-color'])).toEqual([
        scheme.light.primary,
        scheme.dark.primary,
      ])
      expect(readPair(style['--mdv-button-on-color'])).toEqual([
        scheme.light['on-primary'],
        scheme.dark['on-primary'],
      ])
      expect(readPair(style['--mdv-button-container-color'])).toEqual([
        scheme.light['primary-container'],
        scheme.dark['primary-container'],
      ])
      expect(readPair(style['--mdv-button-on-container-color'])).toEqual([
        scheme.light['on-primary-container'],
        scheme.dark['on-primary-container'],
      ])
      for (const ratio of contrastRatios(style)) {
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it.each(['success', 'warning', 'info'])(
    'provides readable static %s tokens in both modes without a runtime seed',
    (preset) => {
      const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')
      const token = (role: string) => {
        const value = new RegExp(`--mdv-sys-color-${role}:\\s*([^;]+);`).exec(css)?.[1]
        return value?.trim()
      }

      const ratios = contrastRatios({
        '--mdv-button-color': token(preset),
        '--mdv-button-on-color': token(`on-${preset}`),
        '--mdv-button-container-color': token(`${preset}-container`),
        '--mdv-button-on-container-color': token(`on-${preset}-container`),
      })
      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      }
    },
  )
})
