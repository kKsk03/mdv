import type { ComputedRef, InjectionKey } from 'vue'

export const navigationDrawerKey: InjectionKey<{ select: (event: MouseEvent) => void }> =
  Symbol('mdv-navigation-drawer')
export const navigationDrawerDepthKey: InjectionKey<ComputedRef<number>> = Symbol(
  'mdv-navigation-drawer-depth',
)

export function drawerAvailable(item: HTMLElement, root: HTMLElement) {
  if (item.matches(':disabled, [aria-disabled="true"]') || item.closest('[hidden], [inert]'))
    return false
  const view = item.ownerDocument.defaultView
  for (let node: HTMLElement | null = item; node; node = node.parentElement) {
    const style = view?.getComputedStyle(node)
    if (style?.display === 'none' || style?.visibility === 'hidden') return false
    if (node === root) break
  }
  return true
}
