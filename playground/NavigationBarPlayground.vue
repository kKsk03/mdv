<script setup lang="ts">
import { ref } from 'vue'
import home from '@iconify-icons/material-symbols/home'
import homeOutline from '@iconify-icons/material-symbols/home-outline'
import explore from '@iconify-icons/material-symbols/explore'
import exploreOutline from '@iconify-icons/material-symbols/explore-outline'
import bookmark from '@iconify-icons/material-symbols/bookmark'
import bookmarkOutline from '@iconify-icons/material-symbols/bookmark-outline'
import person from '@iconify-icons/material-symbols/person'
import personOutline from '@iconify-icons/material-symbols/person-outline'
import { MdvBadge, MdvIcon, MdvNavigationBar, MdvNavigationBarItem } from '@/index'
import type { MdvNavigationBarOrientation } from '@/index'

const orientation = ref<MdvNavigationBarOrientation>('auto')
const current = ref('home')
const destinations = [
  { value: 'home', label: '首页', icon: homeOutline, activeIcon: home },
  { value: 'explore', label: '探索', icon: exploreOutline, activeIcon: explore, badge: '3' },
  { value: 'saved', label: '已保存', icon: bookmarkOutline, activeIcon: bookmark },
  { value: 'profile', label: '个人资料', icon: personOutline, activeIcon: person },
]
</script>

<template>
  <div class="space-y-8 pb-40">
    <section class="flex flex-wrap items-end gap-4">
      <label class="grid gap-2 text-mdv-label-large">
        排列方式
        <select v-model="orientation" class="playground-control">
          <option value="auto">自动响应宽度</option>
          <option value="vertical">纵向</option>
          <option value="horizontal">横向</option>
        </select>
      </label>
      <p class="text-mdv-body-medium text-mdv-on-surface-variant">
        当前目的地：{{ destinations.find((item) => item.value === current)?.label }}
      </p>
    </section>

    <section
      aria-label="导航栏布局预览"
      class="grid min-h-[22rem] place-items-center rounded-mdv-large border border-mdv-outline-variant bg-mdv-surface-container-low p-6 text-center"
    >
      <div>
        <p class="text-mdv-title-large">
          {{ destinations.find((item) => item.value === current)?.label }}
        </p>
        <p class="mt-2 text-mdv-body-medium text-mdv-on-surface-variant">
          在底部导航中选择另一个目的地。
        </p>
      </div>
    </section>

    <MdvNavigationBar :orientation="orientation" aria-label="主要目的地">
      <MdvNavigationBarItem
        v-for="destination in destinations"
        :key="destination.value"
        :label="destination.label"
        :active="current === destination.value"
        @click="current = destination.value"
      >
        <template #icon="{ active }">
          <MdvIcon :icon="active ? destination.activeIcon : destination.icon" />
        </template>
        <template v-if="destination.badge" #badge>
          <MdvBadge variant="large" :content="destination.badge" aria-label="3 条新内容" />
        </template>
      </MdvNavigationBarItem>
    </MdvNavigationBar>
  </div>
</template>
