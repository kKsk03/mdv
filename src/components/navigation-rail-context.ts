import type { ComputedRef, InjectionKey } from 'vue'

export interface NavigationRailContext {
  expanded: ComputedRef<boolean>
  select: (event: MouseEvent) => void
}

export const navigationRailKey: InjectionKey<NavigationRailContext> = Symbol('mdv-navigation-rail')
