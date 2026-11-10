import { inject } from 'vue'
import { mdvSnackbarKey } from './snackbar-context'

export function useSnackbar() {
  const snackbar = inject(mdvSnackbarKey)
  if (!snackbar) {
    throw new Error('[MDV] useSnackbar() requires an ancestor <MdvSnackbarProvider>.')
  }
  return snackbar
}
