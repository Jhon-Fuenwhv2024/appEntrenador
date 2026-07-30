import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugin/vuetify'
import router from './router'
import { APP_NAME, APP_FAVICON } from './config/app.js'
import '@mdi/font/css/materialdesignicons.css'
import './assets/theme-base.css'

document.title = APP_NAME

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.href = APP_FAVICON
}

// Feature 051 — register service worker for PWA + push (autoUpdate).
if ('serviceWorker' in navigator) {
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
