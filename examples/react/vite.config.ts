import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import requireImgToImport from '../../lib';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), requireImgToImport()]
})
