import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import requireImgToImport from '../../lib'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [requireImgToImport(), vue() ]
})
