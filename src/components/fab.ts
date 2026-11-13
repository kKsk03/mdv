import {
  computed,
  inject,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  useAttrs,
  useTemplateRef,
} from 'vue'
import { useButtonRipple } from './button-ripple'
import { toolbarFabKey } from './fab-context'
import type { MdvFabProps } from './fab.types'

/** 两款 FAB 共用原生按钮／链接和状态层，不接管点击或导航。 */
export function useFab(props: Omit<MdvFabProps, 'size'>, iconOnly: boolean) {
  const attrs = useAttrs()
  const element = useTemplateRef<HTMLButtonElement | HTMLAnchorElement>('element')
  const surface = useTemplateRef<HTMLSpanElement>('surface')
  const context = inject(toolbarFabKey, null)
  const paired = iconOnly && context !== null
  const color = computed(() => props.color ?? (paired ? context!.color() : 'primary-container'))
  const isLink = computed(() => props.href != null)
  const offsetStyle = computed(() => ({
    '--mdv-fab-offset': `${Number.isFinite(props.offset) ? Math.max(0, props.offset!) : 16}px`,
  }))
  const ripple = useButtonRipple({
    disabled: () => element.value?.matches(':disabled, [aria-disabled="true"]') ?? false,
    isLink: () => isLink.value,
    surface: () => surface.value,
  })
  function clearRipple() {
    ripple.ripple.value = null
  }
  onDeactivated(clearRipple)
  onBeforeUnmount(clearRipple)

  function focus(options?: FocusOptions) {
    element.value?.focus(options)
  }
  function blur() {
    element.value?.blur()
  }

  if (import.meta.env.DEV && iconOnly) {
    let warned = false
    function checkName() {
      const named = ['aria-label', 'aria-labelledby'].some(
        (key) => typeof attrs[key] === 'string' && attrs[key].trim().length > 0,
      )
      if (!named && !warned)
        console.warn('[MDV] MdvFab: provide aria-label or aria-labelledby for its action.')
      warned = !named
    }
    onMounted(checkName)
    onUpdated(checkName)
  }
  return { attrs, element, surface, color, paired, isLink, offsetStyle, focus, blur, ...ripple }
}
