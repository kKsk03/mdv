import type { InjectionKey } from 'vue'
import type { MdvFabColor } from './fab.types'

export const toolbarFabKey: InjectionKey<{ color: () => MdvFabColor }> = Symbol('mdv-toolbar-fab')
