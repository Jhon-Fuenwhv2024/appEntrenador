import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugin/vuetify'
import router from './router'
import { APP_NAME, APP_FAVICON } from './config/app.js'
import { initTextScale } from './shared/textScale.js'
import '@mdi/font/css/materialdesignicons.css'
import './assets/theme-base.css'

initTextScale()

document.title = APP_NAME

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.href = APP_FAVICON
}

function isSafeActionUrl(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
}

// Feature 051 — register service worker for PWA + push (autoUpdate).
// Feature 086 — handle SW postMessage navigate when client.navigate is missing (iOS).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data
    if (!data || data.type !== 'TRAINFIT_NAVIGATE') return
    const url = data.url
    if (!isSafeActionUrl(url)) return
    router.push(url).catch((error) => {
      console.warn('[pwa] navigate from SW:', error)
    })
  })

  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true })
    })
    .catch((error) => {
      console.warn('[pwa] registerSW failed:', error)
    })
}

const app = createApp(App)

app.use(vuetify)
app.use(router)
app.mount('#app')
