import type { MdvTooltipCloseReason } from './tooltip.types'

interface TooltipLayer {
  owner: HTMLElement
  trigger: HTMLElement
  rich: boolean
  contains: (target: EventTarget | null) => boolean
  dismiss: (reason: MdvTooltipCloseReason) => void
}

interface TooltipState {
  layer: TooltipLayer
  dispose: () => void
}

const documents = new WeakMap<Document, TooltipState>()
const menus = new WeakMap<Document, HTMLElement[]>()

function hasMenuAbove(layer: TooltipLayer) {
  const owners = menus.get(layer.owner.ownerDocument)
  const top = owners?.[owners.length - 1]
  return !!top && layer.owner.contains(top)
}

/** Rich 内新打开的菜单仍先处理自己的键盘，不被外层提示截走。 */
export function acquireTooltipMenuBoundary(owner: HTMLElement) {
  const doc = owner.ownerDocument
  const owners = menus.get(doc) ?? []
  menus.set(doc, owners)
  owners.push(owner)
  return () => {
    const index = owners.indexOf(owner)
    if (index >= 0) owners.splice(index, 1)
    if (!owners.length) menus.delete(doc)
  }
}

/** 同一 Document 只保留一个提示；既有菜单的 capture 监听也调用此入口。 */
export function dismissTooltipOnEscape(event: KeyboardEvent) {
  if (
    event.key !== 'Escape' ||
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229
  )
    return false
  const doc = (event.target as Node | null)?.ownerDocument
  const state = doc && documents.get(doc)
  if (!state || hasMenuAbove(state.layer)) return false
  event.preventDefault()
  event.stopPropagation()
  state.layer.dismiss('escape')
  return true
}

/** Rich 的 Tab 使用原 DOM 顺序，包含触发器到面板的第一步。 */
export function tooltipOwnsTab(event: KeyboardEvent) {
  if (event.key !== 'Tab') return false
  const doc = (event.target as Node | null)?.ownerDocument
  const layer = doc && documents.get(doc)?.layer
  return !!layer?.rich && !hasMenuAbove(layer) && layer.contains(event.target)
}

export function acquireTooltipLayer(doc: Document, layer: TooltipLayer) {
  documents.get(doc)?.layer.dismiss('replaced')
  // 被拒绝的受控更新也不能使两个提示同时进入 top layer。
  const previous = documents.get(doc)
  previous?.dispose()
  const keydown = (event: KeyboardEvent) => dismissTooltipOnEscape(event)
  const pointerdown = (event: PointerEvent) => {
    if (!layer.contains(event.target)) layer.dismiss('outside')
  }
  const focusin = (event: FocusEvent) => {
    if (!layer.contains(event.target)) layer.dismiss('focus-out')
  }
  const visibility = () => {
    if (doc.visibilityState === 'hidden') layer.dismiss('owner')
  }
  const blur = () => layer.dismiss('owner')
  doc.addEventListener('keydown', keydown, true)
  doc.addEventListener('pointerdown', pointerdown, true)
  doc.addEventListener('focusin', focusin)
  doc.addEventListener('visibilitychange', visibility)
  doc.defaultView?.addEventListener('blur', blur)
  let released = false
  const state: TooltipState = {
    layer,
    dispose() {
      if (released) return
      released = true
      doc.removeEventListener('keydown', keydown, true)
      doc.removeEventListener('pointerdown', pointerdown, true)
      doc.removeEventListener('focusin', focusin)
      doc.removeEventListener('visibilitychange', visibility)
      doc.defaultView?.removeEventListener('blur', blur)
      if (documents.get(doc) === state) documents.delete(doc)
    },
  }
  documents.set(doc, state)
  return state.dispose
}

export function dismissTooltipsWithin(owner: HTMLElement) {
  const layer = documents.get(owner.ownerDocument)?.layer
  if (layer && (owner.contains(layer.owner) || owner.contains(layer.trigger)))
    layer.dismiss('owner')
}

export function dismissTooltipsOutsideDialog(dialog: HTMLDialogElement) {
  const layer = documents.get(dialog.ownerDocument)?.layer
  if (layer && !dialog.contains(layer.trigger)) layer.dismiss('owner')
}
