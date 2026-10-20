import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import contentPlugin from './scripts/vite-content-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentPlugin()],
  // The public site is only index.html. The admin page (admin/index.html)
  // is served by the dev server and is never included in the build.
})
