import type { ComputedRef, InjectionKey } from 'vue'
import type { MdvButtonShape, MdvButtonSize } from './button.types'
import type {
  MdvButtonGroupDensity,
  MdvButtonGroupSelection,
  MdvButtonGroupValue,
  MdvButtonGroupVariant,
} from './button-group.types'

export interface ButtonGroupMember {
  element(): HTMLElement | null
  surface(): HTMLElement | null
  content(): HTMLElement | null
  value(): MdvButtonGroupValue | undefined
  disabled(): boolean
  selected(): boolean
  pressed(): boolean
  shape(): MdvButtonShape
  size(): MdvButtonSize
  release(): void
}

interface ButtonGroupContext {
  variant: ComputedRef<MdvButtonGroupVariant>
  selection: ComputedRef<MdvButtonGroupSelection>
  size: ComputedRef<MdvButtonSize>
  shape: ComputedRef<MdvButtonShape>
  density: ComputedRef<MdvButtonGroupDensity>
  disabled: ComputedRef<boolean>
  selected(value: MdvButtonGroupValue | undefined): boolean
  toggle(value: MdvButtonGroupValue): void
  register(member: ButtonGroupMember): () => void
  animate(): void
  refresh(): void
}

export const mdvButtonGroupKey: InjectionKey<ButtonGroupContext> = Symbol('mdv-button-group')
