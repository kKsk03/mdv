<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue'
import { loadingIndicatorFrame, loadingIndicatorSize } from './loading-indicator-geometry'
import { useLoadingIndicatorMotion } from './loading-indicator-motion'
import type { MdvLoadingIndicatorProps } from './loading-indicator.types'

defineOptions({ name: 'MdvLoadingIndicator', inheritAttrs: false })

const props = withDefaults(defineProps<MdvLoadingIndicatorProps>(), {
  contained: false,
  size: 48,
  label: '加载中',
  paused: false,
  decorative: false,
})
const attrs = useAttrs()
const size = computed(() => loadingIndicatorSize(props.size))
const initial = loadingIndicatorFrame(0)
const root = useTemplateRef<HTMLElement>('root')
const rotor = useTemplateRef<SVGGElement>('rotor')
const path = useTemplateRef<SVGPathElement>('path')

useLoadingIndicatorMotion(() => props.paused, { root, rotor, path })

function rootAttrs() {
  const result = { ...attrs }
  // This indicator always represents unknown progress; attrs cannot invent a range or percentage.
  for (const key of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext']) {
    delete result[key]
  }
  if (props.decorative) {
    delete result.role
    delete result['aria-label']
    delete result['aria-labelledby']
    delete result['aria-describedby']
    result['aria-hidden'] = 'true'
  } else {
    result.role = 'progressbar'
    if (result['aria-label'] === undefined && !result['aria-labelledby']) {
      result['aria-label'] = props.label.trim() || '加载中'
    }
  }
  return result
}
</script>

<template>
  <span
    ref="root"
    v-bind="rootAttrs()"
    class="mdv-loading-indicator"
    :class="{ 'mdv-loading-indicator--contained': props.contained }"
    :style="{ '--mdv-loading-indicator-size': `${size}px` }"
  >
    <svg
      class="mdv-loading-indicator__graphic"
      :width="(size * 38) / 48"
      :height="(size * 38) / 48"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g ref="rotor" :transform="`rotate(${initial.rotation.toFixed(3)} 50 50)`">
        <path ref="path" class="mdv-loading-indicator__shape" :d="initial.path" />
      </g>
    </svg>
  </span>
</template>
