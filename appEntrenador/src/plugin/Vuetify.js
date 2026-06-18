import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
  theme: {
    dark: true, // Empezaremos con oscuro por defecto, ¡es más moderno!
    themes: {
      light: {
        primary: '#00E5FF',
        secondary: '#2D3436',
        accent: '#FF4081', // Un toque de rosa vibrante para llamadas a la acción
        background: '#F5F5F5',
        surface: '#FFFFFF',
        info: '#2196F3',
        success: '#00C853',
        warning: '#FFAB00',
        error: '#FF5252',
      },
      dark: {
        primary: '#00E5FF',     // Cian eléctrico
        secondary: '#2D3436',   // Grafito oscuro
        accent: '#FF4081',      // Fucsia vibrante
        background: '#121212',  // Negro profundo
        surface: '#1E1E1E',     // Tarjetas oscuras
        info: '#448AFF',
        success: '#00E676',
        warning: '#FFD740',
        error: '#FF5252',
      }
    },
    options: { 
      customProperties: true,
    },
  },
})