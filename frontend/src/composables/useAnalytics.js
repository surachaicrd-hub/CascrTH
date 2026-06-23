import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

// Detect device type
function getDeviceType() {
    const ua = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
    if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return 'mobile'
    return 'desktop'
}

// Detect browser
function getBrowser() {
    const ua = navigator.userAgent
    if (ua.includes('Firefox/')) return 'Firefox'
    if (ua.includes('Edg/')) return 'Edge'
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera'
    if (ua.includes('Chrome/')) return 'Chrome'
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari'
    return 'Other'
}

// Detect OS
function getOS() {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac OS')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
    return 'Other'
}

// Get UTM params from URL
function getUTMParams() {
    const params = new URLSearchParams(window.location.search)
    return {
        utmSource: params.get('utm_source') || null,
        utmMedium: params.get('utm_medium') || null,
        utmCampaign: params.get('utm_campaign') || null
    }
}

// Get or create session ID
function getSessionId() {
    let sid = sessionStorage.getItem('analytics_session')
    if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
        sessionStorage.setItem('analytics_session', sid)
    }
    return sid
}

export function useAnalytics() {
    const route = useRoute()
    const startTime = ref(Date.now())
    const accumulatedTime = ref(0)
    const maxScrollDepth = ref(0)
    let heartbeatInterval = null
    let scrollHandler = null
    let visibilityHandler = null
    let lastScrollProcessTime = 0

    const sessionId = getSessionId()

    // check consent helper
    const hasConsent = () => {
        try {
            const prefsStr = localStorage.getItem('cookie_consent_preferences')
            if (prefsStr) {
                const prefs = JSON.parse(prefsStr)
                return !!prefs.analytics
            }
        } catch (e) {}
        return false
    }

    const trackPageView = () => {
        if (!hasConsent()) return

        // Reset state for new page
        accumulatedTime.value = 0
        startTime.value = Date.now()
        maxScrollDepth.value = 0

        const data = {
            sessionId,
            pagePath: route.fullPath,
            pageTitle: document.title,
            referrer: document.referrer || null,
            ...getUTMParams(),
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language || 'th'
        }

        fetch('/api/analytics/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(() => { })
    }

    const calculateTimeOnPage = () => {
        let currentSessionTime = 0
        if (document.visibilityState === 'visible') {
            currentSessionTime = Date.now() - startTime.value
        }
        return Math.round((accumulatedTime.value + currentSessionTime) / 1000)
    }

    const sendHeartbeat = (isUnload = false) => {
        if (!hasConsent()) return
        
        const payload = JSON.stringify({
            sessionId,
            pagePath: route.fullPath,
            timeOnPage: calculateTimeOnPage(),
            scrollDepth: maxScrollDepth.value
        })

        if (isUnload && navigator.sendBeacon) {
            // Use sendBeacon for reliable delivery when page unloads or hides
            navigator.sendBeacon('/api/analytics/heartbeat', new Blob([payload], { type: 'application/json' }))
        } else {
            fetch('/api/analytics/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: isUnload // fallback if sendBeacon fails
            }).catch(() => { })
        }
    }

    const onScroll = () => {
        const now = Date.now()
        // Throttle to max once every 300ms
        if (now - lastScrollProcessTime < 300) return
        lastScrollProcessTime = now

        requestAnimationFrame(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            if (docHeight > 0) {
                const depth = Math.min(100, Math.round((scrollTop / docHeight) * 100))
                if (depth > maxScrollDepth.value) {
                    maxScrollDepth.value = depth
                }
            }
        })
    }

    const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            // User switched tabs or minimized
            accumulatedTime.value += (Date.now() - startTime.value)
            sendHeartbeat(true)
        } else {
            // User came back
            startTime.value = Date.now()
        }
    }

    const startTracking = () => {
        trackPageView()

        // Scroll tracking with throttling
        scrollHandler = onScroll
        window.addEventListener('scroll', scrollHandler, { passive: true })

        // Visibility tracking
        visibilityHandler = onVisibilityChange
        document.addEventListener('visibilitychange', visibilityHandler)

        // Heartbeat every 15 seconds
        heartbeatInterval = setInterval(() => sendHeartbeat(false), 15000)
    }

    const stopTracking = () => {
        // Send final heartbeat on unmount
        sendHeartbeat(true)

        if (scrollHandler) {
            window.removeEventListener('scroll', scrollHandler)
            scrollHandler = null
        }
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler)
            visibilityHandler = null
        }
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            heartbeatInterval = null
        }
    }

    onMounted(startTracking)
    onBeforeUnmount(stopTracking)

    return { trackPageView, sessionId }
}
