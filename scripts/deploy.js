const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==============================================');
console.log('       WebAi Production Build Tool            ');
console.log('==============================================\n');

const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const frontendDistDir = path.join(frontendDir, 'dist');
const apiDir = path.join(rootDir, 'api');
const apiPublicDir = path.join(apiDir, 'public');
const apiPublicAssetsDir = path.join(apiPublicDir, 'assets');
const zipFile = path.join(rootDir, 'deploy_api.zip');

try {
    // 1. Build Frontend
    console.log('[1/4] Building Frontend...');
    console.log('Running npm install in frontend...');
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
    console.log('Running npm run build in frontend...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

    // 2. Prepare API Structure
    console.log('\n[2/4] Preparing API structure...');
    if (!fs.existsSync(apiPublicDir)) {
        fs.mkdirSync(apiPublicDir, { recursive: true });
    }
    const uploadsDir = path.join(apiPublicDir, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean old assets
    if (fs.existsSync(apiPublicAssetsDir)) {
        console.log('Cleaning old assets...');
        fs.rmSync(apiPublicAssetsDir, { recursive: true, force: true });
    }

    // 3. Copy build files and config
    console.log('\n[3/4] Copying build files and configs to API...');
    
    // Copy frontend dist
    function copyRecursiveSync(src, dest) {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        if (isDirectory) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach((childItemName) => {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
    copyRecursiveSync(frontendDistDir, apiPublicDir);

    // Copy ecosystem config
    const ecosystemSrc = path.join(rootDir, 'ecosystem.config.js');
    const ecosystemDest = path.join(apiDir, 'ecosystem.config.js');
    let ecosystemContent = fs.readFileSync(ecosystemSrc, 'utf8');
    ecosystemContent = ecosystemContent.replace(/['"]\.\/api\/index\.js['"]/, "'./index.js'");
    fs.writeFileSync(ecosystemDest, ecosystemContent);

    // Create .npmrc for cPanel limits
    const npmrcPath = path.join(apiDir, '.npmrc');
    const npmrcContent = `maxsockets=1\nfetch-retries=5\nfund=false\naudit=false\nprogress=false\nomit=dev\n`;
    fs.writeFileSync(npmrcPath, npmrcContent);

    // 4. Pre-install Linux modules for cPanel
    console.log('\n[4/5] Pre-installing Linux dependencies for cPanel (Bypassing NPM limits)...');
    
    const nodeModulesDir = path.join(apiDir, 'node_modules');
    if (fs.existsSync(nodeModulesDir)) {
        console.log('Clearing old node_modules to guarantee clean Linux binary builds...');
        fs.rmSync(nodeModulesDir, { recursive: true, force: true });
    }
    
    console.log('Running npm install --cpu=x64 --os=linux --omit=dev in api folder...');
    execSync('npm install --cpu=x64 --os=linux --omit=dev', { cwd: apiDir, stdio: 'inherit' });
    
    const binPath = path.join(nodeModulesDir, '.bin');
    if (fs.existsSync(binPath)) {
        fs.rmSync(binPath, { recursive: true, force: true });
        console.log('Removed .bin to prevent symlink corruption on Windows -> Linux transfer.');
    }

    // 5. Zip the API directory
    console.log('\n[5/5] Zipping the API folder (including node_modules)...');
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();
    
    console.log('Adding files to zip...');
    function addDirectoryToZip(dirPath, zipBasePath) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const relativePath = path.join(zipBasePath, file).replace(/\\/g, '/');

            // Exclude rules
            if (
                file === '.env' || 
                file === 'test-gemini.js' || 
                relativePath === 'public/uploads' ||
                file === '.git'
            ) {
                continue;
            }

            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                addDirectoryToZip(fullPath, relativePath);
            } else {
                zip.addLocalFile(fullPath, zipBasePath.replace(/\\/g, '/'));
            }
        }
    }

    addDirectoryToZip(apiDir, '');
    
    if (fs.existsSync(zipFile)) {
        fs.unlinkSync(zipFile);
    }
    zip.writeZip(zipFile);

    console.log('\n----------------------------------------------');
    console.log('✅ Deployment files are ready: "deploy_api.zip"');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('1. Upload "deploy_api.zip" to your hosting and extract it.');
    console.log('2. Configure .env with your database details.');
    console.log('3. DO NOT CLICK "Run NPM Install".');
    console.log('4. Click "Restart App" directly.');
    console.log('----------------------------------------------\n');

    // Restore Windows dev dependencies automatically
    console.log('Restoring local Windows dependencies for development...');
    if (fs.existsSync(nodeModulesDir)) {
        fs.rmSync(nodeModulesDir, { recursive: true, force: true });
    }
    execSync('npm install', { cwd: apiDir, stdio: 'ignore' });

} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
}
