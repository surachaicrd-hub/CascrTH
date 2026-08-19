import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    // Store Profile Settings
    const storeName = ref('')
    const storeDescription = ref('')
    const storeKeywords = ref('')
    const storeOgTitle = ref('')
    const storeOgDescription = ref('')
    const storeDefaultLlmContext = ref('')
    const storeAiCrawlingEnabled = ref(true)
    const companyLegalName = ref('')
    const storeLogo = ref('')
    const storeFavicon = ref('')
    const storeAddress = ref('')
    const storeTaxId = ref('')
    const storePhone = ref('')
    
    // Warehouse Settings
    const warehouseLat = ref('')
    const warehouseLng = ref('')

    const isOnlineShoppingEnabled = ref(true)
    const isWishlistEnabled = ref(true)
    const isCompareEnabled = ref(true)
    const isProjectsEnabled = ref(true)
    const showProductRating = ref(true)
    const showProductReview = ref(true)
    
    // Maintenance & Holiday Modes
    const maintenanceModeEnabled = ref(false)
    const maintenanceMessage = ref('')
    const holidayModeEnabled = ref(false)
    const holidayMessage = ref('')
    const holidayName = ref('')
    const holidayStartDate = ref('')  // ISO date string YYYY-MM-DD
    const holidayEndDate = ref('')    // ISO date string YYYY-MM-DD
    const holidayImage = ref('')      // URL of banner image

    // Auto-activate holiday mode if today is within the scheduled range
    const isHolidayActive = computed(() => {
        if (!holidayModeEnabled.value) return false
        // If no schedule set, just use the enabled toggle
        if (!holidayStartDate.value || !holidayEndDate.value) return true
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(holidayStartDate.value)
        start.setHours(0, 0, 0, 0)
        const end = new Date(holidayEndDate.value)
        end.setHours(23, 59, 59, 999)
        return today >= start && today <= end
    })

    const paymentPromptpayEnabled = ref(false)
    const paymentBankTransferEnabled = ref(false)
    const paymentIpayEnabled = ref(false)

    // Bank details (Array of objects)
    const paymentBankAccounts = ref([])

    // PromptPay details
    const paymentPromptpayNumber = ref('')

    // Shipping Restrictions (Array of strings)
    const shippingRestrictedProvinces = ref([])

    // Free Installation Provinces (Array of province names)
    const freeInstallProvinces = ref([])

    // Contact Channels
    const contactPhones = ref([])
    const contactEmails = ref([])
    const contactLines = ref([])
    const contactFacebookUrl = ref('')
    const contactTiktokUrl = ref('')
    const contactYoutubeUrl = ref('')
    const contactCompanyName = ref('')
    const contactAddress = ref('')
    const contactWorkingHours = ref('')

    // Page Hero Backgrounds & Content
    const productsHeroBadge = ref('')
    const productsHeroTitle = ref('')
    const productsHeroSubtitle = ref('')
    const productsHeroDesc = ref('')
    const productsHeroBg = ref('')
    const productsHeroBtn1Text = ref('')
    const productsHeroBtn1Url = ref('')
    const productsHeroBtn2Text = ref('')
    const productsHeroBtn2Url = ref('')

    const servicesHeroBg = ref('')
    const aboutHeroBg = ref('')
    const contactHeroBg = ref('')
    const blogHeroBg = ref('')
    const projectsHeroBg = ref('')
    const projectsHeroBadge = ref('')
    const projectsHeroTitle = ref('')
    const projectsHeroSubtitle = ref('')
    const projectsHeroDesc = ref('')
    const projectsStat1Val = ref('')
    const projectsStat1Label = ref('')
    const projectsStat2Val = ref('')
    const projectsStat2Label = ref('')
    const projectsStat3Val = ref('')
    const projectsStat3Label = ref('')
    const quotationHeroBg = ref('')

    // Footer Settings
    const footerNewsletterTitle = ref('')
    const footerNewsletterSubtitle = ref('')
    const footerNewsletterPrivacy = ref('')
    const footerTrustBadges = ref([])
    const footerDistributorLabel = ref('')
    const footerDistributorUrl = ref('')
    const footerSitemapLabel = ref('')
    const footerSitemapUrl = ref('')

    const initializeSettings = (pubSettings) => {
        if (!pubSettings) return

        // Products Page Hero
        if (pubSettings.products_hero_badge !== undefined) productsHeroBadge.value = pubSettings.products_hero_badge || '';
        if (pubSettings.products_hero_title !== undefined) productsHeroTitle.value = pubSettings.products_hero_title || '';
        if (pubSettings.products_hero_subtitle !== undefined) productsHeroSubtitle.value = pubSettings.products_hero_subtitle || '';
        if (pubSettings.products_hero_desc !== undefined) productsHeroDesc.value = pubSettings.products_hero_desc || '';
        if (pubSettings.products_hero_bg !== undefined) productsHeroBg.value = pubSettings.products_hero_bg || '';
        if (pubSettings.products_hero_btn1_text !== undefined) productsHeroBtn1Text.value = pubSettings.products_hero_btn1_text || '';
        if (pubSettings.products_hero_btn1_url !== undefined) productsHeroBtn1Url.value = pubSettings.products_hero_btn1_url || '';
        if (pubSettings.products_hero_btn2_text !== undefined) productsHeroBtn2Text.value = pubSettings.products_hero_btn2_text || '';
        if (pubSettings.products_hero_btn2_url !== undefined) productsHeroBtn2Url.value = pubSettings.products_hero_btn2_url || '';

        // Projects Page Hero & Stats
        if (pubSettings.projects_hero_badge !== undefined) projectsHeroBadge.value = pubSettings.projects_hero_badge || '';
        if (pubSettings.projects_hero_title !== undefined) projectsHeroTitle.value = pubSettings.projects_hero_title || '';
        if (pubSettings.projects_hero_subtitle !== undefined) projectsHeroSubtitle.value = pubSettings.projects_hero_subtitle || '';
        if (pubSettings.projects_hero_desc !== undefined) projectsHeroDesc.value = pubSettings.projects_hero_desc || '';
        if (pubSettings.projects_hero_bg !== undefined) projectsHeroBg.value = pubSettings.projects_hero_bg || '';
        if (pubSettings.projects_stat_1_val !== undefined) projectsStat1Val.value = pubSettings.projects_stat_1_val || '';
        if (pubSettings.projects_stat_1_label !== undefined) projectsStat1Label.value = pubSettings.projects_stat_1_label || '';
        if (pubSettings.projects_stat_2_val !== undefined) projectsStat2Val.value = pubSettings.projects_stat_2_val || '';
        if (pubSettings.projects_stat_2_label !== undefined) projectsStat2Label.value = pubSettings.projects_stat_2_label || '';
        if (pubSettings.projects_stat_3_val !== undefined) projectsStat3Val.value = pubSettings.projects_stat_3_val || '';
        if (pubSettings.projects_stat_3_label !== undefined) projectsStat3Label.value = pubSettings.projects_stat_3_label || '';

        // Other Page Hero Backgrounds
        if (pubSettings.services_hero_bg !== undefined) servicesHeroBg.value = pubSettings.services_hero_bg || '';
        if (pubSettings.about_hero_bg !== undefined) aboutHeroBg.value = pubSettings.about_hero_bg || '';
        if (pubSettings.contact_hero_bg !== undefined) contactHeroBg.value = pubSettings.contact_hero_bg || '';
        if (pubSettings.blog_hero_bg !== undefined) blogHeroBg.value = pubSettings.blog_hero_bg || '';
        if (pubSettings.quotation_hero_bg !== undefined) quotationHeroBg.value = pubSettings.quotation_hero_bg || '';

        if (pubSettings.online_shopping_enabled !== undefined) {
            isOnlineShoppingEnabled.value = String(pubSettings.online_shopping_enabled) === 'true'
        }
        if (pubSettings.wishlist_enabled !== undefined) {
            isWishlistEnabled.value = String(pubSettings.wishlist_enabled) === 'true'
        }

        if (pubSettings.compare_enabled !== undefined) {
            isCompareEnabled.value = String(pubSettings.compare_enabled) === 'true'
        }

        if (pubSettings.projects_enabled !== undefined) {
            isProjectsEnabled.value = String(pubSettings.projects_enabled) !== 'false'
        }

        if (pubSettings.show_product_rating !== undefined) {
            showProductRating.value = String(pubSettings.show_product_rating) === 'true'
        }
        if (pubSettings.show_product_review !== undefined) {
            showProductReview.value = String(pubSettings.show_product_review) === 'true'
        }

        if (pubSettings.maintenance_mode_enabled !== undefined) {
            maintenanceModeEnabled.value = String(pubSettings.maintenance_mode_enabled) === 'true'
        }
        if (pubSettings.maintenance_message !== undefined) {
            maintenanceMessage.value = pubSettings.maintenance_message
        }
        if (pubSettings.holiday_mode_enabled !== undefined) {
            holidayModeEnabled.value = String(pubSettings.holiday_mode_enabled) === 'true'
        }
        if (pubSettings.holiday_message !== undefined) {
            holidayMessage.value = pubSettings.holiday_message
        }
        if (pubSettings.holiday_name !== undefined) {
            holidayName.value = pubSettings.holiday_name
        }
        if (pubSettings.holiday_start_date !== undefined) {
            holidayStartDate.value = pubSettings.holiday_start_date
        }
        if (pubSettings.holiday_end_date !== undefined) {
            holidayEndDate.value = pubSettings.holiday_end_date
        }
        if (pubSettings.holiday_image !== undefined) {
            holidayImage.value = pubSettings.holiday_image
        }

        // Store Settings
        if (pubSettings.store_name !== undefined) storeName.value = pubSettings.store_name || '';
        if (pubSettings.store_description !== undefined) storeDescription.value = pubSettings.store_description || '';
        if (pubSettings.store_keywords !== undefined) storeKeywords.value = pubSettings.store_keywords || '';
        if (pubSettings.store_og_title !== undefined) storeOgTitle.value = pubSettings.store_og_title || '';
        if (pubSettings.store_og_description !== undefined) storeOgDescription.value = pubSettings.store_og_description || '';
        if (pubSettings.seo_default_llm_context !== undefined) storeDefaultLlmContext.value = pubSettings.seo_default_llm_context || '';
        if (pubSettings.seo_ai_crawling_enabled !== undefined) storeAiCrawlingEnabled.value = String(pubSettings.seo_ai_crawling_enabled) !== 'false';
        if (pubSettings.company_legal_name !== undefined) companyLegalName.value = pubSettings.company_legal_name || '';
        if (pubSettings.store_logo !== undefined) storeLogo.value = pubSettings.store_logo;
        if (pubSettings.store_favicon !== undefined) storeFavicon.value = pubSettings.store_favicon;
        if (pubSettings.store_address !== undefined) storeAddress.value = pubSettings.store_address;
        if (pubSettings.store_tax_id !== undefined) storeTaxId.value = pubSettings.store_tax_id;
        if (pubSettings.store_phone !== undefined) storePhone.value = pubSettings.store_phone;
        
        if (pubSettings.warehouse_lat !== undefined) warehouseLat.value = pubSettings.warehouse_lat;
        if (pubSettings.warehouse_lng !== undefined) warehouseLng.value = pubSettings.warehouse_lng;

        // Contact Channels
        if (pubSettings.contact_phones) {
            try { const p = typeof pubSettings.contact_phones === 'string' ? JSON.parse(pubSettings.contact_phones) : pubSettings.contact_phones; if (Array.isArray(p)) contactPhones.value = p } catch (e) {}
        }
        if (pubSettings.contact_emails) {
            try { const e = typeof pubSettings.contact_emails === 'string' ? JSON.parse(pubSettings.contact_emails) : pubSettings.contact_emails; if (Array.isArray(e)) contactEmails.value = e } catch (e) {}
        }
        if (pubSettings.contact_lines) {
            try { const l = typeof pubSettings.contact_lines === 'string' ? JSON.parse(pubSettings.contact_lines) : pubSettings.contact_lines; if (Array.isArray(l)) contactLines.value = l } catch (e) {}
        }
        if (pubSettings.contact_facebook_url !== undefined) contactFacebookUrl.value = pubSettings.contact_facebook_url;
        if (pubSettings.contact_tiktok_url !== undefined) contactTiktokUrl.value = pubSettings.contact_tiktok_url;
        if (pubSettings.contact_youtube_url !== undefined) contactYoutubeUrl.value = pubSettings.contact_youtube_url;
        if (pubSettings.contact_company_name !== undefined) contactCompanyName.value = pubSettings.contact_company_name;
        if (pubSettings.contact_address !== undefined) contactAddress.value = pubSettings.contact_address;
        if (pubSettings.contact_working_hours !== undefined) contactWorkingHours.value = pubSettings.contact_working_hours;

        // Footer Settings
        if (pubSettings.footer_newsletter_title !== undefined) footerNewsletterTitle.value = pubSettings.footer_newsletter_title || '';
        if (pubSettings.footer_newsletter_subtitle !== undefined) footerNewsletterSubtitle.value = pubSettings.footer_newsletter_subtitle || '';
        if (pubSettings.footer_newsletter_privacy !== undefined) footerNewsletterPrivacy.value = pubSettings.footer_newsletter_privacy || '';
        if (pubSettings.footer_trust_badges) {
            try {
                const parsed = typeof pubSettings.footer_trust_badges === 'string' ? JSON.parse(pubSettings.footer_trust_badges) : pubSettings.footer_trust_badges;
                if (Array.isArray(parsed)) {
                    footerTrustBadges.value = parsed;
                }
            } catch (e) {
                console.error('Failed to parse footer_trust_badges:', e);
            }
        }
        if (pubSettings.footer_distributor_label !== undefined) footerDistributorLabel.value = pubSettings.footer_distributor_label || '';
        if (pubSettings.footer_distributor_url !== undefined) footerDistributorUrl.value = pubSettings.footer_distributor_url || '';
        if (pubSettings.footer_sitemap_label !== undefined) footerSitemapLabel.value = pubSettings.footer_sitemap_label || '';
        if (pubSettings.footer_sitemap_url !== undefined) footerSitemapUrl.value = pubSettings.footer_sitemap_url || '';

        // Apply dynamic SEO and Branding to DOM
        applySeoToDOM();

        if (pubSettings.payment_promptpay_enabled !== undefined) {
            paymentPromptpayEnabled.value = String(pubSettings.payment_promptpay_enabled) === 'true'
        }
        if (pubSettings.payment_bank_transfer_enabled !== undefined) {
            paymentBankTransferEnabled.value = String(pubSettings.payment_bank_transfer_enabled) === 'true'
        }
        if (pubSettings.payment_ipay_enabled !== undefined) {
            paymentIpayEnabled.value = String(pubSettings.payment_ipay_enabled) === 'true'
        }

        if (pubSettings.payment_bank_accounts) {
            try {
                paymentBankAccounts.value = typeof pubSettings.payment_bank_accounts === 'string'
                    ? JSON.parse(pubSettings.payment_bank_accounts)
                    : pubSettings.payment_bank_accounts;
            } catch (e) {
                console.error('Failed to parse payment_bank_accounts:', e);
                paymentBankAccounts.value = [];
            }
        }

        if (pubSettings.payment_promptpay_number !== undefined) {
            paymentPromptpayNumber.value = pubSettings.payment_promptpay_number
        }

        if (pubSettings.shipping_restricted_provinces) {
            try {
                shippingRestrictedProvinces.value = typeof pubSettings.shipping_restricted_provinces === 'string'
                    ? JSON.parse(pubSettings.shipping_restricted_provinces)
                    : pubSettings.shipping_restricted_provinces;
                if (!Array.isArray(shippingRestrictedProvinces.value)) {
                    shippingRestrictedProvinces.value = [];
                }
            } catch (e) {
                console.error('Failed to parse shipping_restricted_provinces:', e);
                shippingRestrictedProvinces.value = [];
            }
        }

        if (pubSettings.free_install_provinces) {
            try {
                const parsed = typeof pubSettings.free_install_provinces === 'string'
                    ? JSON.parse(pubSettings.free_install_provinces)
                    : pubSettings.free_install_provinces;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    freeInstallProvinces.value = parsed;
                }
            } catch (e) {
                console.error('Failed to parse free_install_provinces:', e);
            }
        }
    }

    const applySeoToDOM = () => {
        const name = storeName.value || '';
        const desc = storeDescription.value || '';
        const keywords = storeKeywords.value || '';
        const ogTitle = storeOgTitle.value || name;
        const ogDesc = storeOgDescription.value || desc;

        if (name) {
            document.title = name;
        }

        const updateMeta = (selector, attrName, attrValue) => {
            if (!attrValue) return;
            let tag = document.querySelector(selector);
            if (!tag) {
                tag = document.createElement('meta');
                if (selector.includes('property=')) {
                    const match = selector.match(/property="([^"]+)"/);
                    if (match) tag.setAttribute('property', match[1]);
                } else if (selector.includes('name=')) {
                    const match = selector.match(/name="([^"]+)"/);
                    if (match) tag.setAttribute('name', match[1]);
                }
                document.head.appendChild(tag);
            }
            tag.setAttribute(attrName, attrValue);
        };

        updateMeta('meta[name="description"]', 'content', desc);
        updateMeta('meta[name="keywords"]', 'content', keywords);
        updateMeta('meta[property="og:title"]', 'content', ogTitle);
        updateMeta('meta[property="og:description"]', 'content', ogDesc);
        updateMeta('meta[property="og:site_name"]', 'content', name);
        updateMeta('meta[name="twitter:title"]', 'content', ogTitle);
        updateMeta('meta[name="twitter:description"]', 'content', ogDesc);

        const iconUrl = storeFavicon.value || storeLogo.value;
        if (iconUrl) {
            let links = document.querySelectorAll("link[rel*='icon']");
            if (links.length === 0) {
                const link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
                links = [link];
            }
            links.forEach(link => {
                link.href = iconUrl;
            });
        }

        // Dynamic JSON-LD Organization & WebSite
        let orgScript = document.getElementById('json-ld-organization');
        if (!orgScript) {
            orgScript = document.createElement('script');
            orgScript.id = 'json-ld-organization';
            orgScript.type = 'application/ld+json';
            document.head.appendChild(orgScript);
        }
        orgScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": name,
            "legalName": companyLegalName.value || contactCompanyName.value || name,
            "logo": storeLogo.value ? (storeLogo.value.startsWith('http') ? storeLogo.value : window.location.origin + storeLogo.value) : undefined,
            "description": desc,
            "url": window.location.origin
        });

        let websiteScript = document.getElementById('json-ld-website');
        if (!websiteScript) {
            websiteScript = document.createElement('script');
            websiteScript.id = 'json-ld-website';
            websiteScript.type = 'application/ld+json';
            document.head.appendChild(websiteScript);
        }
        websiteScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": name,
            "description": desc,
            "url": window.location.origin
        });
    };

    return {
        storeName,
        storeDescription,
        storeKeywords,
        storeOgTitle,
        storeOgDescription,
        storeDefaultLlmContext,
        storeAiCrawlingEnabled,
        companyLegalName,
        storeLogo,
        storeFavicon,
        storeAddress,
        storeTaxId,
        storePhone,
        applySeoToDOM,
        warehouseLat,
        warehouseLng,
        isOnlineShoppingEnabled,
        isWishlistEnabled,
        isCompareEnabled,
        isProjectsEnabled,
        paymentPromptpayEnabled,
        paymentBankTransferEnabled,
        paymentIpayEnabled,
        paymentBankAccounts,
        paymentPromptpayNumber,
        shippingRestrictedProvinces,
        freeInstallProvinces,
        showProductRating,
        showProductReview,
        maintenanceModeEnabled,
        maintenanceMessage,
        holidayModeEnabled,
        holidayMessage,
        holidayName,
        holidayStartDate,
        holidayEndDate,
        isHolidayActive,
        holidayImage,
        contactPhones,
        contactEmails,
        contactLines,
        contactFacebookUrl,
        contactTiktokUrl,
        contactYoutubeUrl,
        contactCompanyName,
        contactAddress,
        contactWorkingHours,
        productsHeroBadge,
        productsHeroTitle,
        productsHeroSubtitle,
        productsHeroDesc,
        productsHeroBg,
        productsHeroBtn1Text,
        productsHeroBtn1Url,
        productsHeroBtn2Text,
        productsHeroBtn2Url,
        servicesHeroBg,
        aboutHeroBg,
        contactHeroBg,
        blogHeroBg,
        projectsHeroBg,
        projectsHeroBadge,
        projectsHeroTitle,
        projectsHeroSubtitle,
        projectsHeroDesc,
        projectsStat1Val,
        projectsStat1Label,
        projectsStat2Val,
        projectsStat2Label,
        projectsStat3Val,
        projectsStat3Label,
        quotationHeroBg,
        footerNewsletterTitle,
        footerNewsletterSubtitle,
        footerNewsletterPrivacy,
        footerTrustBadges,
        footerDistributorLabel,
        footerDistributorUrl,
        footerSitemapLabel,
        footerSitemapUrl,
        initializeSettings
    }
})
