import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MdvDatePicker from '../components/MdvDatePicker.vue'
import MdvDateRangePicker from '../components/MdvDateRangePicker.vue'
import MdvDialog from '../components/MdvDialog.vue'
import type { MdvDateRangeValue, MdvDateValue } from '../components/date-picker.types'
import { mockMenuPlatform } from './menu-test-platform'

let platform: ReturnType<typeof mockMenuPlatform>
const wrappers: VueWrapper[] = []
function track<T extends VueWrapper>(wrapper: T) {
  wrappers.push(wrapper)
  return wrapper
}
async function settle() {
  await flushPromises()
}
function entry(wrapper: VueWrapper, index = 0) {
  return wrapper.findAll<HTMLInputElement>('[data-date-entry]')[index]!
}
async function open(wrapper: Pick<VueWrapper, 'get'>) {
  await wrapper.get('button[aria-haspopup="dialog"]').trigger('click')
  await settle()
}
async function choose(wrapper: VueWrapper, date: string) {
  await wrapper.get(`[data-date="${date}"]`).trigger('click')
  await settle()
}
beforeEach(() => {
  platform = mockMenuPlatform()
  platform.media('(prefers-reduced-motion: reduce)', true)
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  platform.restore()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Date Picker 的提交与输入', () => {
  it('does not inject picker labels or a dialog name when labels are omitted', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14', layout: 'modal' },
      }),
    )
    await open(wrapper)
    expect(wrapper.get('[role="dialog"]').attributes('aria-labelledby')).toBeUndefined()
    expect(wrapper.find('[data-date-focus="cancel"]').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('[data-date-focus="view"]').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('[data-date-focus="cancel"] svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('[data-date-focus="confirm"] svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.mdv-date-picker__title').exists()).toBe(false)
  })
  it('输入聚焦不展开，Docked 选择只改草稿，取消丢弃，确定才提交', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14', layout: 'docked' },
      }),
    )
    entry(wrapper).element.focus()
    await settle()
    expect(platform.showPopover).not.toHaveBeenCalled()
    await open(wrapper)
    expect(platform.showPopover).toHaveBeenCalledTimes(1)
    expect(document.documentElement.style.overflow).toBe('')
    await choose(wrapper, '2026-11-18')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-date-focus="cancel"]').trigger('click')
    await settle()
    expect(entry(wrapper).element.value).toContain('14')
    expect(wrapper.emitted('cancel')?.[0]).toEqual([{ reason: 'cancel' }])
    await open(wrapper)
    await choose(wrapper, '2026-11-18')
    await wrapper.get('[data-date-focus="confirm"]').trigger('click')
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-18']])
    expect(wrapper.emitted('confirm')).toEqual([['2026-11-18']])
    expect(wrapper.get('[role="dialog"]').attributes('data-active')).toBeUndefined()
  })
  it('父级拒绝日期和打开请求时不伪造已接受状态', async () => {
    const update = vi.fn<(value: MdvDateValue) => void>()
    const openUpdate = vi.fn<(value: boolean) => void>()
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: {
          modelValue: '2026-11-14',
          'onUpdate:modelValue': update,
          open: false,
          'onUpdate:open': openUpdate,
        },
      }),
    )
    await open(wrapper)
    expect(openUpdate).toHaveBeenCalledWith(true)
    expect(wrapper.get('[role="dialog"]').attributes('data-active')).toBeUndefined()
    await entry(wrapper).setValue('2026/11/18')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await settle()
    expect(update).toHaveBeenCalledWith('2026-11-18')
    expect(entry(wrapper).element.value).toBe('2026/11/14')
    await wrapper.setProps({ open: true })
    await settle()
    await choose(wrapper, '2026-11-18')
    await wrapper.get('[data-date-focus="confirm"]').trigger('click')
    await settle()
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.get('[role="dialog"]').attributes('data-active')).toBe('true')
    expect(entry(wrapper).element.value).toBe('2026/11/14')
  })
  it('Enter 整理本地化输入，无效值保留原文并阻止原生校验', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { locale: 'en-GB', required: true },
      }),
    )
    await entry(wrapper).setValue('3.4.2026')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-04-03']])
    expect(entry(wrapper).element.value).toBe('03/04/2026')
    await entry(wrapper).setValue('31/2/2026')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await settle()
    expect(entry(wrapper).element.value).toBe('31/2/2026')
    expect(entry(wrapper).element.checkValidity()).toBe(false)
    expect(entry(wrapper).attributes('aria-invalid')).toBe('true')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })
  it('IME 的 Enter 不提交；组合结束后显式 Enter 才提交', async () => {
    const wrapper = track(mount(MdvDatePicker, { attachTo: document.body }))
    await entry(wrapper).trigger('compositionstart')
    await entry(wrapper).setValue('2026/11/14')
    await entry(wrapper).trigger('keydown', {
      key: 'Enter',
      isComposing: true,
    })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await entry(wrapper).trigger('compositionend')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await settle()
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-14']])
  })
  it('日历和输入切换保留草稿，Modal 确认写入纯日期', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14', layout: 'modal' },
      }),
    )
    await open(wrapper)
    await choose(wrapper, '2026-11-18')
    await wrapper.get('[data-date-focus="view"]').trigger('click')
    await settle()
    const input = wrapper.get<HTMLInputElement>('[data-date-focus="draft-start"]')
    expect(input.element.value).toBe('2026/11/18')
    await input.setValue('2026-11-20')
    await wrapper.get('[data-date-focus="view"]').trigger('click')
    await settle()
    expect(wrapper.get('[data-date="2026-11-20"]').classes()).toContain(
      'mdv-date-calendar__day--selected',
    )
    await wrapper.get('[data-date-focus="confirm"]').trigger('click')
    await settle()
    expect(wrapper.emitted('confirm')).toEqual([['2026-11-20']])
    expect(document.documentElement.style.overflow).toBe('')
  })
  it('动态限制重新校验已提交值，不擅自清空模型', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14' },
      }),
    )
    const input = entry(wrapper)
    const invalid = vi.fn<(event: Event) => boolean>((event) => event.defaultPrevented)
    input.element.addEventListener('invalid', invalid)
    await wrapper.setProps({ min: '2026-11-15' })
    expect(input.element.checkValidity()).toBe(false)
    expect(invalid).toHaveLastReturnedWith(true)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.mdv-text-field__supporting-text').exists()).toBe(false)
    await wrapper.setProps({ labels: { outOfBounds: '日期超出允许范围' } })
    expect(input.element.checkValidity()).toBe(false)
    expect(invalid).toHaveLastReturnedWith(false)
    expect(wrapper.get('.mdv-text-field__supporting-text').text()).toBe('日期超出允许范围')
    await wrapper.setProps({ labels: undefined })
    expect(input.element.checkValidity()).toBe(false)
    expect(wrapper.find('.mdv-text-field__supporting-text').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ min: '2026-11-14' })
    expect(input.element.checkValidity()).toBe(true)
  })
})

