import { dismissMenusOutsideDialog } from './menu-stack'
import { dismissTooltipsOutsideDialog, dismissTooltipsWithin } from './tooltip-layer'

interface ModalEntry {
  element: HTMLDialogElement
  focus: () => void
  previous: HTMLElement | null
}

interface ModalState {
  entries: ModalEntry[]
  unlock: () => void
  removeListeners: () => void
}

// 按 Document 隔离，模块导入和 SSR 渲染都不读取浏览器全局对象。
const documents = new WeakMap<Document, ModalState>()

function keepStyle(element: HTMLElement, property: string) {
  const value = element.style.getPropertyValue(property)
  const priority = element.style.getPropertyPriority(property)
  return () => {
    if (value) element.style.setProperty(property, value, priority)
    else element.style.removeProperty(property)
  }
}

function lockScroll(doc: Document) {
  const root = doc.documentElement
  const view = doc.defaultView
  // 只锁文档。修改 body overflow 会为 sticky 元素建立新的滚动祖先。
  const restore = ['overflow', 'overflow-x', 'overflow-y'].map((property) =>
    keepStyle(root, property),
  )
  const width = root.clientWidth
  const padding = Number.parseFloat(view?.getComputedStyle(root).paddingInlineEnd ?? '') || 0
  root.style.setProperty('overflow', 'hidden')
  const removedGap = width > 0 ? Math.max(0, root.clientWidth - width) : 0
  if (removedGap > 0) {
    restore.push(keepStyle(root, 'padding-inline-end'))
    root.style.setProperty('padding-inline-end', `${padding + removedGap}px`)
  }
  return () => restore.forEach((restoreProperty) => restoreProperty())
}

function available(element: HTMLElement, root: HTMLElement) {
  if (element.matches(':disabled, input[type="hidden"]') || element.closest('[hidden], [inert]')) {
    return false
  }
  const view = element.ownerDocument.defaultView
  let current: HTMLElement | null = element
  while (current) {
    const style = view?.getComputedStyle(current)
    if (style?.display === 'none' || style?.visibility === 'hidden') return false
    if (current.tagName === 'DETAILS' && !(current as HTMLDetailsElement).open) {
      const summary = current.querySelector(':scope > summary')
      if (!summary?.contains(element)) return false
    }
    if (current === root) break
    current = current.parentElement
  }
  return true
}

export function dialogTabStops(dialog: HTMLDialogElement) {
  const selector =
    'a[href], area[href], button, input, select, textarea, summary, iframe, object, embed, [tabindex], [contenteditable="true"]'
  const candidates = [...dialog.querySelectorAll<HTMLElement>(selector)].filter(
    (element) =>
      element.closest('dialog') === dialog && element.tabIndex >= 0 && available(element, dialog),
  )
  const stops = candidates.filter((element) => {
    if (element.tagName !== 'INPUT') return true
    const radio = element as HTMLInputElement
    if (radio.type !== 'radio' || !radio.name) return true
    const group = candidates.filter((candidate): candidate is HTMLInputElement => {
      if (candidate.tagName !== 'INPUT') return false
      const input = candidate as HTMLInputElement
      return input.type === 'radio' && input.name === radio.name && input.form === radio.form
    })
    return (group.find((input) => input.checked) ?? group[0]) === radio
  })
  return stops.sort((a, b) => {
    const orderA = a.tabIndex > 0 ? a.tabIndex : Number.MAX_SAFE_INTEGER
    const orderB = b.tabIndex > 0 ? b.tabIndex : Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })
}

export function focusDialog(dialog: HTMLDialogElement) {
  const autofocus = [...dialog.querySelectorAll<HTMLElement>('[autofocus]')].find(
    (element) => element.closest('dialog') === dialog && available(element, dialog),
  )
  ;(autofocus ?? dialogTabStops(dialog)[0] ?? dialog).focus({
    preventScroll: true,
  })
}

export function trapDialogTab(dialog: HTMLDialogElement, event: KeyboardEvent) {
  const stops = dialogTabStops(dialog)
  const active = dialog.ownerDocument.activeElement
  const index = stops.findIndex((element) => element === active)
  if (!stops.length) {
    event.preventDefault()
    dialog.focus({ preventScroll: true })
  } else if (event.shiftKey && index <= 0) {
    event.preventDefault()
    stops[stops.length - 1]?.focus({ preventScroll: true })
  } else if (!event.shiftKey && (index < 0 || index === stops.length - 1)) {
    event.preventDefault()
    stops[0]?.focus({ preventScroll: true })
  }
}

export function acquireDialog(dialog: HTMLDialogElement) {
  const doc = dialog.ownerDocument
  dismissTooltipsOutsideDialog(dialog)
  const previous = dismissMenusOutsideDialog(dialog) ?? (doc.activeElement as HTMLElement | null)
  let state = documents.get(doc)
  if (!state) {
    const entries: ModalEntry[] = []
    let redirecting = false
    const focusin = (event: FocusEvent) => {
      const top = entries[entries.length - 1]
      if (!top || !top.element.open || redirecting) return
      if (event.composedPath().includes(top.element)) return
      redirecting = true
      try {
        top.focus()
      } finally {
        redirecting = false
      }
    }
    doc.addEventListener('focusin', focusin)
    state = {
      entries,
      unlock: lockScroll(doc),
      removeListeners: () => doc.removeEventListener('focusin', focusin),
    }
    documents.set(doc, state)
  }
  const current = state
  const entry: ModalEntry = {
    element: dialog,
    focus: () => focusDialog(dialog),
    previous,
  }
  current.entries.push(entry)
  let released = false
  let restore = false

  return {
    isTop: () => current.entries[current.entries.length - 1] === entry,
    release() {
      if (released) return
      released = true
      dismissTooltipsWithin(dialog)
      const index = current.entries.indexOf(entry)
      restore = index === current.entries.length - 1
      if (index >= 0) {
        for (const later of current.entries.slice(index + 1)) {
          if (later.previous && dialog.contains(later.previous)) later.previous = entry.previous
        }
      }
      if (index >= 0) current.entries.splice(index, 1)
      if (!current.entries.length) {
        current.removeListeners()
        current.unlock()
        documents.delete(doc)
      }
    },
    restoreFocus() {
      if (!released || !restore) return
      restore = false
      const top = documents.get(doc)?.entries.slice(-1)[0]
      const previous = entry.previous
      if (
        previous?.isConnected &&
        typeof previous.focus === 'function' &&
        !previous.matches(':disabled') &&
        !previous.closest('[hidden], [inert]') &&
        (!top || top.element.contains(previous))
      ) {
        previous.focus({ preventScroll: true })
        if (doc.activeElement === previous) return
      }
      top?.focus()
    },
  }
}

export function topDialog(doc: Document) {
  const entries = documents.get(doc)?.entries
  return entries?.[entries.length - 1]?.element ?? null
}
