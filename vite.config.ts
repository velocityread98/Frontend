import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow using NEXT_PUBLIC_* vars in addition to VITE_* so Clerk dashboard keys work directly
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
