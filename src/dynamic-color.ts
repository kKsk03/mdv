import {
  argbFromHex,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeTonalSpot,
} from '@material/material-color-utilities'

const colorRoleMethods = {
  primary: 'primary',
  'on-primary': 'onPrimary',
  'primary-container': 'primaryContainer',
  'on-primary-container': 'onPrimaryContainer',
  secondary: 'secondary',
  'on-secondary': 'onSecondary',
  'secondary-container': 'secondaryContainer',
  'on-secondary-container': 'onSecondaryContainer',
  tertiary: 'tertiary',
  'on-tertiary': 'onTertiary',
  'tertiary-container': 'tertiaryContainer',
  'on-tertiary-container': 'onTertiaryContainer',
  error: 'error',
  'on-error': 'onError',
  'error-container': 'errorContainer',
  'on-error-container': 'onErrorContainer',
  background: 'background',
  'on-background': 'onBackground',
  surface: 'surface',
  'on-surface': 'onSurface',
  'surface-variant': 'surfaceVariant',
  'on-surface-variant': 'onSurfaceVariant',
  'surface-dim': 'surfaceDim',
  'surface-bright': 'surfaceBright',
  'surface-container-lowest': 'surfaceContainerLowest',
  'surface-container-low': 'surfaceContainerLow',
  'surface-container': 'surfaceContainer',
  'surface-container-high': 'surfaceContainerHigh',
  'surface-container-highest': 'surfaceContainerHighest',
  'surface-tint': 'surfaceTint',
  outline: 'outline',
  'outline-variant': 'outlineVariant',
  'inverse-surface': 'inverseSurface',
  'inverse-on-surface': 'inverseOnSurface',
  'inverse-primary': 'inversePrimary',
  scrim: 'scrim',
  shadow: 'shadow',
  'primary-fixed': 'primaryFixed',
  'primary-fixed-dim': 'primaryFixedDim',
  'on-primary-fixed': 'onPrimaryFixed',
  'on-primary-fixed-variant': 'onPrimaryFixedVariant',
  'secondary-fixed': 'secondaryFixed',
  'secondary-fixed-dim': 'secondaryFixedDim',
  'on-secondary-fixed': 'onSecondaryFixed',
  'on-secondary-fixed-variant': 'onSecondaryFixedVariant',
  'tertiary-fixed': 'tertiaryFixed',
  'tertiary-fixed-dim': 'tertiaryFixedDim',
  'on-tertiary-fixed': 'onTertiaryFixed',
  'on-tertiary-fixed-variant': 'onTertiaryFixedVariant',
} as const satisfies Record<string, keyof MaterialDynamicColors>

export type MdvColorRole = keyof typeof colorRoleMethods

export interface MdvColorScheme {
  readonly seed: string
  readonly light: Readonly<Record<MdvColorRole, string>>
  readonly dark: Readonly<Record<MdvColorRole, string>>
}

const roles = Object.keys(colorRoleMethods) as MdvColorRole[]
const modes = ['light', 'dark'] as const

/**
 * 从 #RRGGBB 种子色生成标准对比度的 MD3 Tonal Spot 浅色和深色配色。
 * 纯计算函数，可在服务端调用；输入无效时抛出 TypeError。
 */
export function createMdvColorScheme(seed: string): MdvColorScheme {
  if (typeof seed !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(seed)) {
    throw new TypeError('MDV: seed must be a hexadecimal color in #RRGGBB format.')
  }

  const source = Hct.fromInt(argbFromHex(seed))
  const colors = new MaterialDynamicColors()

  const generate = (isDark: boolean) => {
    // 固定算法规范和平台，避免依赖默认值变化导致同一种子色改变。
    const scheme = new SchemeTonalSpot(source, isDark, 0, '2021', 'phone')
    const result = {} as Record<MdvColorRole, string>

    for (const role of roles) {
      result[role] = hexFromArgb(colors[colorRoleMethods[role]]().getArgb(scheme))
    }

    return Object.freeze(result)
  }

  return Object.freeze({
    seed: seed.toLowerCase(),
    light: generate(false),
    dark: generate(true),
  })
}

interface ColorProperty {
  name: string
  value: string
  priority: string
}

interface ColorApplication {
  properties: ColorProperty[]
}

interface ColorScope {
  originalProperties: ColorProperty[]
  originalMarker: string | null
  applications: ColorApplication[]
}

// 按目标元素隔离应用记录，不保存跨应用共享的当前主题。
const scopes = new WeakMap<HTMLElement | SVGElement, ColorScope>()
const scopeAttribute = 'data-mdv-color-scheme'

function writeProperties(target: HTMLElement | SVGElement, properties: ColorProperty[]) {
  for (const { name, value, priority } of properties) {
    if (value) {
      target.style.setProperty(name, value, priority)
    } else {
      target.style.removeProperty(name)
    }
  }
}

/**
 * 把两套配色应用到一个主题作用域；Document 使用其 documentElement。
 * 保留 data-mdv-theme，由 CSS 决定当前模式。调用方需加载 mdv/theme。
 *
 * 返回可重复调用的清理函数，恢复此前的配色和内联变量优先级。
 * 同一目标可多次应用，最后一份未清理的配色生效。
 */
export function applyMdvColorScheme(
  target: HTMLElement | SVGElement | Document,
  scheme: MdvColorScheme,
): () => void {
  const element = 'documentElement' in target ? target.documentElement : target

  if (!element) {
    throw new TypeError('MDV: the target document must have a documentElement.')
  }

  const properties = modes.flatMap((mode) =>
    roles.map((role) => ({
      name: `--mdv-dynamic-${mode}-color-${role}`,
      value: scheme[mode][role],
      priority: '',
    })),
  )

  const scope: ColorScope = scopes.get(element) ?? {
    originalProperties: properties.map(({ name }) => ({
      name,
      value: element.style.getPropertyValue(name),
      priority: element.style.getPropertyPriority(name),
    })),
    originalMarker: element.getAttribute(scopeAttribute),
    applications: [],
  }
  scopes.set(element, scope)

  const application = { properties }
  scope.applications.push(application)
  writeProperties(element, properties)
  element.setAttribute(scopeAttribute, '')

  let disposed = false

  return () => {
    if (disposed) return
    disposed = true

    const index = scope.applications.indexOf(application)
    const wasActive = index === scope.applications.length - 1
    scope.applications.splice(index, 1)

    if (!wasActive) return

    const previous = scope.applications[scope.applications.length - 1]

    if (previous) {
      writeProperties(element, previous.properties)
      return
    }

    writeProperties(element, scope.originalProperties)

    if (scope.originalMarker === null) {
      element.removeAttribute(scopeAttribute)
    } else {
      element.setAttribute(scopeAttribute, scope.originalMarker)
    }

    scopes.delete(element)
  }
}
