/**
 * Shipping provider tracking URL mapping
 * Returns the tracking URL for a given provider and tracking number
 */
const trackingUrlMap = {
    'Kerry Express': (tn) => `https://th.kerryexpress.com/th/track/?track=${tn}`,
    'Flash Express': (tn) => `https://flashexpress.com/fle/tracking?se=${tn}`,
    'J&T Express': (tn) => `https://www.jtexpress.co.th/index/query/gzquery.html?billcode=${tn}`,
    'Thailand Post': (tn) => `https://track.thailandpost.co.th/?trackNumber=${tn}`,
    'Ninja Van': (tn) => `https://www.ninjavan.co/th-th/tracking?id=${tn}`,
    'Best Express': (tn) => `https://www.best-inc.co.th/track?bills=${tn}`,
    'DHL': (tn) => `https://www.dhl.com/th-th/home/tracking.html?tracking-id=${tn}`,
}

/**
 * Get tracking URL for a shipping provider
 * @param {string} provider - Shipping provider name
 * @param {string} trackingNumber - The tracking/parcel number
 * @returns {string|null} The tracking URL or null if provider not supported
 */
export function getTrackingUrl(provider, trackingNumber) {
    if (!provider || !trackingNumber) return null
    const urlFn = trackingUrlMap[provider]
    if (urlFn) return urlFn(trackingNumber.trim())
    // Fallback: try Google search
    return `https://www.google.com/search?q=${encodeURIComponent(provider + ' tracking ' + trackingNumber.trim())}`
}

/**
 * Get provider icon
 */
export function getProviderIcon(provider) {
    const icons = {
        'Kerry Express': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-orange-500"></span>',
        'Flash Express': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400"></span>',
        'J&T Express': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span>',
        'Thailand Post': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>',
        'Ninja Van': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>',
        'Best Express': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-800"></span>',
        'DHL': '<span class="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400"></span>',
        'จัดส่งเอง': '<svg class="w-3.5 h-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>'
    }
    return icons[provider] || '<svg class="w-3.5 h-3.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>'
}

export default { getTrackingUrl, getProviderIcon }
