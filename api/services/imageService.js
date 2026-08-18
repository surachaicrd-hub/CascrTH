const fs = require('fs');
const path = require('path');

let sharp = null;
try {
    sharp = require('sharp');
    sharp.cache(false);
} catch (err) {
    console.warn('⚠️ [imageService] Native sharp library not available. Using pure fallback.');
}

/**
 * Process and save an image buffer
 */
async function processAndSaveImage(inputBufferOrPath, outputPath, options = {}) {
    const { width, height, format = 'webp', quality = 90 } = options;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let saved = false;

    if (sharp) {
        try {
            let transform = sharp(inputBufferOrPath);
            if (width || height) {
                transform = transform.resize(width || null, height || null, {
                    fit: options.fit || 'inside',
                    withoutEnlargement: true
                });
            }
            if (format === 'webp') {
                transform = transform.webp({ quality, effort: 4 });
            } else if (format === 'png') {
                transform = transform.png({ quality: Math.min(quality, 100) });
            } else if (format === 'jpeg' || format === 'jpg') {
                transform = transform.jpeg({ quality });
            }
            await transform.toFile(outputPath);
            saved = true;
        } catch (e) {
            console.warn('[imageService] Sharp transform error, falling back to direct write:', e.message);
        }
    }

    if (!saved) {
        // Direct write fallback
        if (Buffer.isBuffer(inputBufferOrPath)) {
            await fs.promises.writeFile(outputPath, inputBufferOrPath);
            saved = true;
        } else if (typeof inputBufferOrPath === 'string' && fs.existsSync(inputBufferOrPath)) {
            await fs.promises.copyFile(inputBufferOrPath, outputPath);
            saved = true;
        }
    }

    // Mirror write to alternate uploads directory if available
    try {
        const rootUploads = path.resolve(__dirname, '../../public/uploads');
        const apiUploads = path.resolve(__dirname, '../public/uploads');
        const resolvedOut = path.resolve(outputPath);

        let mirrorPath = null;
        if (resolvedOut.startsWith(rootUploads) && fs.existsSync(apiUploads)) {
            const rel = path.relative(rootUploads, resolvedOut);
            mirrorPath = path.join(apiUploads, rel);
        } else if (resolvedOut.startsWith(apiUploads) && fs.existsSync(rootUploads)) {
            const rel = path.relative(apiUploads, resolvedOut);
            mirrorPath = path.join(rootUploads, rel);
        }

        if (mirrorPath && fs.existsSync(outputPath)) {
            const mirrorDir = path.dirname(mirrorPath);
            if (!fs.existsSync(mirrorDir)) fs.mkdirSync(mirrorDir, { recursive: true });
            await fs.promises.copyFile(outputPath, mirrorPath);
        }
    } catch (mirrorErr) {
        // Non-fatal mirror error
    }

    return saved;
}

/**
 * Resize existing file
 */
async function resizeFile(srcPath, destPath, targetWidth, targetHeight, format) {
    return processAndSaveImage(srcPath, destPath, {
        width: targetWidth,
        height: targetHeight,
        format: format || 'webp'
    });
}

module.exports = {
    isAvailable: !!sharp,
    sharp,
    processAndSaveImage,
    resizeFile
};
