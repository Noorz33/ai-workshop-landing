import { defineConfig } from 'vite'

// Relative base: the same build works at a domain root and under a GitHub Pages subpath.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 650 },
})
