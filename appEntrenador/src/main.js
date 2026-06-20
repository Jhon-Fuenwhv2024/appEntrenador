import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugin/vuetify'
import router from './router'
import '@mdi/font/css/materialdesignicons.css' // ¡Importante para los iconos!

const app = createApp(App)

app.use(vuetify)
app.use(router)
app.mount('#app')