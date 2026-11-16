<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { MdvAutocomplete, MdvButton, MdvSelect } from '@/index'
import type { MdvSelectOption } from '@/index'

const regions: MdvSelectOption[] = [
  { value: 'asia', label: '亚洲', supportingText: '东亚、东南亚与南亚' },
  { value: 'europe', label: '欧洲' },
  { value: 'africa', label: '非洲', disabled: true },
  { value: 'americas', label: '美洲' },
]
const region = ref<string | number | null>('asia')
const requiredRegion = ref<string | number | null>(null)
const city = ref<string | number | null>('')
const remoteCity = ref<string | number | null>('')
const query = ref('')
const loading = ref(false)
const remoteCities = ref<MdvSelectOption[]>([])
const submitted = ref('尚未提交')
let searchTimer: ReturnType<typeof setTimeout> | undefined

function searchCities(value: string) {
  query.value = value
  loading.value = true
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const cities: MdvSelectOption[] = [
      { value: 'shanghai', label: '上海' },
      { value: 'shenzhen', label: '深圳' },
      { value: 'tokyo', label: '东京' },
      { value: 'singapore', label: '新加坡' },
    ]
    remoteCities.value = cities.filter((option) =>
      option.label.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase()),
    )
    loading.value = false
  }, 240)
}

function submit(event: SubmitEvent) {
  submitted.value = JSON.stringify(
    Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)),
  )
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="space-y-8">
    <section aria-labelledby="select-basic-title" class="space-y-5">
      <h2 id="select-basic-title" class="text-mdv-title-large">固定选项</h2>
      <div class="flex flex-wrap items-start gap-6">
        <MdvSelect
          v-model="region"
          label="区域"
          :options="regions"
          supporting-text="选择一个区域"
        />
        <MdvSelect
          v-model="region"
          variant="filled"
          menu-variant="baseline"
          label="区域（Baseline）"
          :options="regions"
        />
        <MdvSelect label="发生错误" :options="regions" error error-text="请选择可用区域。" />
        <MdvSelect label="禁用" :options="regions" model-value="asia" disabled />
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        已选区域：{{ JSON.stringify(region) }}
      </p>
    </section>

    <section
      aria-labelledby="select-form-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="select-form-title" class="text-mdv-title-large">表单与校验</h2>
      <form class="flex flex-wrap items-end gap-4" @submit.prevent="submit">
        <MdvSelect
          v-model="requiredRegion"
          name="region"
          label="必选区域"
          :options="regions"
          required
        />
        <MdvButton type="submit">提交</MdvButton>
        <MdvButton type="reset" variant="outlined">重置</MdvButton>
      </form>
      <p class="break-all text-mdv-body-small">FormData：{{ submitted }}</p>
    </section>

    <section
      aria-labelledby="autocomplete-title"
      class="space-y-5 border-t border-mdv-outline-variant pt-6"
    >
      <h2 id="autocomplete-title" class="text-mdv-title-large">Autocomplete</h2>
      <div class="flex flex-wrap items-start gap-6">
        <MdvAutocomplete
          v-model="city"
          label="城市"
          :options="[
            { value: 'shanghai', label: '上海' },
            { value: 'shenzhen', label: '深圳' },
            { value: 'tokyo', label: '东京' },
            { value: 'singapore', label: '新加坡' },
          ]"
          supporting-text="可选择建议，也可保留自由文本"
        />
        <MdvAutocomplete
          v-model="remoteCity"
          label="远端搜索"
          :options="remoteCities"
          filter-mode="external"
          :loading="loading"
          loading-text="正在查询城市…"
          no-options-text="没有找到城市"
          @search="searchCities"
        />
      </div>
      <p class="text-mdv-body-small text-mdv-on-surface-variant">
        本地值：{{ JSON.stringify(city) }}；远端查询：{{ JSON.stringify(query) }}；远端值：{{
          JSON.stringify(remoteCity)
        }}
      </p>
    </section>
  </div>
</template>
