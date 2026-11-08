import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type {
  MdvRadioColor,
  MdvRadioModelValue,
  MdvRadioOrientation,
  MdvRadioValue,
} from './radio.types'

export interface MdvRadioRegistration {
  id: string
  value: Ref<MdvRadioValue>
  input: Ref<HTMLInputElement | null>
  disabled: ComputedRef<boolean>
}

export interface MdvRadioGroupContext {
  groupId: string
  model: Ref<MdvRadioModelValue>
  name: ComputedRef<string | undefined>
  form: ComputedRef<string | undefined>
  disabled: ComputedRef<boolean>
  required: ComputedRef<boolean>
  color: ComputedRef<MdvRadioColor | undefined>
  hasError: ComputedRef<boolean>
  descriptionId: ComputedRef<string | undefined>
  orientation: ComputedRef<MdvRadioOrientation>
  initialModel: MdvRadioModelValue
  register(radio: MdvRadioRegistration): () => void
  tabIndex(id: string, disabled: boolean): number
  isRequired(id: string, disabled: boolean): boolean
  select(value: MdvRadioValue): void
  handleKeydown(id: string, event: KeyboardEvent): void
  scheduleSync(): void
  reportInvalid(element: HTMLInputElement): void
  checkValidity(): boolean
  reportValidity(): boolean
  setCustomValidity(message: string): void
  isInitiallyChecked(value: MdvRadioValue): boolean
}

export const mdvRadioGroupKey: InjectionKey<MdvRadioGroupContext> = Symbol('mdv-radio-group')
