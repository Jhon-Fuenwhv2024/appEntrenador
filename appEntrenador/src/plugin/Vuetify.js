// Importamos solo lo necesario de vuetify para optimizar el rendimiento de la aplicación. Además, configuramos el tema oscuro con colores personalizados para una mejor experiencia visual.
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'dark', // Empezamos en modo oscuro
    themes: {
      dark: {
        colors: {
          primary: '#00E5FF',
          secondary: '#2D3436',
          surface: '#1E1E1E',
          background: '#121212',
          error: '#FF5252',
          success: '#00E676',
        }
      }
    }
  }
})