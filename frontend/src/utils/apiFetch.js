import router from '../router'

/**
 * A wrapper around the native `fetch` API that automatically injects 
 * the Authorization token from localStorage and intercepts 401/403 responses.
 *
 * @param {string} url - The endpoint URL
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<Response>}
 */

let isRedirectingAdmin = false

export async function apiFetch(url, options = {}) {
    // Determine which token to use based on the URL context or current page
    const isAdminApiRoute = url.includes('/api/admin')
    const isOnAdminPage = window.location.pathname.startsWith('/admin')
    const token = (isAdminApiRoute || isOnAdminPage)
        ? localStorage.getItem('adminToken')
        : localStorage.getItem('customer_token')

    // Set up headers
    const headers = new Headers(options.headers || {})

    // Inject the selected token
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    // Add JSON content type automatically if not uploading FormData
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }

    // Execute fetch
    const response = await fetch(url, {
        ...options,
        headers
    })

    // Intercept 401 Unauthorized or 403 Forbidden
    if (response.status === 401 || response.status === 403) {
        // Only clear admin session if the FAILED request was to an admin-specific API endpoint.
        // This prevents non-admin endpoints (like /api/settings, /api/products) from
        // accidentally clearing the admin session when accessed from admin pages.
        if (isAdminApiRoute && !isRedirectingAdmin) {
            console.warn('Admin authentication failed on:', url)
            isRedirectingAdmin = true
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')
            if (window.location.pathname !== '/admin/login') {
                router.push('/admin/login')
            }
            // Reset flag after a short delay to prevent rapid re-triggers
            setTimeout(() => { isRedirectingAdmin = false }, 2000)
        } else if (!isOnAdminPage && !isAdminApiRoute) {
            // Customer-side auth failure
            localStorage.removeItem('customer_token')
            localStorage.removeItem('customer_user')
            if (window.location.pathname === '/profile') {
                router.push('/')
            }
        }
    }

    return response
}
