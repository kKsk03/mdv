import { defineComponent, h, provide } from 'vue'
import type { InjectionKey, PropType } from 'vue'

export interface AppBarScaffoldContext {
  scrollTarget(): HTMLElement | null
  update(owner: HTMLElement, expanded: number, collapse: number, hidden: number): void
  remove(owner: HTMLElement): void
}

export const appBarScaffoldKey: InjectionKey<AppBarScaffoldContext> = Symbol('mdv-app-bar-scaffold')

/** 只向 appbar 插槽提供滚动目标，正文里的独立应用栏不继承它。 */
export const AppBarScaffoldHeader = defineComponent({
  name: 'MdvAppBarScaffoldHeader',
  props: {
    context: { type: Object as PropType<AppBarScaffoldContext>, required: true },
  },
  setup(props, { slots }) {
    provide(appBarScaffoldKey, props.context)
    return () => h('div', { class: 'mdv-app-bar-scaffold__appbar' }, slots.default?.())
  },
})

/** 在相邻 Standard Drawer 的圆角后方绘制应用栏背景，保留 Drawer 的形状与裁剪。 */
export function createAppBarDrawerBackground(element: () => HTMLElement | null) {
  let active = false
  let owner: HTMLElement | null = null
  let height = 0
  let drawer: HTMLElement | null = null
  let observer: MutationObserver | undefined
  let media: MediaQueryList | undefined
  let ancestors: HTMLElement[] = []

  function clear() {
    drawer?.style.removeProperty('--mdv-drawer-app-bar-background')
    drawer?.style.removeProperty('--mdv-drawer-app-bar-height')
    drawer = null
  }

  function paint() {
    if (!active) return
    const previous = element()?.previousElementSibling
    const next = previous?.classList.contains('mdv-navigation-drawer')
      ? (previous as HTMLElement)
      : null
    if (next !== drawer) {
      clear()
      drawer = next
    }
    const surface = owner?.querySelector<HTMLElement>(':scope > .mdv-app-bar__surface')
    const view = owner?.ownerDocument.defaultView
    if (!drawer || !surface || !view) {
      clear()
      return
    }
    const values = {
      '--mdv-drawer-app-bar-background': view.getComputedStyle(surface).backgroundColor,
      '--mdv-drawer-app-bar-height': `${height}px`,
    }
    for (const [name, value] of Object.entries(values)) {
      if (drawer.style.getPropertyValue(name) !== value) drawer.style.setProperty(name, value)
    }
  }

  function observe() {
    if (!observer) return
    const next: HTMLElement[] = []
    for (let node = owner ?? element(); node; node = node.parentElement) next.push(node)
    if (next.length === ancestors.length && next.every((node, index) => node === ancestors[index]))
      return
    observer.disconnect()
    ancestors = next
    for (const node of ancestors) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['class', 'style', 'dir', 'data-mdv-theme'],
        childList: node === element()?.parentElement,
      })
    }
  }

  function sync(source: HTMLElement | null, visible: number) {
    owner = source
    height = visible
    if (!active) return
    observe()
    paint()
  }

  function start() {
    const view = element()?.ownerDocument.defaultView
    if (active || !view) return
    active = true
    if (typeof view.MutationObserver === 'function') {
      observer = new view.MutationObserver(() => {
        observe()
        paint()
      })
    }
    // 颜色使用应用栏实际计算结果，不重写一套配色算法；主题变化也需更新圆角后的背景。
    media = view.matchMedia?.('(prefers-color-scheme: dark)')
    media?.addEventListener('change', paint)
    observe()
    paint()
  }

  function stop() {
    active = false
    observer?.disconnect()
    observer = undefined
    ancestors = []
    media?.removeEventListener('change', paint)
    media = undefined
    clear()
  }

  return { sync, start, stop }
}
