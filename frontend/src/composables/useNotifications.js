import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../utils/apiFetch'

const notifications = ref({ unreadMessages: 0, newQuotations: 0, pendingOrders: 0, total: 0 })
const loading = ref(false)
let intervalId = null
let activeInstances = 0

const API_BASE = import.meta.env.VITE_API_BASE || ''

async function fetchNotifications() {
    // Only fetch if admin is logged in
    if (!localStorage.getItem('adminToken')) return
    loading.value = true
    try {
        const res = await apiFetch('/api/admin/notifications')
        if (res.ok) {
            const data = await res.json()
            if (data.success) {
                notifications.value = data.notifications
            }
        }
    } catch (e) {
        // silent fail for notifications
    } finally {
        loading.value = false
    }
}

export function useNotifications() {
    onMounted(() => {
        activeInstances++
        if (activeInstances === 1) {
            // First instance: fetch immediately and start polling
            fetchNotifications()
            intervalId = setInterval(fetchNotifications, 30000) // every 30s

            // Also refresh when tab becomes visible
            document.addEventListener('visibilitychange', onVisibilityChange)
        }
    })

    onUnmounted(() => {
        activeInstances--
        if (activeInstances <= 0) {
            activeInstances = 0
            if (intervalId) { clearInterval(intervalId); intervalId = null }
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    })

    function onVisibilityChange() {
        if (document.visibilityState === 'visible') {
            fetchNotifications()
        }
    }

    return {
        notifications,
        loading,
        refreshNotifications: fetchNotifications,
    }
}