describe('Date Picker 的键盘、焦点与浮层', () => {
  it('Docked 补齐月外日期；月份列表只切换浏览月份，选中日期才修改草稿', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2025-08-17', layout: 'docked', locale: 'en-US', firstDayOfWeek: 0 },
      }),
    )
    await open(wrapper)
    expect(wrapper.findAll('[data-date]')).toHaveLength(42)
    expect(wrapper.get('[data-date="2025-07-31"]').classes()).toContain(
      'mdv-date-calendar__day--adjacent',
    )
    await wrapper.get('[data-date-focus="month"]').trigger('click')
    await settle()
    expect(wrapper.get('[data-date-focus="month"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-date-focus="year"]').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('.mdv-date-calendar__choice')).toHaveLength(12)
    expect(wrapper.get('[data-date-focus="month-8"]').attributes('aria-pressed')).toBe('true')
    await wrapper.get('[data-date-focus="month-7"]').trigger('click')
    await settle()
    expect(wrapper.get('[role="grid"]').attributes('aria-label')).toBe('July 2025')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await choose(wrapper, '2025-08-01')
    expect(wrapper.get('[role="grid"]').attributes('aria-label')).toBe('August 2025')
    expect(document.activeElement?.getAttribute('data-date')).toBe('2025-08-01')
    expect(wrapper.get('[data-date="2025-08-01"]').classes()).toContain(
      'mdv-date-calendar__day--selected',
    )
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-date-focus="confirm"]').trigger('click')
    await settle()
    expect(wrapper.emitted('confirm')).toEqual([['2025-08-01']])
  })
  it('Modal 使用本地化日期标题和合并的月年入口；输入模式显示独立标题', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: {
          modelValue: '2025-08-17',
          layout: 'modal',
          locale: 'en-US',
          labels: { input: '输入日期' },
        },
      }),
    )
    await open(wrapper)
    expect(wrapper.get('.mdv-date-picker__headline').text()).toBe('Sun, Aug 17')
    expect(wrapper.get('[data-date-focus="year"]').text()).toBe('August 2025')
    expect(wrapper.find('[data-date-focus="month"]').exists()).toBe(false)
    expect(wrapper.find('[data-date="2025-07-31"]').exists()).toBe(false)
    await wrapper.get('[data-date-focus="year"]').trigger('click')
    await settle()
    await wrapper.get('[data-date-focus="year-2024"]').trigger('click')
    await settle()
    expect(wrapper.get('[data-date-focus="year"]').text()).toBe('August 2024')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('[data-date-focus="view"]').trigger('click')
    await settle()
    expect(wrapper.get('.mdv-date-picker__headline').text()).toBe('输入日期')
    expect(wrapper.get<HTMLInputElement>('[data-date-focus="draft-start"]').element.value).toBe(
      '08/17/2025',
    )
  })
  it('日期边界的 Docked 月外单元保持空白，不重复钳位日期', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '0001-01-01', layout: 'docked', firstDayOfWeek: 0 },
      }),
    )
    await open(wrapper)
    expect(wrapper.findAll('[data-date="0001-01-01"]')).toHaveLength(1)
    expect(wrapper.findAll('[role="gridcell"]')[0]!.find('button').exists()).toBe(false)
    await wrapper.get('[data-date-focus="cancel"]').trigger('click')
    await settle()
    await wrapper.setProps({ modelValue: '9999-12-31' })
    await open(wrapper)
    expect(wrapper.findAll('[data-date="9999-12-31"]')).toHaveLength(1)
    const cells = wrapper.findAll('[role="gridcell"]')
    expect(cells[cells.length - 1]!.find('button').exists()).toBe(false)
  })
  it('日历只有一个 Tab 停点；翻年处理闰日，Home/End 按周移动，Enter 确认', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: {
          modelValue: '2024-02-29',
          firstDayOfWeek: 1,
          layout: 'docked',
        },
      }),
    )
    await open(wrapper)
    expect(wrapper.findAll('[data-date][tabindex="0"]')).toHaveLength(1)
    await wrapper
      .get('[data-date="2024-02-29"]')
      .trigger('keydown', { key: 'PageDown', shiftKey: true })
    await settle()
    expect(document.activeElement?.getAttribute('data-date')).toBe('2025-02-28')
    await wrapper.get('[data-date="2025-02-28"]').trigger('keydown', { key: 'Home' })
    await settle()
    expect(document.activeElement?.getAttribute('data-date')).toBe('2025-02-24')
    await wrapper.get('[data-date="2025-02-24"]').trigger('keydown', { key: 'End' })
    await settle()
    expect(document.activeElement?.getAttribute('data-date')).toBe('2025-03-02')
    await wrapper.get('[data-date="2025-03-02"]').trigger('keydown', { key: 'Enter' })
    await settle()
    expect(wrapper.emitted('confirm')).toEqual([['2025-03-02']])
  })
  it('auto 切换 Docked / 全屏时保留未提交日期及焦点，并释放滚动锁', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14' },
      }),
    )
    await open(wrapper)
    await choose(wrapper, '2026-11-18')
    wrapper.get<HTMLElement>('[data-date="2026-11-18"]').element.focus()
    platform.media('(max-width: 599px)', true)
    await settle()
    expect(wrapper.get('[role="dialog"]').element.tagName).toBe('DIALOG')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-11-18')
    platform.media('(max-width: 599px)', false)
    await settle()
    expect(wrapper.get('[role="dialog"]').element.tagName).toBe('DIV')
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-11-18')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
  it('Docked 外部聚焦关闭时保留目标焦点，Escape 返回日历入口', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14', layout: 'docked' },
      }),
    )
    await open(wrapper)
    outside.focus()
    await settle()
    expect(document.activeElement).toBe(outside)
    expect(wrapper.emitted('cancel')?.[0]).toEqual([{ reason: 'blur' }])
    await open(wrapper)
    await wrapper.get('[data-date="2026-11-14"]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(document.activeElement).toBe(wrapper.get('button[aria-haspopup="dialog"]').element)
  })
  it('年份选择页在 auto 布局切换后保留当前页面和焦点', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14' },
      }),
    )
    await open(wrapper)
    await wrapper.get('[data-date-focus="year"]').trigger('click')
    await settle()
    await wrapper.get('[data-date-focus="later-years"]').trigger('click')
    await settle()
    const choice = wrapper.findAll<HTMLElement>('.mdv-date-calendar__choice')[5]!
    const focusKey = choice.attributes('data-date-focus')
    choice.element.focus()
    platform.media('(max-width: 599px)', true)
    await settle()
    expect(document.activeElement?.getAttribute('data-date-focus')).toBe(focusKey)
    expect(wrapper.find('.mdv-date-calendar__chooser').exists()).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
  it('Docked 月份列表切换为全屏时保留浏览状态，并转到 Modal 年份选择', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { modelValue: '2026-11-14' },
      }),
    )
    await open(wrapper)
    await wrapper.get('[data-date-focus="month"]').trigger('click')
    await settle()
    expect(document.activeElement?.getAttribute('data-date-focus')).toBe('month-11')
    platform.media('(max-width: 599px)', true)
    await settle()
    expect(wrapper.get('[role="dialog"]').element.tagName).toBe('DIALOG')
    expect(wrapper.get('[data-date-focus="year"]').attributes('aria-expanded')).toBe('true')
    expect(document.activeElement?.getAttribute('data-date-focus')).toBe('year-2026')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
  it('模态 Tab 困焦；嵌套在 Dialog 中关闭日期面板后保留父模态', async () => {
    const Example = defineComponent({
      setup() {
        const outer = ref(true)
        return () =>
          h(
            MdvDialog,
            {
              modelValue: outer.value,
              title: '父对话框',
              'onUpdate:modelValue': (value: boolean) => {
                outer.value = value
              },
            },
            {
              default: () => h(MdvDatePicker, { modelValue: '2026-11-14', layout: 'modal' }),
            },
          )
      },
    })
    const wrapper = track(mount(Example, { attachTo: document.body }))
    await settle()
    await open(wrapper)
    const picker = wrapper.getComponent(MdvDatePicker)
    const confirm = picker.get<HTMLElement>('[data-date-focus="confirm"]')
    confirm.element.focus()
    await confirm.trigger('keydown', { key: 'Tab' })
    expect(picker.get('[role="dialog"]').element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).not.toBe(confirm.element)
    await picker.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(wrapper.get<HTMLDialogElement>('.mdv-dialog').element.open).toBe(true)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(picker.get('button[aria-haspopup="dialog"]').element)
  })
  it('readonly、禁用 fieldset 阻止打开，动态 disabled 释放当前模态', async () => {
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { readonly: true, layout: 'modal' },
      }),
    )
    expect(await wrapper.vm.open()).toBe(false)
    await wrapper.setProps({ readonly: false })
    const fieldset = document.createElement('fieldset')
    wrapper.element.parentNode?.insertBefore(fieldset, wrapper.element)
    fieldset.append(wrapper.element)
    fieldset.disabled = true
    expect(await wrapper.vm.open()).toBe(false)
    fieldset.disabled = false
    await open(wrapper)
    expect(document.documentElement.style.overflow).toBe('hidden')
    await wrapper.setProps({ disabled: true })
    await settle()
    expect(document.documentElement.style.overflow).toBe('')
  })
})

