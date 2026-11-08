export type MdvTextFieldVariant = 'filled' | 'outlined'

export type MdvTextFieldType = 'text' | 'password' | 'email' | 'tel' | 'url' | 'search' | 'number'

export type MdvTextFieldValue = string | number

export type MdvTextFieldModelModifiers = Partial<Record<'trim' | 'number' | 'lazy', boolean>>
