const fs = require('fs');
const path = require('path');
const db = require('../api/config/database');

const PUBLIC_DIR = path.join(__dirname, '../public');

// Configuration mapping directories to search
const TARGET_DIRS = [
    '/uploads/blog',
    '/uploads/products'
];

async function getReferencedImages() {
    const references = new Set();

    console.log('[1/4] Fetching Product Images from Database...');
    const [products] = await db.query('SELECT image_url, images FROM products');
    for (const p of products) {
        if (p.image_url) {
            references.add(p.image_url);
        }
        if (p.images) {
            try {
                const imagesArr = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                if (Array.isArray(imagesArr)) {
                    imagesArr.forEach(img => references.add(img));
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }

    console.log('[2/4] Fetching Article Images from Database...');
    const [articles] = await db.query('SELECT cover_image, gallery_images, content FROM articles');
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    
    for (const a of articles) {
        if (a.cover_image) {
            references.add(a.cover_image);
        }
        if (a.gallery_images) {
            try {
                const galArr = typeof a.gallery_images === 'string' ? JSON.parse(a.gallery_images) : a.gallery_images;
                if (Array.isArray(galArr)) {
                    galArr.forEach(img => references.add(img));
                }
            } catch (e) {}
        }
        if (a.content) {
            let match;
            while ((match = imgRegex.exec(a.content)) !== null) {
                // The URL is in match[1]. Could be relative or absolute.
                // Assuming stored as relative e.g., /uploads/blog/xxx.webp
                references.add(match[1]);
            }
        }
    }

    // For absolute precaution, clean up the paths (strip domain if exists)
    const cleanedReferences = new Set();
    for (const ref of references) {
        if (!ref) continue;
        let cleanPath = ref.split('?')[0]; // Remove query params
        // Extract just the /uploads/... part if it's an absolute URL
        const uploadIndex = cleanPath.indexOf('/uploads/');
        if (uploadIndex !== -1) {
            cleanPath = cleanPath.substring(uploadIndex);
            cleanedReferences.add(cleanPath);
        }
    }

    return cleanedReferences;
}

function scanDirectoryTransversely(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            scanDirectoryTransversely(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function run() {
    const args = process.argv.slice(2);
    const executeDelete = args.includes('--execute');

    console.log(`=== Orphan Image Cleanup Worker ===`);
    console.log(`Mode: ${executeDelete ? 'EXECUTE (Files will be deleted)' : 'DRY-RUN (Only simulating)'}`);

    try {
        const referencedPaths = await getReferencedImages();
        console.log(`ℹ️ Found ${referencedPaths.size} unique image references in the database.`);

        console.log('[3/4] Scanning disk for physical files...');
        
        let orphanFiles = [];
        let totalOrphanSize = 0;

        for (const targetDir of TARGET_DIRS) {
            const absoluteDir = path.join(PUBLIC_DIR, targetDir);
            const physicalFiles = scanDirectoryTransversely(absoluteDir);
            
            for (const physPath of physicalFiles) {
                // Convert typical windows Path to relative web path e.g. /uploads/blog/file.jpg
                const relPath = physPath.split('public')[1].replace(/\\/g, '/');
                
                if (!referencedPaths.has(relPath)) {
                    const stats = fs.statSync(physPath);
                    orphanFiles.push({
                        path: physPath,
                        relPath: relPath,
                        size: stats.size
                    });
                    totalOrphanSize += stats.size;
                }
            }
        }

        console.log(`[4/4] Analysis Complete.`);
        console.log(`-------------------------------------------------`);
        console.log(`👻 Orphan Files Found: ${orphanFiles.length} files`);
        const sizeMb = (totalOrphanSize / (1024 * 1024)).toFixed(2);
        console.log(`📦 Space Wasted: ${sizeMb} MB`);

        if (orphanFiles.length > 0) {
            console.log(`-------------------------------------------------`);
            if (executeDelete) {
                console.log(`⚠️ DELETING ORPHAN FILES...`);
                let deletedCount = 0;
                for (const orphan of orphanFiles) {
                    try {
                        fs.unlinkSync(orphan.path);
                        console.log(`[DELETED] ${orphan.relPath}`);
                        deletedCount++;
                    } catch (e) {
                        console.error(`[FAILED] Could not delete ${orphan.relPath}:`, e.message);
                    }
                }
                console.log(`✅ Successfully deleted ${deletedCount} files.`);
            } else {
                console.log(`📝 Sample of orphan files (Run with --execute to delete):`);
                orphanFiles.slice(0, 10).forEach(o => console.log(` - ${o.relPath} (${(o.size / 1024).toFixed(1)} KB)`));
                if (orphanFiles.length > 10) console.log(` ... and ${orphanFiles.length - 10} more.`);
            }
        }

    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        process.exit(0);
    }
}

run();
