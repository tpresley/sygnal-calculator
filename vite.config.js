import { defineConfig } from 'vite';
import sygnal from 'sygnal/vite'


// https://vitejs.dev/config/

export default defineConfig({
  plugins: [sygnal()],
  base: '',
  publicDir: './public',
  build: {
    outDir: './dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    force: true
  },
});
