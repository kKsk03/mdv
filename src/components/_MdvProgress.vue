<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue'
import type { MdvCircularProgressProps } from './progress.types'
import { drawProgress, progressOptions } from './progress-geometry'
import { initialProgressFrame, useProgressMotion } from './progress-motion'

defineOptions({ name: 'MdvProgress', inheritAttrs: false })

const props = defineProps<MdvCircularProgressProps & { kind: 'linear' | 'circular' }>()
const attrs = useAttrs()
const options = computed(() => progressOptions(props, props.kind))
const initial = computed(() => drawProgress(options.value, initialProgressFrame(options.value)))
const graphic = useTemplateRef<SVGSVGElement>('graphic')
const active = useTemplateRef<SVGPathElement>('active')
const track = useTemplateRef<SVGPathElement>('track')
const stop = useTemplateRef<SVGCircleElement>('stop')

useProgressMotion(options, { graphic, active, track, stop })

function accessibleName() {
  if (attrs['aria-label'] !== undefined) return attrs['aria-label'] as string
  return attrs['aria-labelledby'] ? undefined : props.label
}
</script>

<template>
  <div
    v-bind="attrs"
    class="mdv-progress"
    :class="[
      `mdv-progress--${props.kind}`,
      `mdv-${props.kind}-progress`,
      options.wavy ? 'mdv-progress--wavy' : 'mdv-progress--flat',
      { 'mdv-progress--indeterminate': options.indeterminate },
    ]"
    role="progressbar"
    :aria-label="accessibleName()"
    :aria-valuemin="0"
    :aria-valuemax="options.max"
    :aria-valuenow="options.indeterminate ? undefined : options.value"
  >
    <span v-if="props.label" class="mdv-progress__label">{{ props.label }}</span>
    <svg
      ref="graphic"
      class="mdv-progress__graphic"
      :width="props.kind === 'circular' ? options.size : '100%'"
      :height="options.height"
      :viewBox="`0 0 ${initial.width} ${initial.height}`"
      :preserveAspectRatio="props.kind === 'circular' ? 'xMidYMid meet' : 'none'"
      :stroke-width="initial.thickness"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path ref="track" class="mdv-progress__track" :d="initial.track" />
      <path ref="active" class="mdv-progress__active" :d="initial.active" />
      <circle
        ref="stop"
        class="mdv-progress__stop"
        :cx="initial.stopX"
        :cy="initial.height / 2"
        :r="initial.stopRadius"
      />
    </svg>
  </div>
</template>
