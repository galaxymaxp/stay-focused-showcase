import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset paths, so the build works at any URL — including GitHub
// Pages' /stay-focused-showcase/ sub-path — without configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
})