describe('Date Picker 的 Modal 动效生命周期', () => {
  it.each([false, true])('所有动画完成才 opened／closed（范围：%s）', async (range) => {
    platform.media('(prefers-reduced-motion: reduce)', false)
    platform.enableAnimations()
    const wrapper = track(
      mount(range ? MdvDateRangePicker : MdvDatePicker, {
        attachTo: document.body,
        props: { layout: 'modal' },
      }),
    )
    await open(wrapper)
    const dialog = wrapper.get<HTMLDialogElement>('[role="dialog"]')
    const scrim = wrapper.get('.mdv-date-picker__scrim').element
    const scrimMotion = platform.animations.find((animation) => animation.element === scrim)
    expect(scrimMotion).toBeDefined()
    for (const animation of platform.animations) {
      if (animation !== scrimMotion) animation.finish()
    }
    await settle()
    expect(wrapper.emitted('opened')).toBeUndefined()
    scrimMotion!.finish()
    await settle()
    expect(wrapper.emitted('opened')).toHaveLength(1)
    expect(dialog.attributes('data-state')).toBe('open')

    const previous = platform.animations.length
    await wrapper.get('[data-date-focus="cancel"]').trigger('click')
    await settle()
    expect(dialog.element.open).toBe(true)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(wrapper.emitted('closed')).toBeUndefined()
    for (const animation of platform.animations.slice(previous)) animation.finish()
    await settle()
    expect(dialog.element.open).toBe(false)
    expect(document.documentElement.style.overflow).toBe('')
    expect(wrapper.emitted('closed')).toEqual([[{ reason: 'cancel' }]])
  })

  it('关闭中重开保留草稿，减少动态效果时完成当前动画并清理模态', async () => {
    platform.media('(prefers-reduced-motion: reduce)', false)
    platform.enableAnimations()
    const wrapper = track(
      mount(MdvDatePicker, {
        attachTo: document.body,
        props: { open: true, layout: 'modal', modelValue: '2026-11-14' },
      }),
    )
    await settle()
    await choose(wrapper, '2026-11-18')
    await wrapper.setProps({ open: false })
    await settle()
    const previous = platform.animations.length
    await wrapper.setProps({ open: true })
    await settle()
    expect(platform.animations.length).toBeGreaterThan(previous)
    expect(platform.showModal).toHaveBeenCalledTimes(1)
    expect(wrapper.get('.mdv-date-picker__headline').text()).toContain('18')
    expect(wrapper.emitted('closed')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    platform.media('(prefers-reduced-motion: reduce)', true)
    await settle()
    expect(wrapper.emitted('opened')).toHaveLength(1)
    expect(wrapper.get('[role="dialog"]').attributes('data-state')).toBe('open')
    const count = platform.animations.length
    await wrapper.setProps({ open: false })
    await settle()
    expect(platform.animations).toHaveLength(count)
    expect(wrapper.emitted('closed')).toEqual([[{ reason: 'model' }]])
    expect(document.documentElement.style.overflow).toBe('')
  })
})

describe('Date Range Picker 与原生表单', () => {
  it('纵向多月选择完整范围，内部禁用日期阻止保存，不向外提交半个范围', async () => {
    const wrapper = track(
      mount(MdvDateRangePicker, {
        attachTo: document.body,
        props: {
          modelValue: { start: '2026-11-18', end: '2026-11-20' },
          disabledDate: (date: string) => date === '2026-11-16',
          labels: {
            incompleteRange: '请填写完整的开始和结束日期',
            blockedRange: '所选范围包含不可选择的日期',
          },
        },
      }),
    )
    await open(wrapper)
    expect(wrapper.findAll('[role="grid"]').length).toBeGreaterThan(1)
    expect(wrapper.findAll('.mdv-date-calendar__weekdays')).toHaveLength(1)
    expect(wrapper.find('.mdv-date-calendar__navigation').exists()).toBe(false)
    expect(wrapper.get('.mdv-date-picker__headline').text()).toBe('11月18日 – 11月20日')
    await choose(wrapper, '2026-11-14')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('.mdv-date-picker__status').classes()).toContain('mdv-date-picker__sr')
    expect(wrapper.get('.mdv-date-picker__status').text()).toContain('请填写完整的开始和结束日期')
    await choose(wrapper, '2026-11-18')
    expect(wrapper.get('[data-date-focus="confirm"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('所选范围包含不可选择的日期')
    expect(wrapper.get('.mdv-date-picker__status').classes()).not.toContain(
      'mdv-date-picker__status--error',
    )
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await choose(wrapper, '2026-11-20')
    await choose(wrapper, '2026-11-20')
    await wrapper.get('[data-date-focus="confirm"]').trigger('click')
    await settle()
    expect(wrapper.emitted('confirm')).toEqual([[{ start: '2026-11-20', end: '2026-11-20' }]])
  })
  it('范围日历隐藏底部红字，输入模式仍显示错误', async () => {
    const wrapper = track(
      mount(MdvDateRangePicker, {
        attachTo: document.body,
        props: {
          modelValue: { start: '2026-11-18', end: '2026-11-20' },
          disabledDate: (date: string) => date === '2026-11-16',
          labels: {
            blockedRange: '所选范围包含不可选择的日期',
            invalidDate: '请输入有效的公历日期和四位年份',
          },
        },
      }),
    )
    await open(wrapper)
    await choose(wrapper, '2026-11-14')
    await choose(wrapper, '2026-11-18')
    const status = wrapper.get('.mdv-date-picker__status')
    expect(status.classes()).toContain('mdv-date-picker__sr')
    expect(wrapper.get('[data-date-focus="confirm"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-date-focus="view"]').trigger('click')
    await settle()
    await wrapper.get('[data-date-focus="draft-start"]').setValue('2026/02/31')
    expect(status.classes()).not.toContain('mdv-date-picker__sr')
    expect(status.classes()).toContain('mdv-date-picker__status--error')
    expect(status.text()).toContain('请输入有效的公历日期和四位年份')
    expect(wrapper.get('[data-date-focus="confirm"]').attributes('disabled')).toBeDefined()
  })
  it('范围文本倒序保留原文；选择更早的第二端点会重新开始', async () => {
    const wrapper = track(
      mount(MdvDateRangePicker, {
        attachTo: document.body,
        props: {
          modelValue: { start: '2026-11-18', end: '2026-11-20' },
          labels: { reversedRange: '结束日期不能早于开始日期' },
        },
      }),
    )
    await entry(wrapper).setValue('2026/11/20')
    await entry(wrapper, 1).setValue('2026/11/18')
    await entry(wrapper, 1).trigger('keydown', { key: 'Enter' })
    await settle()
    expect(entry(wrapper, 1).element.value).toBe('2026/11/18')
    expect(wrapper.text()).toContain('结束日期不能早于开始日期')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await open(wrapper)
    await choose(wrapper, '2026-11-20')
    await choose(wrapper, '2026-11-18')
    expect(wrapper.get('[data-date="2026-11-18"]').classes()).toContain(
      'mdv-date-calendar__day--selected',
    )
    expect(wrapper.get('[data-date-focus="confirm"]').attributes('disabled')).toBeDefined()
  })
  it('FormData 只提交 ISO 隐藏字段，外部 form 关联和 reset 恢复初始接受值', async () => {
    const Example = defineComponent({
      setup() {
        const date = ref<MdvDateValue>('2026-11-14')
        const range = ref<MdvDateRangeValue>({
          start: '2026-11-18',
          end: '2026-11-20',
        })
        return () =>
          h('div', [
            h('form', { id: 'date-form' }),
            h(MdvDatePicker, {
              modelValue: date.value,
              'onUpdate:modelValue': (value: MdvDateValue) => {
                date.value = value
              },
              name: 'date',
              form: 'date-form',
              locale: 'en-GB',
              required: true,
            }),
            h(MdvDateRangePicker, {
              modelValue: range.value,
              'onUpdate:modelValue': (value: MdvDateRangeValue) => {
                range.value = value
              },
              startName: 'start',
              endName: 'end',
              form: 'date-form',
              layout: 'modal',
              initialView: 'input',
            }),
          ])
      },
    })
    const wrapper = track(mount(Example, { attachTo: document.body }))
    const form = wrapper.get<HTMLFormElement>('form').element
    expect([...new FormData(form)]).toEqual([
      ['date', '2026-11-14'],
      ['start', '2026-11-18'],
      ['end', '2026-11-20'],
    ])
    await entry(wrapper).setValue('21/11/2026')
    await entry(wrapper).trigger('keydown', { key: 'Enter' })
    await settle()
    expect(new FormData(form).get('date')).toBe('2026-11-21')
    const rangePicker = wrapper.getComponent(MdvDateRangePicker)
    await open(rangePicker)
    expect(
      rangePicker.get<HTMLInputElement>('[data-date-focus="draft-start"]').element.form,
    ).toBeNull()
    form.reset()
    await settle()
    expect(new FormData(form).get('date')).toBe('2026-11-14')
    expect(entry(wrapper).element.value).toBe('14/11/2026')
    expect(form.checkValidity()).toBe(true)
  })
})
