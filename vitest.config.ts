import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    root: fileURLToPath(new URL('./', import.meta.url)),
    server: {
      deps: {
        // 由 Vite 解析算法包内的无扩展名导入，保持与库打包的解析方式一致。
        inline: ['@material/material-color-utilities'],
      },
    },
  },
})
