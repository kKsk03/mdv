import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue(), ...(command === 'serve' ? [tailwindcss(), vueDevTools()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ...(command === 'build'
    ? {
        build: {
          copyPublicDir: false,
          lib: {
            entry: {
              index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
              'dynamic-color': fileURLToPath(new URL('./src/dynamic-color.ts', import.meta.url)),
            },
            formats: ['es'],
            fileName: (_format, entryName) => entryName + '.js',
          },
          rolldownOptions: {
            // 配色算法需参与打包：其 0.4.0 源码包含 Node 无法直接解析的无扩展名导入。
            external: ['vue', '@iconify/vue/offline', '@floating-ui/dom'],
            treeshake: {
              // 算法包仅计算并导出数据；移除未用模块，避免其聚合出口带入完整主题逻辑。
              moduleSideEffects: [
                { test: /[/\\]@material[/\\]material-color-utilities[/\\]/, sideEffects: false },
              ],
            },
          },
        },
      }
    : {}),
}))
