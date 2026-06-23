import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import vue3GoogleLogin from 'vue3-google-login'
import { useSettingsStore } from './stores/settingsStore'

// AOS - Animate On Scroll
import AOS from 'aos'
import('aos/dist/aos.css')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize AOS
AOS.init({
    duration: 700,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
    anchorPlacement: 'top-bottom',
    disable: 'mobile' // Disable on mobile to prevent main-thread blocking and reflow issues
})

// Refresh AOS on route change
router.afterEach(() => {
    setTimeout(() => AOS.refresh(), 300)
})

// Fetch public settings from database before mounting to initialize dynamic dependencies
const initializeApp = async () => {
    let googleClientId = 'not-configured'

    try {
        const response = await fetch('/api/settings/public')
        const data = await response.json()

        if (data.success && data.data) {
            if (data.data.google_client_id) {
                googleClientId = data.data.google_client_id
            }

            // Allow LoginModal and other components to know about public settings
            app.config.globalProperties.$pubSettings = data.data

            // Initialize global settings store (e.g., online_shopping_enabled)
            const settingsStore = useSettingsStore()
            settingsStore.initializeSettings(data.data)
        }
    } catch (error) {
        console.error('Failed to fetch public settings during initialization:', error)
    }

    // Initialize Google Login plugin (if not configured, the button won't show in UI anyway)
    app.use(vue3GoogleLogin, {
        clientId: googleClientId
    })

    app.mount('#app')
}

initializeApp()
