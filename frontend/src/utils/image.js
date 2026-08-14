export function getImageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads')) {
        return path
    }
    return path
}

export function getOptimizedImageUrl(url, width) {
    if (!url || typeof url !== 'string') return url
    if (!width) return url
    if (url.startsWith('/uploads/')) {
        if (url.includes('/cache/')) return url
        const lastSlash = url.lastIndexOf('/')
        const dir = url.substring(0, lastSlash)
        const filename = url.substring(lastSlash + 1)
        const extIndex = filename.lastIndexOf('.')
        if (extIndex === -1) return url
        const base = filename.substring(0, extIndex)
        const ext = filename.substring(extIndex)
        return `${dir}/cache/${base}-${width}${ext}`
    }
    return url
}

/**
 * Fallback handler for image loading errors.
 * When a cached thumbnail fails to load (404), this handler:
 * 1. First tries the original full-size image (without /cache/ and -WIDTH)
 * 2. Second tries the on-the-fly resize API endpoint
 * 3. If that also fails, falls back to the SVG placeholder
 *
 * Usage in Vue template: @error="onImageError"
 */
export function onImageError(event) {
    const img = event.target
    if (!img) return

    const SVG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Cg transform='translate(276,176)' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Crect x='3' y='3' width='42' height='42' rx='8'/%3E%3Ccircle cx='17' cy='17' r='5'/%3E%3Cpath d='M41 33l-10-10-18 18'/%3E%3C/g%3E%3Ctext x='50%25' y='240' font-family='sans-serif' font-size='14' font-weight='600' fill='%2364748b' text-anchor='middle'%3EImage Not Found%3C%2Ftext%3E%3C%2Fsvg%3E"

    // Prevent infinite error loops
    if (img.dataset.fallbackAttempted === 'done') return

    let pathname = ''
    try {
        const fullUrl = img.src || img.getAttribute('src') || ''
        if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
            pathname = new URL(fullUrl).pathname
        } else {
            pathname = fullUrl
        }
    } catch(e) {
        pathname = img.getAttribute('src') || img.src || ''
    }

    // Parse cache path: /uploads/cache/image-xxx-WIDTH.ext or /uploads/subfolder/cache/image-xxx-WIDTH.ext
    const cacheMatch = pathname.match(/^\/uploads\/(?:(.+)\/)?cache\/([^/]+)-(\d+)\.([a-zA-Z0-9]+)$/)
    if (cacheMatch) {
        const subfolder = cacheMatch[1] || ''
        const baseName = cacheMatch[2]
        const ext = cacheMatch[4]
        const originalPath = subfolder
            ? `/uploads/${subfolder}/${baseName}.${ext}`
            : `/uploads/${baseName}.${ext}`

        if (!img.dataset.fallbackAttempted) {
            // First fallback: use original full-size image
            img.dataset.fallbackAttempted = 'original'
            img.src = originalPath
            return
        }

        if (img.dataset.fallbackAttempted === 'original') {
            // Second fallback: try resize API
            const cachePath = pathname.startsWith('/') ? pathname.substring(1) : pathname
            img.dataset.fallbackAttempted = 'resize-api'
            img.src = `/api/upload/resize?path=${encodeURIComponent(cachePath)}`
            return
        }
    }

    // Check if it's a product image fallback by model name if available in alt or data attribute
    const altText = (img.getAttribute('alt') || '').toLowerCase()
    if (!img.dataset.fallbackAttempted && (altText.includes('c300') || altText.includes('c370') || altText.includes('c371'))) {
        img.dataset.fallbackAttempted = 'model-fallback'
        if (altText.includes('300a')) img.src = '/uploads/products/c300a.png'
        else if (altText.includes('370g')) img.src = '/uploads/products/c370g.png'
        else if (altText.includes('371af') || altText.includes('371ag')) img.src = '/uploads/products/c371af.png'
        else if (altText.includes('371g')) img.src = '/uploads/products/c371g.png'
        else img.src = '/uploads/products/c300a.png'
        return
    }

    // For other URLs that fail completely
    img.dataset.fallbackAttempted = 'done'
    img.src = SVG_PLACEHOLDER
}
