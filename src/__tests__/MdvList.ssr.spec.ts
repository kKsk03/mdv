// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MdvList from '../components/MdvList.vue'
import MdvListItem from '../components/MdvListItem.vue'
import MdvListSubheader from '../components/MdvListSubheader.vue'

describe('MdvList SSR', () => {
  it('renders deterministic semantic markup without browser globals', async () => {
    const render = () =>
      renderToString(
        h(MdvList, { selectionMode: 'single', modelValue: 'account', dividers: 'inset' }, () => [
          h(MdvListSubheader, { inset: true }, () => '账户'),
          h(MdvListItem, {
            value: 'account',
            headline: '账户设置',
            supportingText: '管理登录方式',
          }),
        ]),
      )
    const html = await render()

    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(html).toContain('<ul')
    expect(html).toContain('mdv-list--dividers-inset')
    expect(html).toContain('mdv-list-subheader--inset')
    expect(html).toContain('role="listbox"')
    expect(html).toContain('role="option"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('账户设置')
    expect(html).toBe(await render())
  })

  it('renders links with native targets and omits empty supporting regions', async () => {
    const html = await renderToString(
      h(MdvList, null, () =>
        h(MdvListItem, {
          href: '/help',
          target: '_blank',
          rel: 'noopener',
          headline: '帮助中心',
        }),
      ),
    )

    expect(html).toContain('<a')
    expect(html).toContain('href="/help"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener"')
    expect(html).not.toContain('mdv-list-item__supporting')
  })

  it('renders a segmented run with subheaders and presentational controls before mounting', async () => {
    const render = () =>
      renderToString(
        h(MdvList, { layout: 'segmented', selectionMode: 'single', modelValue: 2 }, () => [
          h(MdvListItem, { value: 1, headline: '第一项', leading: 'checkbox' }),
          h(MdvListItem, { value: 2, headline: '第二项', trailing: 'switch' }),
          h(MdvListSubheader, null, () => '下一组'),
          h(MdvListItem, { value: 3, headline: '第三项', trailing: 'radio' }),
        ]),
      )
    const html = await render()
    expect(html).toBe(await render())
    expect(html).toContain('mdv-list--segmented')
    expect(html).toContain('mdv-list-item__control--checkbox')
    expect(html).toContain('mdv-list-item__control--switch')
    expect(html).toContain('mdv-list-item__control--radio')
    expect(html).not.toContain('<input')
    expect(html.match(/role="option"/g)).toHaveLength(3)
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
  })

  it('gives a custom content slot a real accessible label target', async () => {
    const html = await renderToString(
      h(
        MdvListItem,
        { interactive: true },
        {
          content: () => h('span', '自定义正文'),
          'trailing-action': () => h('button', { type: 'button' }, '更多'),
        },
      ),
    )
    const labelId = html.match(/aria-labelledby="([^"]+)"/)?.[1]
    expect(labelId).toBeTruthy()
    expect(html).toContain('id="' + labelId + '"')
    expect(html).toContain('自定义正文')
    expect(html.match(/<button\b/g)).toHaveLength(2)
  })
})
