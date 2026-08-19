const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const imageService = require('./imageService');

/**
 * Public directories to keep synced with the current store favicon
 */
const TARGET_DIRS = [
    path.resolve(__dirname, '../../public'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../frontend/public'),
    path.resolve(__dirname, '../../frontend/dist')
];

/**
 * Synchronize the uploaded favicon across all static icon endpoints and files
 */
async function syncFaviconFiles(faviconRelativePath = null) {
    try {
        let iconPath = faviconRelativePath;

        // If not provided, fetch from database settings
        if (!iconPath) {
            const [rows] = await db.query(
                "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_favicon', 'store_logo')"
            );
            const sMap = {};
            rows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            iconPath = sMap['store_favicon'] || sMap['store_logo'];
        }

        if (!iconPath || typeof iconPath !== 'string') {
            console.log('ℹ️ [faviconService] No store_favicon configured in settings.');
            return false;
        }

        // Clean relative path (e.g. /uploads/image-xxx.webp -> uploads/image-xxx.webp)
        const cleanPath = iconPath.replace(/^\/+/, '');
        
        // Find existing source file on disk
        const potentialSources = [
            path.resolve(__dirname, '../../public', cleanPath),
            path.resolve(__dirname, '../public', cleanPath),
            path.resolve(__dirname, '../../', cleanPath)
        ];

        let sourceFile = potentialSources.find(p => fs.existsSync(p));
        if (!sourceFile) {
            console.warn(`⚠️ [faviconService] Source favicon file not found on disk: ${iconPath}`);
            return false;
        }

        console.log(`🔄 [faviconService] Syncing favicon from source: ${sourceFile}`);

        // Read source buffer
        const inputBuffer = await fs.promises.readFile(sourceFile);

        // Generate target favicon formats
        const sizes = [
            { name: 'favicon-48x48.png', width: 48, height: 48, format: 'png' },
            { name: 'favicon-192x192.png', width: 192, height: 192, format: 'png' },
            { name: 'favicon-512x512.png', width: 512, height: 512, format: 'png' },
            { name: 'apple-touch-icon.png', width: 180, height: 180, format: 'png' },
            { name: 'apple-touch-icon-precomposed.png', width: 180, height: 180, format: 'png' },
            { name: 'favicon.png', width: 192, height: 192, format: 'png' },
            { name: 'favicon.ico', width: 48, height: 48, format: 'png' } // High-compat PNG inside ICO name or direct PNG
        ];

        for (const dir of TARGET_DIRS) {
            if (!fs.existsSync(dir)) continue;

            for (const item of sizes) {
                const dest = path.join(dir, item.name);
                await imageService.processAndSaveImage(inputBuffer, dest, {
                    width: item.width,
                    height: item.height,
                    format: item.format,
                    quality: 100
                });
            }

            // Create SVG wrapper with base64 embedded icon for favicon.svg
            const svgDest = path.join(dir, 'favicon.svg');
            const base64Png = inputBuffer.toString('base64');
            const mime = sourceFile.endsWith('.png') ? 'image/png' : sourceFile.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:${mime};base64,${base64Png}" width="512" height="512" />
</svg>`;
            await fs.promises.writeFile(svgDest, svgContent, 'utf-8');
        }

        console.log('✅ [faviconService] Successfully synchronized store favicon to all public directories.');
        return true;
    } catch (err) {
        console.error('❌ [faviconService] Error syncing favicon:', err);
        return false;
    }
}

/**
 * Helper to get current store favicon file path for Express routes
 */
async function getActiveFaviconPath() {
    try {
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_favicon', 'store_logo')"
        );
        const sMap = {};
        rows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
        const iconPath = sMap['store_favicon'] || sMap['store_logo'];

        if (iconPath && typeof iconPath === 'string') {
            const cleanPath = iconPath.replace(/^\/+/, '');
            const candidates = [
                path.resolve(__dirname, '../../public', cleanPath),
                path.resolve(__dirname, '../public', cleanPath)
            ];
            const found = candidates.find(p => fs.existsSync(p));
            if (found) return found;
        }

        // Fallback to static favicon-192x192.png or favicon.ico
        const fallback = path.resolve(__dirname, '../public/favicon-192x192.png');
        if (fs.existsSync(fallback)) return fallback;

        return path.resolve(__dirname, '../public/favicon.ico');
    } catch (e) {
        return path.resolve(__dirname, '../public/favicon.ico');
    }
}

module.exports = {
    syncFaviconFiles,
    getActiveFaviconPath
};
