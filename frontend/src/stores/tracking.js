import { defineStore } from 'pinia'

const RECENTLY_VIEWED_KEY = 'recently_viewed_products'
const MAX_RECENTLY_VIEWED = 20

export const useTrackingStore = defineStore('tracking', {
    state: () => ({
        sessionId: null,
        events: [],
        queue: [], // Buffered events waiting to be sent
        flushInterval: null,
        visibilityHandler: null,
        recentlyViewed: [] // Product objects stored locally for instant display
    }),
    actions: {
        initSession() {
            if (!sessionStorage.getItem('tracking_session')) {
                const sid = 'sess_' + Math.random().toString(36).substr(2, 9)
                sessionStorage.setItem('tracking_session', sid)
            }
            this.sessionId = sessionStorage.getItem('tracking_session')

            // Load recently viewed from localStorage
            try {
                const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
                if (stored) {
                    this.recentlyViewed = JSON.parse(stored) || []
                }
            } catch (e) { /* ignore parse errors */ }

            // Setup auto-flush
            if (!this.flushInterval && typeof window !== 'undefined') {
                this.flushInterval = setInterval(() => this.flushQueue(), 10000)
                
                this.visibilityHandler = () => {
                    if (document.visibilityState === 'hidden') {
                        this.flushQueue(true)
                    }
                }
                document.addEventListener('visibilitychange', this.visibilityHandler)
            }
        },

        /**
         * Add a product to the recently viewed list (localStorage backed).
         * @param {Object} product - Must include: id, name, slug, image_url, price, category
         */
        addToRecentlyViewed(product) {
            if (!product || !product.id) return

            // Build minimal object to avoid storing too much data
            const entry = {
                id: product.id,
                sku: product.sku || '',
                name: product.name || product.title || '',
                slug: product.slug || '',
                image_url: product.image_url || '',
                price: product.price != null ? Number(product.price) : 0,
                original_price: product.original_price != null ? Number(product.original_price) : null,
                category: product.category || '',
                viewedAt: Date.now()
            }

            // Remove duplicate if exists (move to front)
            this.recentlyViewed = this.recentlyViewed.filter(p => p.id !== entry.id)

            // Add to front (most recent first)
            this.recentlyViewed.unshift(entry)

            // Cap at max
            if (this.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
                this.recentlyViewed = this.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED)
            }

            // Persist to localStorage
            try {
                localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(this.recentlyViewed))
            } catch (e) { /* storage full, ignore */ }
        },

        trackEvent(eventData) {
            // First check consent (cache check could be optimized, but localStorage is fast enough)
            try {
                const prefsStr = localStorage.getItem('cookie_consent_preferences')
                if (prefsStr) {
                    const prefs = JSON.parse(prefsStr)
                    if (!prefs.analytics) return // Consent denied
                } else {
                    return // Waiting for consent
                }
            } catch (e) {
                return
            }

            const event = {
                ...eventData,
                sessionId: this.sessionId,
                timestamp: new Date().toISOString()
            }
            
            this.events.push(event) // Keep local history up to 50 items
            if (this.events.length > 50) {
                this.events = this.events.slice(-50)
            }
            this.queue.push(event) // Push to send queue
            if (this.queue.length > 50) {
                this.queue = this.queue.slice(-50)
            }
            
            // Flush immediately if tracking critical events like purchase
            if (event.type === 'purchase' || event.type === 'begin_checkout') {
                this.flushQueue()
            }
        },
        flushQueue(isUnload = false) {
            if (this.queue.length === 0) return

            const payload = JSON.stringify({ batch: this.queue })
            const currentQueue = [...this.queue]
            this.queue = [] // clear queue optimistically

            if (isUnload && navigator.sendBeacon) {
                navigator.sendBeacon('/api/track-interest', new Blob([payload], { type: 'application/json' }))
            } else {
                fetch('/api/track-interest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: isUnload
                }).catch(err => {
                    console.error('Failed to flush tracking queue', err)
                    // If not unloading, put events back in queue to try again (max 50)
                    if (!isUnload) {
                        this.queue = [...currentQueue, ...this.queue].slice(0, 50)
                    }
                })
            }
        }
    }
})

