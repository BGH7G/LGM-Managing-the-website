import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {md3} from 'vuetify/blueprints'

// Import Material Design Icons
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)
const vuetify = createVuetify({
    blueprint: md3,
    components,
    directives,
    icons: {
        defaultSet: 'mdi', // This ensures MDI is the default icon set
    },
    theme: {
        defaultTheme: 'softPastelLight',
        themes: {
            softPastelLight: {
                dark: false,
                colors: {
                    primary: '#8174A0',
                    secondary: '#7AB2D3',
                    accent: '#E5D9F2',
                    success: '#3674B5',
                    warning: '#FFECC8',
                    error: '#FFB8E0',
                    info: '#9ACBD0',
                    background: '#F8FAFC',
                    surface: '#FFFFFF',
                    'on-background': '#0F172A',
                    'on-surface': '#1E293B',
                }
            },
            softPastelDark: {
                dark: true,
                colors: {
                    primary: '#001F3F',
                    secondary: '#3A6D8C',
                    accent: '#A594F9',
                    success: '#2D336B',
                    warning: '#F3C623',
                    error: '#BE5985',
                    info: '#48A6A7',
                    background: '#0F172A',
                    surface: '#1E293B',
                    'on-background': '#F8FAFC',
                    'on-surface': '#E2E8F0',
                }
            }
        }
    }
})
app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
