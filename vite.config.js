import { defineConfig } from 'vite';


// https://vitejs.dev/config/

export default defineConfig({
  base: '',
  publicDir: './public',
  build: {
    outDir: './dist',
    emptyOutDir: true
  },
  server: {
    port: 8000,
    force: true
  },
  esbuild: {
    jsxFactory: `jsx`,
    jsxInject: `import { jsx } from 'sygnal/jsx'`,
  }
});
