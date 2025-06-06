import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: './TrueAminoStore/client', // point to where main.tsx and index.html are
  plugins: [react()],
  build: {
    outDir: '../../../dist', // optional: set to wherever you want output
  }
})
