import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import vue3GoogleLogin from 'vue3-google-login'
import { useSettingsStore } from './stores/settingsStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize Google Login plugin with fallback
app.use(vue3GoogleLogin, {
    clientId: 'not-configured'
})

// Mount app immediately so user sees UI instantly without waiting for network
app.mount('#app')

// Load public settings asynchronously in background
const fetchPublicSettings = async () => {
    try {
        const response = await fetch('/api/settings/public')
        const data = await response.json()

        if (data.success && data.data) {
            app.config.globalProperties.$pubSettings = data.data
            const settingsStore = useSettingsStore()
            settingsStore.initializeSettings(data.data)
        }
    } catch (error) {
        console.error('Failed to fetch public settings during background load:', error)
    }
}

fetchPublicSettings()
