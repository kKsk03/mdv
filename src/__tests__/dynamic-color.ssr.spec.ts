// @vitest-environment node

import { expect, it } from 'vitest'
import { createMdvColorScheme } from '../dynamic-color'

it('imports and generates colors without browser globals', () => {
  expect(typeof window).toBe('undefined')
  expect(typeof document).toBe('undefined')

  const scheme = createMdvColorScheme('#6750a4')

  expect(scheme.light.primary).toMatch(/^#[0-9a-f]{6}$/)
  expect(scheme.dark.primary).toMatch(/^#[0-9a-f]{6}$/)
})
