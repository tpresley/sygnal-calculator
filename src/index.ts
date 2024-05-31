import './style/main.css'

import { run } from 'sygnal'
import App from './app'

const { hmr } = run(App)

// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept('./app', hmr)
}
