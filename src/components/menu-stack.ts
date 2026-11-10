interface MenuLayer {
  owner: HTMLElement
  contains: (target: EventTarget | null) => boolean
  escape: () => void
  tab: (backward: boolean) => boolean
  dismiss: (reason: 'outside' | 'focus-out') => void
  restoreTarget: () => HTMLElement | null
}

interface MenuStack {
  layers: MenuLayer[]
  dispose: () => void
}

const documents = new WeakMap<Document, MenuStack>()

/** 只在菜单展开时监听；Escape／Tab 在 Dialog 的冒泡处理前完成。 */
export function acquireMenuLayer(doc: Document, layer: MenuLayer) {
  let stack = documents.get(doc)
  if (!stack) {
    const layers: MenuLayer[] = []
    const keydown = (event: KeyboardEvent) => {
      const top = layers[layers.length - 1]
      if (!top || event.defaultPrevented || event.isComposing || event.keyCode === 229) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        top.escape()
      } else if (event.key === 'Tab' && top.tab(event.shiftKey)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const pointerdown = (event: PointerEvent) => {
      const top = layers[layers.length - 1]
      if (top && !top.contains(event.target)) top.dismiss('outside')
    }
    const focusin = (event: FocusEvent) => {
      const top = layers[layers.length - 1]
      if (top && !top.contains(event.target)) top.dismiss('focus-out')
    }
    doc.addEventListener('keydown', keydown, true)
    doc.addEventListener('pointerdown', pointerdown, true)
    doc.addEventListener('focusin', focusin)
    stack = {
      layers,
      dispose() {
        doc.removeEventListener('keydown', keydown, true)
        doc.removeEventListener('pointerdown', pointerdown, true)
        doc.removeEventListener('focusin', focusin)
      },
    }
    documents.set(doc, stack)
  }
  const current = stack
  current.layers.push(layer)
  let released = false
  return () => {
    if (released) return
    released = true
    const index = current.layers.indexOf(layer)
    if (index >= 0) current.layers.splice(index, 1)
    if (!current.layers.length) {
      current.dispose()
      documents.delete(doc)
    }
  }
}

/** 新模态层出现时，关闭其范围外的菜单；焦点交由新 Dialog 接管。 */
export function dismissMenusOutsideDialog(dialog: HTMLDialogElement) {
  const layers = documents.get(dialog.ownerDocument)?.layers.slice() ?? []
  let previous: HTMLElement | null = null
  for (const layer of layers) {
    if (!dialog.contains(layer.owner)) {
      if (layer.contains(dialog.ownerDocument.activeElement)) previous = layer.restoreTarget()
      layer.dismiss('outside')
    }
  }
  return previous
}
