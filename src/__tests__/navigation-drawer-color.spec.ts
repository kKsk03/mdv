// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(new URL('../styles/styles.css', import.meta.url), 'utf8')
const drawerStyles = readFileSync(
  new URL('../styles/navigation-drawer.css', import.meta.url),
  'utf8',
)
const themeStyles = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

function declarationBlock(source: string, selector: string) {
  const start = source.indexOf(selector)
  if (start < 0) throw new Error(`Missing CSS rule: ${selector}`)
  const opening = source.indexOf('{', start)
  const closing = source.indexOf('}', opening)
  if (opening < 0 || closing < 0) throw new Error(`Invalid CSS rule: ${selector}`)
  return source.slice(opening + 1, closing)
}

describe('Navigation Drawer foreground painting', () => {
  it('routes standard and active row colors through a registered paint alias', () => {
    const property = declarationBlock(styles, '@property --mdv-drawer-paint-foreground')
    expect(property).toContain("syntax: '<color>'")
    expect(property).toContain('inherits: false')

    const tokenTransition = declarationBlock(
      themeStyles,
      ':where(:root, [data-mdv-theme], [data-mdv-color-scheme])',
    )
    expect(tokenTransition).not.toContain('--mdv-drawer-paint-foreground')

    const row = declarationBlock(drawerStyles, '.mdv-navigation-drawer__row {')
    expect(row).toContain('--mdv-drawer-paint-foreground: var(--mdv-sys-color-on-surface-variant);')
    expect(row).toContain('color: var(--mdv-drawer-paint-foreground);')
    expect(row).not.toContain('color: var(--mdv-sys-color-on-surface-variant);')

    const activeRow = declarationBlock(drawerStyles, '.mdv-navigation-drawer__row--active {')
    expect(activeRow).toContain(
      '--mdv-drawer-paint-foreground: var(--mdv-sys-color-on-secondary-container);',
    )
    expect(activeRow).not.toContain('color: var(--mdv-sys-color-on-secondary-container);')

    const disabledRow = declarationBlock(drawerStyles, '.mdv-navigation-drawer__row--disabled {')
    expect(disabledRow).toContain('--mdv-drawer-paint-foreground: color-mix(')
    expect(disabledRow).not.toContain('color: color-mix(')
  })
})
