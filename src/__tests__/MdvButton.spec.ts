import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MdvButton from '../components/MdvButton.vue'

describe('MdvButton', () => {
  it('renders its slot and defaults to a non-submitting button', () => {
    const wrapper = mount(MdvButton, { slots: { default: '保存' } })

    expect(wrapper.text()).toBe('保存')
    expect(wrapper.get('button').attributes('type')).toBe('button')
  })

  it('applies the selected visual variant', () => {
    const wrapper = mount(MdvButton, { props: { variant: 'tonal' } })

    expect(wrapper.get('button').classes()).toContain('bg-mdv-secondary-container')
  })

  it('forwards native click listeners and disabled state', async () => {
    const onClick = vi.fn<(event: MouseEvent) => void>()
    const wrapper = mount(MdvButton, { attrs: { onClick } })

    await wrapper.get('button').trigger('click')
    expect(onClick).toHaveBeenCalledOnce()

    await wrapper.setProps({ disabled: true })
    await wrapper.get('button').trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })
})
