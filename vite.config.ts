import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite 6+ supports tsconfig paths resolution natively
    // @ts-ignore - Some TS versions might not have this in their types yet
    tsconfigPaths: true,
  },
})
