export type MdvSelectValue = string | number
export type MdvSelectVariant = 'filled' | 'outlined'
export type MdvSelectMenuVariant = 'expressive' | 'baseline'
export type MdvAutocompleteFilterMode = 'local' | 'external'

export interface MdvSelectOption {
  value: MdvSelectValue
  label: string
  supportingText?: string
  disabled?: boolean
}

export interface MdvSelectBaseProps {
  modelValue?: MdvSelectValue | null
  options: readonly MdvSelectOption[]
  variant?: MdvSelectVariant
  menuVariant?: MdvSelectMenuVariant
  label?: string
  placeholder?: string
  supportingText?: string
  error?: boolean
  errorText?: string
  disabled?: boolean
  required?: boolean
  name?: string
  form?: string
  fullWidth?: boolean
  noOptionsText?: string
  open?: boolean
}

export type MdvSelectProps = MdvSelectBaseProps

export interface MdvAutocompleteProps extends MdvSelectBaseProps {
  filterMode?: MdvAutocompleteFilterMode
  loading?: boolean
  loadingText?: string
}

export interface MdvSelectOptionSlotProps {
  option: MdvSelectOption
  selected: boolean
  active: boolean
}
