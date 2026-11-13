import type { ComputedRef, InjectionKey } from 'vue'
import type { MdvFabMenuVariant } from './fab-menu.types'

export interface FabMenuContext {
  variant: ComputedRef<MdvFabMenuVariant>
  close(): void
}

export const fabMenuKey: InjectionKey<FabMenuContext> = Symbol('mdv-fab-menu')
