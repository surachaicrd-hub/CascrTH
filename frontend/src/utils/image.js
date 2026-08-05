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
 * 1. First tries the on-the-fly resize API endpoint
 * 2. If that also fails, falls back to the original full-size image
 *
 * Usage in Vue template: @error="onImageError"
 */
export function onImageError(event) {
    const img = event.target
    if (!img || !img.src) return

    const SVG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Cg transform='translate(276,176)' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Crect x='3' y='3' width='42' height='42' rx='8'/%3E%3Ccircle cx='17' cy='17' r='5'/%3E%3Cpath d='M41 33l-10-10-18 18'/%3E%3C/g%3E%3Ctext x='50%25' y='240' font-family='sans-serif' font-size='14' font-weight='600' fill='%2364748b' text-anchor='middle'%3EImage Not Found%3E%2Ftext%3E%3C%2Fsvg%3E"

    // Prevent infinite error loops
    if (img.dataset.fallbackAttempted === 'done') return

    if (img.dataset.fallbackAttempted === 'original') {
        img.dataset.fallbackAttempted = 'done'
        img.src = SVG_PLACEHOLDER
        return
    }

    const src = img.getAttribute('src') || img.src

    // Parse cache path: /uploads/cache/image-xxx-WIDTH.ext or /uploads/subfolder/cache/image-xxx-WIDTH.ext
    const cacheMatch = src.match(/^\/uploads\/(?:(.+)\/)?cache\/([^/]+)-(\d+)\.([a-zA-Z0-9]+)$/)
    if (cacheMatch) {
        if (img.dataset.fallbackAttempted !== 'resize-api') {
            // First fallback: try the on-the-fly resize API
            const cachePath = src.startsWith('/') ? src.substring(1) : src
            img.dataset.fallbackAttempted = 'resize-api'
            img.src = `/api/upload/resize?path=${encodeURIComponent(cachePath)}`
            return
        }

        // Second fallback: use the original full-size image
        const subfolder = cacheMatch[1] || ''
        const baseName = cacheMatch[2]
        const ext = cacheMatch[4]
        const originalPath = subfolder
            ? `/uploads/${subfolder}/${baseName}.${ext}`
            : `/uploads/${baseName}.${ext}`
        img.dataset.fallbackAttempted = 'original'
        img.src = originalPath
        return
    }

    // For non-cache URLs that error, set placeholder
    img.dataset.fallbackAttempted = 'done'
    img.src = SVG_PLACEHOLDER
}
