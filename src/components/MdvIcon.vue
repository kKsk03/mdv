<script setup lang="ts">
import { computed, normalizeStyle, useAttrs, watch } from 'vue'
import type { CSSProperties, StyleValue } from 'vue'
import { Icon } from '@iconify/vue/offline'
import type { MdvIconData, MdvIconSize } from './icon.types'

defineOptions({ name: 'MdvIcon', inheritAttrs: false })

const props = defineProps<{
  /** 本地图标数据对象，不接受会触发名称解析的字符串。 */
  icon: MdvIconData
  /** 独立使用默认 24px；省略时跟随按钮的图标容器尺寸。 */
  size?: MdvIconSize
  /** 直接使用 CSS 颜色；省略时继承 currentColor，不执行种子色计算。 */
  color?: string
}>()

const attrs = useAttrs()
const validIcon = computed(
  () =>
    props.icon !== null && typeof props.icon === 'object' && typeof props.icon.body === 'string',
)
const emptyIcon: MdvIconData = { body: '', width: 24, height: 24 }
const iconData = computed(() => (validIcon.value ? props.icon : emptyIcon))

if (import.meta.env.DEV) {
  watch(
    () => props.icon,
    () => {
      if (!validIcon.value) {
        console.warn('[MDV] MdvIcon: icon must be a local SVG data object with a string body.')
      }
    },
    { immediate: true },
  )
}

// useAttrs 的值每次渲染读取，确保只修改 ARIA 或 style 时也能即时更新。
function rootAttrs() {
  const result: Record<string, unknown> = { role: 'img', focusable: 'false', ...attrs }
  const hasName = ['aria-label', 'aria-labelledby'].some(
    (key) => typeof attrs[key] === 'string' && attrs[key].trim().length > 0,
  )
  const hidden = attrs['aria-hidden'] ?? attrs.ariaHidden ?? !hasName
  delete result.style
  delete result.ariaHidden
  result['aria-hidden'] = hidden
  return result
}

function rootStyle() {
  const style: CSSProperties = {}
  if (props.size !== undefined) {
    const size = typeof props.size === 'number' ? `${props.size}px` : props.size
    style.width = size
    style.height = size
  }
  if (props.color !== undefined) style.color = props.color
  // Iconify 接收对象样式；先统一原生字符串／数组写法，用户样式优先。
  return normalizeStyle([style, attrs.style as StyleValue])
}
</script>

<template>
  <Icon
    v-bind="rootAttrs()"
    :icon="iconData"
    mode="svg"
    :width="props.size ?? 24"
    :height="props.size ?? 24"
    :style="rootStyle()"
    class="mdv-icon"
  />
</template>
