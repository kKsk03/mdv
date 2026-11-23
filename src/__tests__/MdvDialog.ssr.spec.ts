// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvDialog from '../components/MdvDialog.vue'
import MdvFullscreenDialog from '../components/MdvFullscreenDialog.vue'

describe('MdvDialog SSR', () => {
  it('renders stable labels without browser globals and leaves native modality to hydration', async () => {
    const Example = defineComponent({
      setup: () => () =>
        h('main', [
          h(MdvDialog, {
            title: '确认',
            description: '简短说明',
            modelValue: true,
          }),
          h(
            MdvFullscreenDialog,
            { title: '新建行程', modelValue: true, closeLabel: '关闭对话框' },
            {
              default: () =>
                h('form', [
                  h('label', { for: 'trip-title' }, '名称'),
                  h('input', { id: 'trip-title', autofocus: true }),
                ]),
              actions: () => h('button', { type: 'button' }, '保存'),
            },
          ),
        ]),
    })
    const render = () => renderToString(createSSRApp(Example))
    const html = await render()
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toBe(await render())
    expect(html.match(/<dialog\b/g)).toHaveLength(2)
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
    const labels = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1])
    expect(labels).toHaveLength(2)
    expect(new Set(labels).size).toBe(2)
    for (const label of labels) expect(html).toContain(`id="${label}"`)
    expect(html).toContain('role="alertdialog"')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-label="关闭对话框"')
    expect(html).not.toContain('teleport')
  })

  it('omits destroy-on-close content while closed and respects explicit naming of complex content', async () => {
    const closed = await renderToString(
      h(MdvDialog, { title: '延后挂载', destroyOnClose: true }, { default: () => h('input') }),
    )
    const form = await renderToString(
      h(
        MdvDialog,
        {
          title: '编辑',
          description: '备用描述',
          role: 'dialog',
          'aria-label': '编辑联系人',
        },
        { default: () => h('form', '复杂内容') },
      ),
    )
    expect(closed).not.toContain('mdv-dialog__container')
    expect(closed).not.toContain('<input')
    expect(form).toContain('role="dialog"')
    expect(form).toContain('aria-label="编辑联系人"')
    expect(form).not.toContain('aria-labelledby=')
    expect(form).not.toContain('aria-describedby=')
    expect(form).not.toContain('备用描述')
  })
})
