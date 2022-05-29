import { defineConfig } from 'vite';


// https://vitejs.dev/config/

export default defineConfig({
  base: '',
  publicDir: '../public',
  build: {
    outDir: '../dist',
  },
  server: {
    port: 8000
  },
  esbuild: {
    jsxFactory: `Snabbdom.createElement`,
    jsxInject: `import Snabbdom from 'snabbdom-pragma'`,
  }
});
