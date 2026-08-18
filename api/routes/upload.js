const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageService = require('../services/imageService');
const { verifyAdmin } = require('./auth');

const { primaryUploadsDir: uploadDir } = require('../config/uploadConfig');

// Config multer to use memory storage so we can process with sharp before saving
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for high-resolution images
});

// Helper: SVG placeholder generator for missing images
function getMissingImageSvg(width = 600, height = 400, text = 'Image Not Found') {
    const w = width || 600;
    const h = height || 400;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <g transform="translate(${Math.max(10, w/2 - 24)}, ${Math.max(10, h/2 - 24)})" fill="none" stroke="#94a3b8" stroke-width="2">
        <rect x="3" y="3" width="42" height="42" rx="8"/>
        <circle cx="17" cy="17" r="5"/>
        <path d="M41 33l-10-10-18 18"/>
      </g>
      <text x="50%" y="${Math.max(30, h/2 + 28)}" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle">${text}</text>
    </svg>`;
}

// On-the-fly resizing endpoint for fallback requests
router.get('/resize', async (req, res) => {
    const { path: pathParam } = req.query;
    if (!pathParam || typeof pathParam !== 'string') {
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.status(200).send(getMissingImageSvg(600, 400));
    }

    try {
        const regex = /^uploads\/(?:(.+)\/)?cache\/([^/]+)-(\d+)\.([a-zA-Z0-9]+)$/;
        const match = pathParam.match(regex);
        
        if (!match) {
            res.setHeader('Content-Type', 'image/svg+xml');
            return res.status(200).send(getMissingImageSvg(600, 400));
        }

        const subfolder = match[1] || ''; // e.g. 'categories' or ''
        const baseName = match[2]; // e.g. 'image-xxx'
        const targetWidth = parseInt(match[3]) || 600;
        const ext = match[4].toLowerCase(); // e.g. 'webp' or 'png'

        const originalFilename = `${baseName}.${ext}`;
        const cachedFilename = `${baseName}-${targetWidth}.${ext}`;

        const originalFilePath = path.join(uploadDir, subfolder, originalFilename);
        const cachedFileDir = path.join(uploadDir, subfolder, 'cache');
        const cachedFilePath = path.join(cachedFileDir, cachedFilename);

        // Security: Prevent path traversal attacks
        const resolvedOriginal = path.resolve(originalFilePath);
        const resolvedCached = path.resolve(cachedFilePath);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (!resolvedOriginal.startsWith(resolvedUploadDir) || !resolvedCached.startsWith(resolvedUploadDir)) {
            return res.status(403).json({ success: false, error: 'Access denied: invalid path' });
        }

        // If the original file does not exist, serve SVG placeholder instead of 404
        if (!fs.existsSync(originalFilePath)) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(getMissingImageSvg(targetWidth, Math.round(targetWidth * 0.66)));
        }

        // Set caching headers for the response
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days

        // If cached version already exists, serve it
        if (fs.existsSync(cachedFilePath)) {
            return res.sendFile(cachedFilePath);
        }

        // Ensure cache directory exists
        if (!fs.existsSync(cachedFileDir)) {
            fs.mkdirSync(cachedFileDir, { recursive: true });
        }

        await imageService.resizeFile(originalFilePath, cachedFilePath, targetWidth, null, ext);
        return res.sendFile(cachedFilePath);
    } catch (err) {
        console.error('On-the-fly resizing error:', err);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(getMissingImageSvg(600, 400));
    }
});

// Single image upload endpoint (auto convert to webp with high quality)
router.post('/', verifyAdmin, (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading (e.g. file too large)
            return res.status(400).json({ success: false, error: err.message });
        } else if (err) {
            // An unknown error occurred when uploading
            return res.status(500).json({ success: false, error: 'Unknown upload error' });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image provided' });
        }

        const originalExt = path.extname(req.file.originalname || '').toLowerCase();
        const ext = imageService.isAvailable ? '.webp' : (originalExt || '.png');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'image-' + uniqueSuffix + ext;
        const filepath = path.join(uploadDir, filename);

        // Process and save image
        await imageService.processAndSaveImage(req.file.buffer, filepath, {
            width: 2560,
            height: 2560,
            format: imageService.isAvailable ? 'webp' : (ext.replace('.', '') || 'png'),
            quality: 92
        });

        // Pre-generate responsive thumbnails in cache if service available
        try {
            const { generateThumbnailsForFile } = require('../services/thumbnailService');
            await generateThumbnailsForFile(filepath);
        } catch (e) {}

        // Return relative URL
        const fileUrl = `/uploads/${filename}`;
        res.status(200).json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload and convert image' });
    }
});

// CKEditor specific upload endpoint (requires 'upload' field and specific JSON response)
router.post('/ckeditor', verifyAdmin, (req, res, next) => {
    upload.single('upload')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: { message: err.message } });
        } else if (err) {
            return res.status(500).json({ error: { message: 'Unknown upload error' } });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: { message: 'No image provided' } });
        }

        const originalExt = path.extname(req.file.originalname || '').toLowerCase();
        const ext = imageService.isAvailable ? '.webp' : (originalExt || '.png');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'ck-image-' + uniqueSuffix + ext;
        const filepath = path.join(uploadDir, filename);

        // Process and save image
        await imageService.processAndSaveImage(req.file.buffer, filepath, {
            width: 2560,
            height: 2560,
            format: imageService.isAvailable ? 'webp' : (ext.replace('.', '') || 'png'),
            quality: 92
        });

        // Pre-generate responsive thumbnails in cache if service available
        try {
            const { generateThumbnailsForFile } = require('../services/thumbnailService');
            await generateThumbnailsForFile(filepath);
        } catch (e) {}

        // CKEditor expects { url: 'http://...' } or relative
        const fileUrl = `/uploads/${filename}`;
        res.status(200).json({ url: fileUrl });
    } catch (error) {
        console.error('CKEditor upload error:', error);
        res.status(500).json({ error: { message: 'Failed to upload and convert image' } });
    }
});

// POST /api/upload/convert-all-existing
// Scan uploads folder for JPEG/PNG and convert to WebP, then replace all references in the database
router.post('/convert-all-existing', verifyAdmin, async (req, res) => {
    try {
        const db = require('../config/database');
        const results = [];
        let convertedCount = 0;
        let dbUpdatedCount = 0;
        
        // 1. Clear all cache folders recursively to free up disk space and avoid converting cached files
        const clearCacheDirs = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    if (file === 'cache') {
                        fs.rmSync(filePath, { recursive: true, force: true });
                        console.log(`[Convert] Cleared cache folder: ${filePath}`);
                    } else {
                        clearCacheDirs(filePath);
                    }
                }
            }
        };
        try {
            clearCacheDirs(uploadDir);
        } catch (e) {
            console.error('[Convert] Error clearing cache folders:', e.message);
        }

        // Helper: Recursively scan directories for non-webp images
        const scanAndConvert = async (dir) => {
            const files = await fs.promises.readdir(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = await fs.promises.stat(filePath);
                
                if (stat.isDirectory()) {
                    if (file !== 'cache') {
                        await scanAndConvert(filePath);
                    }
                    continue;
                }
                
                const ext = path.extname(file).toLowerCase();
                if (['.png', '.jpeg', '.jpg'].includes(ext)) {
                    const baseName = path.basename(file, ext);
                    const relativeDir = path.relative(uploadDir, dir);
                    
                    const newFilename = `${baseName}.webp`;
                    const newFilePath = path.join(dir, newFilename);
                    
                    try {
                        // Convert to WebP and limit size to 2000px
                        await imageService.processAndSaveImage(filePath, newFilePath, {
                            width: 2000,
                            height: 2000,
                            format: 'webp',
                            quality: 80
                        });
                        
                        convertedCount++;
                        
                        // Delete original non-webp file
                        await fs.promises.unlink(filePath);
                        
                        // Construct the relative URLs for database matching
                        const oldUrlPart = relativeDir 
                            ? `/uploads/${relativeDir.replace(/\\/g, '/')}/${file}` 
                            : `/uploads/${file}`;
                        const newUrlPart = relativeDir 
                            ? `/uploads/${relativeDir.replace(/\\/g, '/')}/${newFilename}` 
                            : `/uploads/${newFilename}`;
                            
                        results.push({ oldUrl: oldUrlPart, newUrl: newUrlPart });
                    } catch (err) {
                        console.error(`[Convert] Failed converting ${file}:`, err.message);
                    }
                }
            }
        };
        
        await scanAndConvert(uploadDir);
        
        // 2. Perform database updates for all converted images
        if (results.length > 0) {
            const connection = await db.getConnection();
            await connection.beginTransaction();
            try {
                for (const item of results) {
                    const { oldUrl, newUrl } = item;
                    
                    // Update products: image_url, images, description
                    await connection.query('UPDATE products SET image_url = REPLACE(image_url, ?, ?) WHERE image_url LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    await connection.query('UPDATE products SET images = REPLACE(images, ?, ?) WHERE images LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    await connection.query('UPDATE products SET description = REPLACE(description, ?, ?) WHERE description LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    
                    // Update articles: cover_image, content
                    await connection.query('UPDATE articles SET cover_image = REPLACE(cover_image, ?, ?) WHERE cover_image LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    await connection.query('UPDATE articles SET content = REPLACE(content, ?, ?) WHERE content LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    
                    // Update projects: cover_image, gallery_images, description
                    await connection.query('UPDATE projects SET cover_image = REPLACE(cover_image, ?, ?) WHERE cover_image LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    await connection.query('UPDATE projects SET gallery_images = REPLACE(gallery_images, ?, ?) WHERE gallery_images LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    await connection.query('UPDATE projects SET description = REPLACE(description, ?, ?) WHERE description LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    
                    // Update settings: setting_value
                    await connection.query('UPDATE settings SET setting_value = REPLACE(setting_value, ?, ?) WHERE setting_value LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    
                    // Update categories: image_url
                    await connection.query('UPDATE categories SET image_url = REPLACE(image_url, ?, ?) WHERE image_url LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    
                    // Update product_reviews: images
                    await connection.query('UPDATE product_reviews SET images = REPLACE(images, ?, ?) WHERE images LIKE ?', [oldUrl, newUrl, `%${oldUrl}%`]);
                    
                    dbUpdatedCount++;
                }
                await connection.commit();
            } catch (dbErr) {
                await connection.rollback();
                console.error('[Convert] DB transaction failed:', dbErr.message);
                throw dbErr;
            } finally {
                connection.release();
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Successfully converted ${convertedCount} images to WebP and updated ${dbUpdatedCount} database entries.`,
            convertedCount,
            dbUpdatedCount
        });
    } catch (error) {
        console.error('[Convert] Global error:', error);
        res.status(500).json({ success: false, error: 'Conversion failed: ' + error.message });
    }
});

module.exports = router;
