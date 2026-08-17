const path = require('path');
const fs = require('fs');

// Try loading .env from multiple possible locations (root, api/, cwd)
const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'api', '.env')
];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}
require('dotenv').config(); // Fallback to default

const { Agent, setGlobalDispatcher } = require('undici');
setGlobalDispatcher(new Agent({
    headersTimeout: 120000, // 2 minutes to allow long Gemini AI responses
    bodyTimeout: 240000,    // 4 minutes
}));
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8201;

// Provide safe fallback for JWT_SECRET if missing
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'crdistribution_secret_jwt_key_default_fallback_2026';
    console.warn('⚠️ WARNING: JWT_SECRET was not set in .env. Using default secret.');
}

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
})); // Apply security headers

// Override any hosting-provider CSP headers to allow all needed resources
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https: wss:; frame-src 'self' https://accounts.google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://www.google.com;");
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

// Logging Setup
const morgan = require('morgan');
const logger = require('./config/logger');
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));


// Apply Rate Limiter to API routes specifically
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 2000, // Increased limit to accommodate heartbeat and polling
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req, res) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});
app.use('/api', limiter);

app.use(compression());
// CORS — restrict allowed origins in production
const allowedOrigins = [
    'http://localhost:8200',
    'http://127.0.0.1:8200',
    'http://localhost:8201',
    'http://127.0.0.1:8201',
    'http://localhost:8000',
    'http://localhost:8080'
];

if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    allowedOrigins.push(...customOrigins);
}

app.use(cors((req, corsCallback) => {
    corsCallback(null, {
        origin: function (origin, originCallback) {
        // Allow requests with no origin (mobile apps, curl, same-origin, or 'null' string from some mobile browsers/redirects)
        if (!origin || origin === 'null') {
            return originCallback(null, true);
        }

        const requestHost = req.headers.host;
        if (requestHost) {
            try {
                const originHost = new URL(origin).host;
                if (originHost === requestHost) {
                    return originCallback(null, true);
                }
            } catch (err) {
                // Fall through to the configured allowlist below.
            }
        }
        
        // Allow any origin in development mode to support testing via IP addresses
        if (process.env.NODE_ENV !== 'production') {
            return originCallback(null, true);
        }

        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) {
            originCallback(null, true);
        } else {
            console.warn(`⚠️ CORS Blocked: Origin ${origin} not in allowed list`);
            originCallback(new Error('Not allowed by CORS'));
        }
        },
        credentials: true
    });
}));

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const host = req.headers.host || '';
        // Do not force HTTPS on local environments even if NODE_ENV is production
        if (req.headers['x-forwarded-proto'] !== 'https' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
            return res.redirect(301, `https://${host}${req.url}`);
        }
        next();
    });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));



