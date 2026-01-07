import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {md3} from 'vuetify/blueprints'
import './styles/theme.css'
import {vuetifyThemes} from './theme/palette'

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
        defaultTheme: 'brandLight',
        themes: vuetifyThemes,
    }
})
app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
