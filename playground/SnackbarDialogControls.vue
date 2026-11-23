<script setup lang="ts">
import { MdvButton, useSnackbar } from '@/index'

const snackbar = useSnackbar()
</script>

<template>
  <MdvButton
    variant="tonal"
    @click="
      snackbar.show({
        message: '这条消息属于当前对话框。',
        action: { label: '知道了' },
        closeLabel: '关闭通知',
      })
    "
  >
    显示局部消息
  </MdvButton>
</template>
