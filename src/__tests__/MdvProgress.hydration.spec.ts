import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvCircularProgress from '../components/MdvCircularProgress.vue'
import MdvLinearProgress from '../components/MdvLinearProgress.vue'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe.each([
  { name: 'linear', component: MdvLinearProgress },
  { name: 'circular', component: MdvCircularProgress },
])('$name progress hydration', ({ component }) => {
  it.each([
    { variant: 'flat' as const, indeterminate: false },
    { variant: 'flat' as const, indeterminate: true },
    { variant: 'wavy' as const, indeterminate: false },
    { variant: 'wavy' as const, indeterminate: true },
  ])(
    'preserves $variant / indeterminate=$indeterminate nodes and accepts live updates without hydration warnings',
    async (initial) => {
      vi.stubGlobal('requestAnimationFrame', undefined)
      const value = ref(25)
      const indeterminate = ref(initial.indeterminate)
      const label = ref('正在上传')
      const Example = defineComponent({
        setup: () => () =>
          h(component, {
            value: value.value,
            max: 50,
            variant: initial.variant,
            indeterminate: indeterminate.value,
            label: label.value,
            'aria-describedby': 'transfer-help',
          }),
      })
      const container = document.createElement('div')
      container.innerHTML = await renderToString(createSSRApp(Example))
      document.body.append(container)
      const root = container.querySelector('[role="progressbar"]')!
      const graphic = container.querySelector('svg')!
      const paths = [...container.querySelectorAll('path')]
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const app = createSSRApp(Example)
      try {
        app.mount(container)
        await nextTick()
        expect(container.querySelector('[role="progressbar"]')).toBe(root)
        expect(container.querySelector('svg')).toBe(graphic)
        expect([...container.querySelectorAll('path')]).toEqual(paths)
        expect(root.getAttribute('aria-describedby')).toBe('transfer-help')
        value.value = 40
        indeterminate.value = false
        label.value = '处理文件'
        await nextTick()
        expect(root.getAttribute('aria-valuenow')).toBe('40')
        expect(root.getAttribute('aria-label')).toBe('处理文件')
        expect(container.querySelector('.mdv-progress__label')?.textContent).toBe('处理文件')
        expect(container.querySelector('svg')).toBe(graphic)
        expect(warning).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()
      } finally {
        app.unmount()
        container.remove()
      }
    },
  )
})
