<h1 align="center">Material Design Vue</h1>

<p align="center">
  A web component library based on Material Design.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mdv-ui/mdv"><img src="https://img.shields.io/npm/v/@mdv-ui/mdv?color=blue" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@mdv-ui/mdv"><img src="https://img.shields.io/npm/l/@mdv-ui/mdv" alt="license"></a>
</p>

---

## Getting Started

### 1. Install the package

```sh
pnpm add @mdv-ui/mdv
```

### 2. Configure CSS

```sh
pnpm add -D tailwindcss@4 @tailwindcss/vite@4
```

Add the Tailwind plugin to the existing `vite.config.ts` file and configure it as follows:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

Finally, in the application's CSS entry point, such as `src/style.css`, add the following in order:

```css
@import 'tailwindcss';
@import '@mdv-ui/mdv/theme';
@import '@mdv-ui/mdv/styles';
```

Please ensure that the CSS file is referenced in `src/main.ts`.

## 3. Install icon data package (optional)

`MdvIcon` renders local Iconify icon data. MDV includes the renderer but does not bundle an icon set. If your application uses `MdvIcon`, install an icon data package. For example, to use Material Symbols:

```sh
pnpm add @iconify-icons/material-symbols
```

## Development and maintenance

Read [MAINTENANCE](./MAINTENANCE.md) to learn how to develop and maintain it.

## License

[MIT](./LICENSE)
