import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
} from 'vue'
import type { Ref } from 'vue'

interface SearchFocusState {
  keyboard: Ref<boolean>
  users: number
  stop: () => void
}

const documents = new WeakMap<Document, SearchFocusState>()

/** 输入框的 :focus-visible 也匹配鼠标聚焦；入口和展开输入共用实际导航来源。 */
export function useSearchKeyboardFocus(element: Readonly<Ref<HTMLElement | null>>) {
  const state = shallowRef<SearchFocusState>()
  let ownerDocument: Document | undefined

  function start() {
    if (state.value || !element.value) return
    ownerDocument = element.value.ownerDocument
    let shared = documents.get(ownerDocument)
    if (!shared) {
      const keyboard = ref(true)
      const pointerDown = () => {
        keyboard.value = false
      }
      const keyDown = (event: KeyboardEvent) => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.isComposing ||
          ['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)
        )
          return
        const target = event.target as Element | null
        const editing =
          target?.nodeType === 1 &&
          target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')
        // 鼠标进入后继续输入文字，不切换为键盘导航；Tab 或按钮键盘操作才切换。
        if (event.key === 'Tab' || !editing) keyboard.value = true
      }
      const owner = ownerDocument
      owner.addEventListener('pointerdown', pointerDown, true)
      owner.addEventListener('keydown', keyDown, true)
      shared = {
        keyboard,
        users: 0,
        stop: () => {
          owner.removeEventListener('pointerdown', pointerDown, true)
          owner.removeEventListener('keydown', keyDown, true)
        },
      }
      documents.set(owner, shared)
    }
    shared.users++
    state.value = shared
  }

  function stop() {
    const shared = state.value
    if (shared && --shared.users === 0 && ownerDocument) {
      shared.stop()
      documents.delete(ownerDocument)
    }
    state.value = undefined
    ownerDocument = undefined
  }

  onMounted(start)
  onActivated(start)
  onDeactivated(stop)
  onBeforeUnmount(stop)
  return computed(() => state.value?.keyboard.value ?? true)
}
