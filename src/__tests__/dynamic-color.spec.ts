import { describe, expect, it } from 'vitest'
import { applyMdvColorScheme, createMdvColorScheme } from '../dynamic-color'
import type { MdvColorRole } from '../dynamic-color'

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return channel(1) * 0.2126 + channel(3) * 0.7152 + channel(5) * 0.0722
}

function contrastRatio(first: string, second: string): number {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

describe('createMdvColorScheme', () => {
  it('returns both complete color schemes and normalizes the seed', () => {
    const scheme = createMdvColorScheme('#6750A4')
    const roles = Object.keys(scheme.light)

    expect(scheme.seed).toBe('#6750a4')
    expect(roles).toHaveLength(49)
    expect(Object.keys(scheme.dark)).toEqual(roles)
    expect(roles).toEqual(
      expect.arrayContaining([
        'primary',
        'on-primary',
        'secondary-container',
        'on-tertiary-container',
        'error',
        'on-error-container',
        'background',
        'on-background',
        'surface',
        'on-surface',
        'surface-variant',
        'on-surface-variant',
        'surface-dim',
        'surface-bright',
        'surface-container-lowest',
        'surface-container-low',
        'surface-container',
        'surface-container-high',
        'surface-container-highest',
        'surface-tint',
        'outline',
        'outline-variant',
        'inverse-surface',
        'inverse-on-surface',
        'inverse-primary',
        'scrim',
        'shadow',
        'primary-fixed',
        'on-secondary-fixed-variant',
        'tertiary-fixed-dim',
      ]),
    )

    for (const mode of ['light', 'dark'] as const) {
      for (const color of Object.values(scheme[mode])) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/)
      }
    }

    expect(scheme.light.primary).not.toBe(scheme.dark.primary)
    expect(scheme.light.surface).not.toBe(scheme.dark.surface)
  })

  it.each(['', '#123', '6750a4', '#12345678', ' #6750a4', '#12xz89', 'red'])(
    'rejects unsupported seed %j',
    (seed) => {
      expect(() => createMdvColorScheme(seed)).toThrow(TypeError)
    },
  )

  it.each(['#6750a4', '#ff0000', '#00ff00', '#0000ff', '#000000', '#ffffff'])(
    'maintains readable semantic foregrounds for %s in both modes',
    (seed) => {
      const scheme = createMdvColorScheme(seed)
      const pairs: [MdvColorRole, MdvColorRole][] = [
        ['primary', 'on-primary'],
        ['primary-container', 'on-primary-container'],
        ['secondary', 'on-secondary'],
        ['secondary-container', 'on-secondary-container'],
        ['tertiary', 'on-tertiary'],
        ['tertiary-container', 'on-tertiary-container'],
        ['error', 'on-error'],
        ['error-container', 'on-error-container'],
        ['surface', 'on-surface'],
        ['surface-container-highest', 'on-surface'],
        ['surface-variant', 'on-surface-variant'],
        ['inverse-surface', 'inverse-on-surface'],
        ['primary-fixed-dim', 'on-primary-fixed-variant'],
        ['secondary-fixed-dim', 'on-secondary-fixed-variant'],
        ['tertiary-fixed-dim', 'on-tertiary-fixed-variant'],
      ]

      for (const mode of ['light', 'dark'] as const) {
        for (const [background, foreground] of pairs) {
          expect(
            contrastRatio(scheme[mode][background], scheme[mode][foreground]),
          ).toBeGreaterThanOrEqual(4.5)
        }
      }

      const fixedRoles = (Object.keys(scheme.light) as MdvColorRole[]).filter((role) =>
        role.includes('fixed'),
      )

      for (const role of fixedRoles) {
        expect(scheme.light[role]).toBe(scheme.dark[role])
      }
    },
  )

  it('creates independent palettes for different seeds', () => {
    const purple = createMdvColorScheme('#6750a4')
    const green = createMdvColorScheme('#006c4c')

    expect(purple.light.primary).not.toBe(green.light.primary)
    expect(purple.dark.primary).not.toBe(green.dark.primary)
  })
})

