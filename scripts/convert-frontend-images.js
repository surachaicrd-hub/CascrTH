const fs = require('fs');
const path = require('path');
const sharp = require('../api/node_modules/sharp');

const publicDirs = [
    path.join(__dirname, '../frontend/public'),
    path.join(__dirname, '../frontend/public/images/home'),
    path.join(__dirname, '../frontend/public/images/partners'),
    path.join(__dirname, '../frontend/public/images/services'),
    path.join(__dirname, '../frontend/public/images/footer')
];

const srcDir = path.join(__dirname, '../frontend/src');

async function processFolder(folder) {
    if (!fs.existsSync(folder)) return [];
    
    const convertedFiles = [];
    const files = await fs.promises.readdir(folder);
    
    for (const file of files) {
        const filePath = path.join(folder, file);
        const stat = await fs.promises.stat(filePath);
        
        if (stat.isDirectory()) continue;
        
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            const baseName = path.basename(file, ext);
            const newFilename = `${baseName}.webp`;
            const newFilePath = path.join(folder, newFilename);
            
            console.log(`📦 Converting ${file} to WebP...`);
            try {
                const img = sharp(filePath);
                const metadata = await img.metadata();
                
                // Limit dimensions to 2000px inside to avoid massive images, keeping aspect ratio
                await img
                    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(newFilePath);
                
                // Delete original file
                await fs.promises.unlink(filePath);
                console.log(`✅ Success: ${file} -> ${newFilename}`);
                
                convertedFiles.push({ old: file, new: newFilename });
            } catch (err) {
                console.error(`❌ Failed to convert ${file}:`, err.message);
            }
        }
    }
    return convertedFiles;
}

// Recursively update Vue code files to point to WebP files
async function updateVueFiles(dir, fileMappings) {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);
        
        if (stat.isDirectory()) {
            await updateVueFiles(filePath, fileMappings);
            continue;
        }
        
        const ext = path.extname(file).toLowerCase();
        if (['.vue', '.js', '.css', '.html'].includes(ext)) {
            let content = await fs.promises.readFile(filePath, 'utf8');
            let hasChanged = false;
            
            for (const mapping of fileMappings) {
                // Escape regex characters just in case
                const escapedOld = mapping.old.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(escapedOld, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, mapping.new);
                    hasChanged = true;
                    console.log(`🔗 Updating reference in ${path.basename(filePath)}: ${mapping.old} -> ${mapping.new}`);
                }
            }
            
            if (hasChanged) {
                await fs.promises.writeFile(filePath, content, 'utf8');
            }
        }
    }
}

async function run() {
    console.log('⚡ Starting Frontend Image Optimization Scan...');
    const allMappings = [];
    
    for (const folder of publicDirs) {
        const mappings = await processFolder(folder);
        allMappings.push(...mappings);
    }
    
    if (allMappings.length > 0) {
        console.log(`\n🔗 Updating file references in Vue files under ${srcDir}...`);
        await updateVueFiles(srcDir, allMappings);
        console.log('\n✨ Frontend Image Optimization Complete!');
    } else {
        console.log('\n✨ No image files needed conversion.');
    }
}

run().catch(console.error);
