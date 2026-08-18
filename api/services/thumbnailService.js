const fs = require('fs');
const path = require('path');
const imageService = require('./imageService');

const targetWidths = [64, 128, 150, 200, 400, 500, 600, 700, 800, 1000, 1200, 1400, 1600];

// Throttle helper: pause execution for ms milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Background task to scan public/uploads directory recursively and generate missing thumbnails.
 * Throttled to avoid overwhelming shared hosting CPU.
 */
async function generateAllThumbnails() {
    if (!imageService.isAvailable) {
        return;
    }
    console.log('🖼️ Starting background thumbnail generation scan (throttled)...');
    const uploadsDir = (process.env.NODE_ENV !== 'production' && fs.existsSync(path.join(__dirname, '../../public/uploads')))
        ? path.join(__dirname, '../../public/uploads')
        : path.join(__dirname, '../public/uploads');

    try {
        let processedCount = 0;
        let skipCount = 0;

        async function scanDir(currentDir) {
            let files;
            try {
                files = await fs.promises.readdir(currentDir);
            } catch (err) {
                console.error(`Cannot read directory ${currentDir}:`, err.message);
                return;
            }
            const cacheDir = path.join(currentDir, 'cache');
            
            for (const file of files) {
                // Skip the cache directories themselves to avoid processing processed files
                if (file === 'cache') continue;

                const filePath = path.join(currentDir, file);
                let stat;
                try {
                    stat = await fs.promises.stat(filePath);
                } catch (err) {
                    continue;
                }

                if (stat.isDirectory()) {
                    // Recursively scan subdirectories
                    await scanDir(filePath);
                    continue;
                }

                const ext = path.extname(file).toLowerCase();
                if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) continue;

                const baseName = path.basename(file, ext);

                // Check if ALL widths already cached — skip file entirely if so
                let allCached = true;
                for (const w of targetWidths) {
                    const cachedFilename = `${baseName}-${w}${ext}`;
                    const cachedFilePath = path.join(cacheDir, cachedFilename);
                    if (!fs.existsSync(cachedFilePath)) {
                        allCached = false;
                        break;
                    }
                }
                if (allCached) {
                    skipCount += targetWidths.length;
                    continue;
                }

                // Ensure cache dir exists if we find a valid image in this directory
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }

                for (const w of targetWidths) {
                    const cachedFilename = `${baseName}-${w}${ext}`;
                    const cachedFilePath = path.join(cacheDir, cachedFilename);

                    if (fs.existsSync(cachedFilePath)) {
                        skipCount++;
                        continue;
                    }

                    try {
                        let transform = sharp(filePath)
                            .rotate()
                            .resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' });

                        if (ext === '.webp') {
                            transform = transform.webp({ quality: 90, effort: 4, smartSubsample: true });
                        } else if (ext === '.png') {
                            transform = transform.png({ compressionLevel: 8, quality: 95 });
                        } else if (ext === '.jpg' || ext === '.jpeg') {
                            transform = transform.jpeg({ quality: 90, mozjpeg: true });
                        }

                        await transform.toFile(cachedFilePath);
                        processedCount++;
                    } catch (err) {
                        console.error(`Error resizing file ${file} to width ${w}:`, err.message);
                    }
                }

                // Throttle: pause 500ms between each image file to avoid CPU overload on shared hosting
                if (processedCount > 0) {
                    await sleep(500);
                }
            }
        }

        await scanDir(uploadsDir);
        console.log(`🖼️ Thumbnail generation scan complete. Processed: ${processedCount}, Skipped: ${skipCount}`);
    } catch (error) {
        console.error('Error during thumbnail generation:', error);
    }
}

/**
 * Pre-generate all thumbnails for a single file (useful on upload)
 */
async function generateThumbnailsForFile(filePath) {
    if (!imageService.isAvailable) return;
    const ext = path.extname(filePath).toLowerCase();
    if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) return;

    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const cacheDir = path.join(dir, 'cache');

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    for (const w of targetWidths) {
        const cachedFilename = `${baseName}-${w}${ext}`;
        const cachedFilePath = path.join(cacheDir, cachedFilename);
        
        try {
            if (!fs.existsSync(cachedFilePath)) {
                await imageService.resizeFile(filePath, cachedFilePath, w, null, ext.replace('.', ''));
            }
        } catch (err) {
            console.error(`Error generating thumbnail for ${filePath} at width ${w}:`, err.message);
        }
    }
}

module.exports = {
    generateAllThumbnails,
    generateThumbnailsForFile
};