describe('applyMdvColorScheme', () => {
  const purple = createMdvColorScheme('#6750a4')
  const green = createMdvColorScheme('#006c4c')

  it('writes both schemes and restores existing variables, priorities and attributes', () => {
    const target = document.createElement('section')
    target.setAttribute('data-mdv-theme', 'dark')
    target.setAttribute('data-mdv-color-scheme', 'existing')
    target.style.setProperty('--mdv-dynamic-light-color-primary', '#010203', 'important')
    target.style.setProperty('--mdv-sys-color-outline', '#123456')
    target.style.padding = '8px'
    const originalStyle = target.style.cssText

    const cleanup = applyMdvColorScheme(target, purple)

    expect(target.getAttribute('data-mdv-theme')).toBe('dark')
    expect(target.hasAttribute('data-mdv-color-scheme')).toBe(true)
    expect(target.style.getPropertyValue('--mdv-dynamic-light-color-primary')).toBe(
      purple.light.primary,
    )
    expect(target.style.getPropertyValue('--mdv-dynamic-dark-color-primary')).toBe(
      purple.dark.primary,
    )

    cleanup()
    cleanup()

    expect(target.style.cssText).toBe(originalStyle)
    expect(target.style.getPropertyPriority('--mdv-dynamic-light-color-primary')).toBe('important')
    expect(target.getAttribute('data-mdv-color-scheme')).toBe('existing')
    expect(target.getAttribute('data-mdv-theme')).toBe('dark')
  })

  it('uses the document root and removes its temporary scope marker', () => {
    const target = document.implementation.createHTMLDocument()
    const cleanup = applyMdvColorScheme(target, purple)

    expect(target.documentElement.style.getPropertyValue('--mdv-dynamic-dark-color-surface')).toBe(
      purple.dark.surface,
    )

    cleanup()

    expect(target.documentElement.style.length).toBe(0)
    expect(target.documentElement.hasAttribute('data-mdv-color-scheme')).toBe(false)
  })

  it('supports SVG scopes and keeps separate targets independent', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const section = document.createElement('section')
    const cleanupSvg = applyMdvColorScheme(svg, purple)
    const cleanupSection = applyMdvColorScheme(section, green)

    cleanupSvg()

    expect(svg.style.length).toBe(0)
    expect(section.style.getPropertyValue('--mdv-dynamic-light-color-primary')).toBe(
      green.light.primary,
    )

    cleanupSection()
    expect(section.style.length).toBe(0)
  })

  it('restores the preceding application when the latest one is cleaned up', () => {
    const target = document.createElement('section')
    const cleanupPurple = applyMdvColorScheme(target, purple)
    const cleanupGreen = applyMdvColorScheme(target, green)

    cleanupGreen()

    expect(target.style.getPropertyValue('--mdv-dynamic-light-color-primary')).toBe(
      purple.light.primary,
    )

    cleanupPurple()
    expect(target.style.length).toBe(0)
  })

  it('keeps a nested scope independent when the parent scheme is removed', () => {
    const parent = document.createElement('section')
    const child = document.createElement('section')
    parent.append(child)
    const cleanupParent = applyMdvColorScheme(parent, purple)
    const cleanupChild = applyMdvColorScheme(child, green)

    cleanupParent()

    expect(parent.hasAttribute('data-mdv-color-scheme')).toBe(false)
    expect(child.hasAttribute('data-mdv-color-scheme')).toBe(true)
    expect(child.style.getPropertyValue('--mdv-dynamic-dark-color-primary')).toBe(
      green.dark.primary,
    )

    cleanupChild()
    expect(child.style.length).toBe(0)
    expect(child.hasAttribute('data-mdv-color-scheme')).toBe(false)
  })

  it('keeps the active scheme when an earlier application is cleaned up first', () => {
    const target = document.createElement('section')
    const cleanupPurple = applyMdvColorScheme(target, purple)
    const cleanupGreen = applyMdvColorScheme(target, green)

    cleanupPurple()

    expect(target.style.getPropertyValue('--mdv-dynamic-light-color-primary')).toBe(
      green.light.primary,
    )

    cleanupGreen()
    cleanupPurple()

    expect(target.style.length).toBe(0)
    expect(target.hasAttribute('data-mdv-color-scheme')).toBe(false)
  })
})
