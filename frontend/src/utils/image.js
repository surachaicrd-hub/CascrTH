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

    // Prevent infinite error loops
    if (img.dataset.fallbackAttempted === 'original') return

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

    // For non-cache URLs that error, do nothing (prevent infinite loop)
    img.dataset.fallbackAttempted = 'original'
}
