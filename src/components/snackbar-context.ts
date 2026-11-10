import type { InjectionKey } from 'vue'
import type { MdvSnackbarProviderApi } from './snackbar.types'

export const mdvSnackbarKey: InjectionKey<MdvSnackbarProviderApi> = Symbol('mdv-snackbar')
