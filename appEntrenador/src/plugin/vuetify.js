// Importamos solo lo necesario de vuetify para optimizar el rendimiento de la aplicación. Además, configuramos el tema oscuro con colores personalizados para una mejor experiencia visual.
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

/** Overlay menus (select / combobox) share contrast-safe menu chrome */
const overlayMenuProps = {
  contentClass: 'tf-overlay-menu',
  maxHeight: 280,
}

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
  defaults: {
    VBtn: {
      rounded: 'lg',
    },
    VSelect: {
      color: 'primary',
      bgColor: 'surface',
      menuProps: overlayMenuProps,
      listProps: { bgColor: 'surface' },
    },
    VCombobox: {
      color: 'primary',
      bgColor: 'surface',
      menuProps: overlayMenuProps,
      listProps: { bgColor: 'surface' },
    },
    VAutocomplete: {
      color: 'primary',
      bgColor: 'surface',
      menuProps: overlayMenuProps,
      listProps: { bgColor: 'surface' },
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#00E5FF',
          'on-primary': '#0B0D12',
          secondary: '#2D3436',
          'on-secondary': '#FFFFFF',
          background: '#121212',
          'on-background': '#FFFFFF',
          surface: '#1E1E1E',
          'on-surface': '#FFFFFF',
          'surface-bright': '#2A2A2A',
          'surface-light': '#2D3436',
          // Must stay dark: selected/hover list items use surface-variant
          'surface-variant': '#2A3038',
          'on-surface-variant': '#E8EAED',
          error: '#FF5252',
          'on-error': '#FFFFFF',
          success: '#00E676',
          'on-success': '#0B0D12',
        },
        variables: {
          'border-color': '#FFFFFF',
          /* 1.4.11 non-text contrast on dark surfaces (feature 062) */
          'border-opacity': 0.28,
          'high-emphasis-opacity': 1,
          /* Secondary text closer to ≥4.5:1 on surface */
          'medium-emphasis-opacity': 0.82,
          'disabled-opacity': 0.5,
          'idle-opacity': 0.1,
          'hover-opacity': 0.08,
          'focus-opacity': 0.12,
          'selected-opacity': 0.16,
          'activated-opacity': 0.12,
          'pressed-opacity': 0.16,
          'theme-on-dark': '#FFFFFF',
          'theme-on-light': '#0B0D12',
        },
      },
    },
  },
})
