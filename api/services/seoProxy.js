const fs = require('fs');
const path = require('path');
const db = require('../config/database');

/**
 * Helper to generate SEO/GEO tags and inject JSON-LD
 */
const generateMetaTags = ({ title, description, image, url, keywords = '', llmContext = '', jsonLdHtml = '' }) => {
    let tags = `
  <!-- Primary SEO Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}" />
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
`;

    if (keywords) {
        tags += `  <meta name="keywords" content="${keywords}" />\n`;
    }
    if (llmContext) {
        tags += `  <meta name="llm-context" content="${llmContext}" />\n`;
    }

    tags += `
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${url}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${description}" />
  <meta property="twitter:image" content="${image}" />
`;

    if (jsonLdHtml) {
        tags += `\n  <!-- Structured Data JSON-LD -->\n${jsonLdHtml}\n`;
    }

    return tags;
};

/**
 * Handle SEO for Product, Blog, and Project pages by injecting tags and JSON-LD schemas into index.html
 */
const seoProxyMiddleware = async (req, res, next) => {
    // Only intercept GET requests that are not API calls or static assets
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
        return next();
    }

    const indexPath = path.join(__dirname, '../public', 'index.html');
    
    // Check if the file exists
    if (!fs.existsSync(indexPath)) {
        return next();
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    try {
        // Dynamically compute siteUrl from request headers or env
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
        const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;
        const defaultImage = `${siteUrl}/og-image.jpg`;
        const url = `${siteUrl}${req.path}`;

        // Fetch dynamic site settings from DB
        let storeName = 'STORAGE HOUSE';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [settingsRows] = await db.query(
                "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')"
            );
            const sMap = {};
            settingsRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'STORAGE HOUSE';
            companyLegalName = sMap['company_legal_name'] || sMap['contact_company_name'] || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        } catch (e) {
            // Use defaults if table doesn't exist
        }

        let title = `${storeName} — บ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง โกดังเก็บของ คุณภาพพรีเมียม`;
        let description = `ผู้นำด้านบ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง โกดังเก็บของ รับประกัน 10 ปี ติดตั้งฉับไว ปรึกษาฟรี`;
        let image = defaultImage;
        let keywords = `บ้านเก็บของสำเร็จรูป, ตู้เก็บของสำเร็จรูป, โกดังสำเร็จรูป, ตู้เก็บของนอกบ้าน, ${storeName}`;
        let llmContext = '';
        let jsonLdList = [];
        let matched = false;

        if (req.path.startsWith('/products/')) {
            const slug = req.path.replace('/products/', '');
            if (slug) {
                const [rows] = await db.query(
                    'SELECT id, name, short_description, description, image_url, image_alt, seo_title, seo_description, seo_keywords, llm_context, faq, sku, price, images, is_active, is_out_of_stock FROM products WHERE slug = ? OR id = ?', 
                    [slug, slug]
                );
                if (rows.length > 0) {
                    const product = rows[0];
                    title = product.seo_title || `${product.name} | ${storeName}`;
                    
                    const plainDescription = product.seo_description || product.short_description || product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';
                    description = plainDescription;
                    keywords = product.seo_keywords || keywords;
                    llmContext = product.llm_context || '';

                    if (product.image_url) {
                        image = product.image_url.startsWith('http') ? product.image_url : `${siteUrl}${product.image_url}`;
                    }

                    // GEO-optimized description: merge plain text and AI-specific details for indexers
                    const aiDescription = product.llm_context
                        ? `${plainDescription} [AI Context: ${product.llm_context}]`
                        : plainDescription;

                    // Build Product JSON-LD schema
                    let parsedImages = [];
                    try {
                        if (product.images) {
                            parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        }
                    } catch (e) {}
                    if (!Array.isArray(parsedImages)) parsedImages = [];
                    if (parsedImages.length === 0 && product.image_url) {
                        parsedImages = [product.image_url];
                    }
                    parsedImages = parsedImages.map(img => img.startsWith('http') ? img : `${siteUrl}${img}`);

                    const skuPrefix = storeName.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'STORE';
                    const productSchema = {
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": product.name,
                        "image": parsedImages,
                        "description": aiDescription,
                        "sku": product.sku || `${skuPrefix}-${product.id}`,
                        "brand": {
                            "@type": "Brand",
                            "name": storeName
                        },
                        "offers": {
                            "@type": "AggregateOffer",
                            "url": url,
                            "priceCurrency": "THB",
                            "lowPrice": product.price ? String(product.price).replace(/[^0-9]/g, '') : "0",
                            "offerCount": "1",
                            "availability": product.is_active && !product.is_out_of_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                            "seller": {
                                "@type": "Organization",
                                "name": companyLegalName
                            }
                        }
                    };
                    jsonLdList.push(`<script id="json-ld-product" type="application/ld+json">${JSON.stringify(productSchema)}</script>`);

                    // Build FAQ Page schema
                    let faqList = [];
                    try {
                        if (product.faq) {
                            faqList = typeof product.faq === 'string' ? JSON.parse(product.faq) : product.faq;
                        }
                    } catch (e) {}
                    if (Array.isArray(faqList) && faqList.length > 0) {
                        const faqSchema = {
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            "mainEntity": faqList.map(f => ({
                                "@type": "Question",
                                "name": f.question,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": f.answer
                                }
                            }))
                        };
                        jsonLdList.push(`<script id="json-ld-faq" type="application/ld+json">${JSON.stringify(faqSchema)}</script>`);
                    }

                    // Build Breadcrumbs
                    const breadcrumbSchema = {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${siteUrl}/` },
                            { "@type": "ListItem", "position": 2, "name": "สินค้า", "item": `${siteUrl}/products` },
                            { "@type": "ListItem", "position": 3, "name": product.name, "item": url }
                        ]
                    };
                    jsonLdList.push(`<script id="json-ld-breadcrumb" type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`);

                    matched = true;
                }
            }
        } else if (req.path.startsWith('/blog/')) {
            const slug = req.path.replace('/blog/', '');
            if (slug) {
                try {
                    const [rows] = await db.query(
                        'SELECT id, title, slug, excerpt, content, cover_image, author, created_at, updated_at, seo_title, seo_description, seo_keywords, llm_context, faq FROM articles WHERE slug = ? OR id = ?', 
                        [slug, slug]
                    );
                    if (rows.length > 0) {
                        const article = rows[0];
                        title = article.seo_title || `${article.title} | ${storeName} Blog`;
                        
                        const plainDescription = article.seo_description || article.excerpt || article.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';
                        description = plainDescription;
                        keywords = article.seo_keywords || keywords;
                        llmContext = article.llm_context || '';

                        if (article.cover_image) {
                            image = article.cover_image.startsWith('http') ? article.cover_image : `${siteUrl}${article.cover_image}`;
                        }

                        const aiDescription = article.llm_context
                            ? `${plainDescription} [AI Context: ${article.llm_context}]`
                            : plainDescription;

                        // Build Article schema
                        const articleSchema = {
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": article.title,
                            "description": aiDescription,
                            "image": image,
                            "author": { "@type": "Person", "name": article.author || "Admin" },
                            "publisher": {
                                "@type": "Organization",
                                "name": storeName,
                                "url": siteUrl
                            },
                            "datePublished": article.created_at,
                            "dateModified": article.updated_at,
                            "mainEntityOfPage": {
                                "@type": "WebPage",
                                "@id": url
                            }
                        };
                        jsonLdList.push(`<script id="json-ld-article" type="application/ld+json">${JSON.stringify(articleSchema)}</script>`);

                        // Build FAQ Page schema for articles if available
                        let faqList = [];
                        try {
                            if (article.faq) {
                                faqList = typeof article.faq === 'string' ? JSON.parse(article.faq) : article.faq;
                            }
                        } catch (e) {}
                        if (Array.isArray(faqList) && faqList.length > 0) {
                            const faqSchema = {
                                "@context": "https://schema.org",
                                "@type": "FAQPage",
                                "mainEntity": faqList.map(f => ({
                                    "@type": "Question",
                                    "name": f.question,
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": f.answer
                                    }
                                }))
                            };
                            jsonLdList.push(`<script id="json-ld-article-faq" type="application/ld+json">${JSON.stringify(faqSchema)}</script>`);
                        }

                        // Build Article Breadcrumbs
                        const breadcrumbSchema = {
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${siteUrl}/` },
                                { "@type": "ListItem", "position": 2, "name": "บทความ", "item": `${siteUrl}/blog` },
                                { "@type": "ListItem", "position": 3, "name": article.title, "item": url }
                            ]
                        };
                        jsonLdList.push(`<script id="json-ld-article-bc" type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`);

                        matched = true;
                    }
                } catch (e) {
                   console.error('[SEO Proxy] Article query failed:', e.message);
                }
            }
        } else if (req.path.startsWith('/projects/')) {
            const slug = req.path.replace('/projects/', '');
            if (slug) {
                 const [rows] = await db.query('SELECT title, description, cover_image, location, service_date FROM projects WHERE id = ? OR slug = ?', [slug, slug]);
                 if (rows.length > 0) {
                        const project = rows[0];
                        title = `${project.title} | ผลงานของเรา ${storeName}`;
                        description = project.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '';
                        if (project.cover_image) {
                            image = project.cover_image.startsWith('http') ? project.cover_image : `${siteUrl}${project.cover_image}`;
                        }

                        // Build CreativeWork Project schema
                        const projectSchema = {
                            "@context": "https://schema.org",
                            "@type": "CreativeWork",
                            "name": project.title,
                            "description": project.description,
                            "image": image,
                            "provider": {
                                "@type": "LocalBusiness",
                                "name": storeName,
                                "image": defaultImage,
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": project.location || "Bangkok",
                                    "addressCountry": "TH"
                                }
                            }
                        };
                        if (project.service_date) {
                            projectSchema.dateCreated = project.service_date;
                        }
                        jsonLdList.push(`<script id="json-ld-project" type="application/ld+json">${JSON.stringify(projectSchema)}</script>`);

                        // Build Project Breadcrumbs
                        const breadcrumbSchema = {
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${siteUrl}/` },
                                { "@type": "ListItem", "position": 2, "name": "ผลงานติดตั้ง", "item": `${siteUrl}/projects` },
                                { "@type": "ListItem", "position": 3, "name": project.title, "item": url }
                            ]
                        };
                        jsonLdList.push(`<script id="json-ld-project-bc" type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`);

                        matched = true;
                 }
            }
        } else if (req.path === '/') {
            try {
                const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'home_slides'");
                if (rows.length > 0 && rows[0].setting_value) {
                    const slides = JSON.parse(rows[0].setting_value);
                    if (Array.isArray(slides) && slides.length > 0 && slides[0].image) {
                        const heroImage = slides[0].image.startsWith('http') ? slides[0].image : `${siteUrl}${slides[0].image}`;
                        
                        // Inject preload link before </head>
                        const preloadTag = `\n  <link rel="preload" as="image" href="${heroImage}" fetchpriority="high">\n</head>`;
                        html = html.replace('</head>', preloadTag);
                    }
                }
            } catch (e) {
                // Ignore parsing errors for home_slides
            }
        }

        if (matched) {
            const metaTags = generateMetaTags({
                title: title.replace(/"/g, '&quot;'), 
                description: description.replace(/"/g, '&quot;'), 
                image: image.replace(/"/g, '&quot;'), 
                url,
                keywords: keywords.replace(/"/g, '&quot;'),
                llmContext: llmContext.replace(/"/g, '&quot;'),
                jsonLdHtml: jsonLdList.join('\n')
            });

            // Replace standard title tag with upgraded SEO tags block
            html = html.replace(/<title>.*?<\/title>/s, metaTags);
            
            return res.send(html);
        }

        // If not matched, just serve the default html
        return res.send(html);

    } catch (error) {
        console.error('SEO Proxy Error:', error);
        return res.send(html); // Fallback to normal serving
    }
};

module.exports = { seoProxyMiddleware };

