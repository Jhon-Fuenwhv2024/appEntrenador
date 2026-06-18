import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // Importamos nuestro archivo de rutas

const app = createApp(App)

app.use(router) // Le decimos a la app que use el router
app.mount('#app')