const fs = require('fs');
const path = require('path');

// Root uploads directory (e.g. /var/www/vhosts/.../public/uploads or d:/cascr-th/public/uploads)
const rootUploadsDir = path.resolve(__dirname, '../../public/uploads');
// API uploads directory (e.g. /var/www/vhosts/.../api/public/uploads or d:/cascr-th/api/public/uploads)
const apiUploadsDir = path.resolve(__dirname, '../public/uploads');

// Ensure both directories exist
[rootUploadsDir, apiUploadsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (e) {}
    }
});

// Primary uploads directory is always root public/uploads (where Plesk DocumentRoot/web server looks)
const primaryUploadsDir = rootUploadsDir;

/**
 * Save buffer or file to both primary and secondary upload directories
 */
async function saveUploadFile(filename, bufferOrSrcPath, subfolder = '') {
    const targetDir1 = subfolder ? path.join(rootUploadsDir, subfolder) : rootUploadsDir;
    const targetDir2 = subfolder ? path.join(apiUploadsDir, subfolder) : apiUploadsDir;

    [targetDir1, targetDir2].forEach(d => {
        if (!fs.existsSync(d)) {
            try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
        }
    });

    const file1 = path.join(targetDir1, filename);
    const file2 = path.join(targetDir2, filename);

    if (Buffer.isBuffer(bufferOrSrcPath)) {
        await fs.promises.writeFile(file1, bufferOrSrcPath);
        try { await fs.promises.writeFile(file2, bufferOrSrcPath); } catch (e) {}
    } else if (typeof bufferOrSrcPath === 'string' && fs.existsSync(bufferOrSrcPath)) {
        await fs.promises.copyFile(bufferOrSrcPath, file1);
        try { await fs.promises.copyFile(bufferOrSrcPath, file2); } catch (e) {}
    }

    return file1;
}

/**
 * Locate file in either rootUploadsDir or apiUploadsDir
 */
function findUploadFile(filename, subfolder = '') {
    const path1 = subfolder ? path.join(rootUploadsDir, subfolder, filename) : path.join(rootUploadsDir, filename);
    if (fs.existsSync(path1)) return path1;

    const path2 = subfolder ? path.join(apiUploadsDir, subfolder, filename) : path.join(apiUploadsDir, filename);
    if (fs.existsSync(path2)) {
        // Sync to path1 for next time
        try {
            const dir1 = path.dirname(path1);
            if (!fs.existsSync(dir1)) fs.mkdirSync(dir1, { recursive: true });
            fs.copyFileSync(path2, path1);
        } catch (e) {}
        return path2;
    }

    return null;
}

module.exports = {
    rootUploadsDir,
    apiUploadsDir,
    primaryUploadsDir,
    saveUploadFile,
    findUploadFile
};
