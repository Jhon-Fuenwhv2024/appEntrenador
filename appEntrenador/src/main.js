import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugin/Vuetify.js'
import router from './router'
import { APP_NAME, APP_FAVICON } from './config/app.js'
import '@mdi/font/css/materialdesignicons.css'
import './assets/theme-base.css'

document.title = APP_NAME

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.href = APP_FAVICON
}

const app = createApp(App)

app.use(vuetify)
app.use(router)
app.mount('#app')