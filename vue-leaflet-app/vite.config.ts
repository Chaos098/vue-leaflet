import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages project site is served at https://<owner>.github.io/vue-leaflet/,
  // so built assets need this base; keep '/' for local dev so `npm run dev` is unaffected.
  base: command === 'build' ? '/vue-leaflet/' : '/',
  plugins: [vue()],
}))