// Health check endpoint (Tests Database connection)
app.get('/api/health', async (req, res) => {
    const db = require('./config/database');
    try {
        const [result] = await db.query('SELECT 1 + 1 AS result, DATABASE() as db_name, CURRENT_USER() as db_user');
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            database: {
                connected: true,
                current_database: result[0].db_name,
                current_user: result[0].db_user
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            database: {
                connected: false,
                error: err.message,
                code: err.code
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/quotation-submit', require('./routes/quotation'));
app.use('/api/track-interest', require('./routes/tracking'));
app.use('/api/admin', require('./routes/auth').router);
app.use('/api/admin/users', require('./routes/admin-users'));
app.use('/api/admin/customers', require('./routes/admin-customers'));
app.use('/api/admin/notifications', require('./routes/notifications'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/category-attributes', require('./routes/categoryAttributes'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/contact-submit', require('./routes/contact-submit'));
app.use('/api/contact-messages', require('./routes/contact-messages'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/analytics', require('./routes/analytics'));
app.get(['/api/sitemap/ping-bing', '/ping-bing'], async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
        const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;

        const { notifyIndexNow } = require('./services/indexNowService');
        const result = await notifyIndexNow([
            `${siteUrl}/sitemap.xml`,
            `${siteUrl}/`,
            `${siteUrl}/products`,
            `${siteUrl}/projects`,
            `${siteUrl}/blog`
        ]);

        return res.json({
            success: true,
            message: 'ส่งสัญญาณ Bing IndexNow เรียบร้อยแล้ว (Bing & Yandex Instant Indexing Triggered)',
            result
        });
    } catch (error) {
        console.error('Bing IndexNow error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.get(['/robots.txt', '/api/robots.txt'], (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const siteUrl = (process.env.SITE_URL || `${protocol}://${host}`).replace(/\/$/, '');
    res.type('text/plain; charset=utf-8');
    res.send(`User-agent: *
Allow: /
Allow: /api/sitemap.xml
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /admin/
Disallow: /api/

# AI Search & LLM Crawlers Directives (GEO Optimization)
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: ByteDance
Allow: /
User-agent: CCBot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
LLMs-txt: ${siteUrl}/llms.txt
`);
});

app.use(['/llms.txt', '/api/llms.txt'], require('./routes/llms'));
app.use(['/llms-full.txt', '/api/llms-full.txt'], (req, res, next) => {
    req.url = '/full';
    require('./routes/llms')(req, res, next);
});
app.use(['/sitemap.xml', '/api/sitemap.xml', '/api/sitemap'], require('./routes/sitemap'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/shipping', require('./routes/shipping').router);
app.use('/api/payments/ipay', require('./routes/ipay'));
app.use('/api/system', require('./routes/system'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlists', require('./routes/wishlists'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/export', require('./routes/export'));
app.use('/api/line', require('./routes/line'));

// Serve Static Uploads
const imageService = require('./services/imageService');

const uploadsDir = (process.env.NODE_ENV !== 'production' && fs.existsSync(path.join(__dirname, '../public/uploads')))
    ? path.join(__dirname, '../public/uploads')
    : path.join(__dirname, 'public/uploads');
const cacheDir = path.join(uploadsDir, 'cache');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

// On-demand cache route: generate cached thumbnails if they don't exist yet
app.get(['/uploads/cache/:filename', '/uploads/:subfolder/cache/:filename'], async (req, res, next) => {
    const { filename, subfolder } = req.params;
    const currentUploadsDir = subfolder ? path.join(uploadsDir, subfolder) : uploadsDir;
    const currentCacheDir = path.join(currentUploadsDir, 'cache');
    const cachedFilePath = path.join(currentCacheDir, filename);

    // Security: Prevent path traversal attacks
    const resolvedCachedPath = path.resolve(cachedFilePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    if (!resolvedCachedPath.startsWith(resolvedUploadsDir)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // If cached file already exists, let static middleware serve it
    if (fs.existsSync(cachedFilePath)) {
        return next();
    }

    // Parse original filename and target width from cache filename pattern: base-WIDTH.ext
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    // Match pattern: "originalname-WIDTH" where WIDTH is digits at the end
    const match = nameWithoutExt.match(/^(.+)-(\d+)$/);
    if (!match) {
        return next(); // Not a valid cache filename pattern
    }

    const originalBase = match[1];
    const targetWidth = parseInt(match[2]);
    const originalFilename = `${originalBase}${ext}`;
    const originalFilePath = path.join(currentUploadsDir, originalFilename);

    if (!fs.existsSync(originalFilePath) || isNaN(targetWidth) || targetWidth <= 0) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const w = targetWidth || 600;
        const h = Math.round(w * 0.66);
        return res.status(200).send(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#f1f5f9"/><g transform="translate(${Math.max(10, w/2 - 24)}, ${Math.max(10, h/2 - 24)})" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="3" width="42" height="42" rx="8"/><circle cx="17" cy="17" r="5"/><path d="M41 33l-10-10-18 18"/></g><text x="50%" y="${Math.max(30, h/2 + 28)}" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle">Image Not Found</text></svg>`);
    }

    try {
        // Ensure cache directory exists
        if (!fs.existsSync(currentCacheDir)) {
            fs.mkdirSync(currentCacheDir, { recursive: true });
        }

        await imageService.resizeFile(originalFilePath, cachedFilePath, targetWidth, null, ext.replace('.', ''));
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
        return res.sendFile(cachedFilePath);
    } catch (err) {
        console.error('On-demand cache generation error:', err);
        if (fs.existsSync(originalFilePath)) {
            return res.redirect(`/uploads/${subfolder ? subfolder + '/' : ''}${originalFilename}`);
        }
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.status(200).send(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Image Not Found</text></svg>`);
    }
});

// Intercept requests for files inside /uploads to perform dynamic resizing if requested
app.get('/uploads/:filename', async (req, res, next) => {
    const { filename } = req.params;
    const { w, width } = req.query;
    const targetWidth = parseInt(w || width);

    const originalFilePath = path.join(uploadsDir, filename);

    // If file doesn't exist, let standard static middleware handle it (next())
    if (!fs.existsSync(originalFilePath) || fs.statSync(originalFilePath).isDirectory()) {
        return next();
    }

    // If no width query, or if it is invalid, let next() serve the original file
    if (!targetWidth || isNaN(targetWidth) || targetWidth <= 0) {
        return next();
    }

    // Build cached file path: cache/[filename]-[width][ext]
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const cachedFilename = `${base}-${targetWidth}${ext}`;
    const cachedFilePath = path.join(cacheDir, cachedFilename);

    // Set caching headers for optimized image
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days

    // If cached version exists, serve it
    if (fs.existsSync(cachedFilePath)) {
        return res.sendFile(cachedFilePath);
    }

    try {
        await imageService.resizeFile(originalFilePath, cachedFilePath, targetWidth, null, ext.replace('.', ''));
        return res.sendFile(cachedFilePath);
    } catch (err) {
        console.error('Image resizing error:', err);
        // Fallback to original file on error
        return next();
    }
});

app.use('/uploads', express.static(uploadsDir, {
    maxAge: '30d' // Cache uploads for 30 days
}));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1y', // Cache assets for 1 year
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0'); // Do not cache index.html
        } else if (filePath.endsWith('favicon.ico') || filePath.includes('favicon-') || filePath.endsWith('apple-touch-icon.png') || filePath.endsWith('favicon.svg')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'WebAi API is running' });
});

// ========== SEO Proxy (Backend SSR) ==========
const { seoProxyMiddleware } = require('./services/seoProxy');
app.use(seoProxyMiddleware);

// Handle Vue Router (Catch-all)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    next();
});

// ========== Global Error Handler ==========
app.use((err, req, res, next) => {
    // Log using Winston
    logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack, body: req.body });

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, error: 'Origin not allowed' });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
            : err.message
    });
});

// Start server (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);

        // Run background tasks & schedulers only if not disabled
        if (process.env.DISABLE_BG_TASKS !== 'true') {
            // --- Initialize Cron Jobs (e.g., Abandoned Cart) ---
            const { startCronJobs } = require('./services/cronService');
            startCronJobs();

            // --- Initialize Newsletter Automation ---
            const { initNewsletterCron } = require('./services/newsletterCronService');
            initNewsletterCron();

            // --- Initialize LINE OA Automation ---
            const { initLineCron } = require('./services/lineCronService');
            initLineCron();

            // --- Initialize Article Auto-Generation ---
            const { initArticleCron } = require('./services/articleCronService');
            initArticleCron();

            // --- Scheduled Reports ---
            const { generateDailyReport, generateWeeklyReport, generateMonthlyReport } = require('./services/scheduledReports');

            const checkSchedule = () => {
                const now = new Date();
                const hour = now.getHours();
                const minute = now.getMinutes();
                const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
                const dayOfMonth = now.getDate();

                // Daily report at 08:00
                if (hour === 8 && minute === 0) {
                    console.log('⏰ Triggering daily report...');
                    generateDailyReport();
                }

                // Weekly report Monday 09:00
                if (dayOfWeek === 1 && hour === 9 && minute === 0) {
                    console.log('⏰ Triggering weekly report...');
                    generateWeeklyReport();
                }

                // Monthly report on 1st at 09:00
                if (dayOfMonth === 1 && hour === 9 && minute === 0) {
                    console.log('⏰ Triggering monthly report...');
                    generateMonthlyReport();
                }
            };

            // Check every 60 seconds
            setInterval(checkSchedule, 60 * 1000);
            console.log('📅 Report scheduler initialized');
        } else {
            console.log('🔇 Background tasks and schedulers are disabled (DISABLE_BG_TASKS=true)');
        }

        // --- Background Thumbnail Generation Scan ---
        // Disabled by default on startup. Run on-demand via HTTP middleware or explicitly with RUN_THUMBNAIL_SCAN=true
        if (process.env.RUN_THUMBNAIL_SCAN === 'true') {
            const { generateAllThumbnails } = require('./services/thumbnailService');
            generateAllThumbnails().catch(err => console.error('Error starting thumbnail generation scan:', err));
        } else {
            console.log('🖼️ Startup thumbnail generation scan skipped (enable via RUN_THUMBNAIL_SCAN=true)');
        }
    });
}

module.exports = app;
