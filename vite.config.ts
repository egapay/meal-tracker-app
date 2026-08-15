import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project at https://egapay.github.io/meal-tracker-app/,
// so assets must be requested from that subpath rather than the domain root.
//
// BASE_PATH is deliberately not VITE_-prefixed: it is read here at build time from
// the real environment, and Vite does not load .env files into vite.config.ts.
// Setting it in .env.local would silently do nothing.
const base = process.env.BASE_PATH ?? '/meal-tracker-app/'

export default defineConfig({
  base,
  plugins: [react()],
})
