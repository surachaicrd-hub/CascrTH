import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    // Store Profile Settings
    const storeName = ref('STORAGE HOUSE')
    const storeDescription = ref('')
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
    const isAiConsultantEnabled = ref(true)
    const showProductRating = ref(true)
    const showProductReview = ref(true)
    
    // Maintenance & Holiday Modes
    const maintenanceModeEnabled = ref(false)
    const maintenanceMessage = ref('ขออภัยค่ะ ขณะนี้เว็บไซต์อยู่ระหว่างการปรับปรุงระบบชั่วคราว กรุณาติดต่อทางไลน์หรือโทรศัพท์')
    const holidayModeEnabled = ref(false)
    const holidayMessage = ref('ร้านค้าอยู่ในช่วงวันหยุดยาว การจัดส่งอาจมีระยะเวลานานกว่าปกติ ขออภัยในความไม่สะดวกค่ะ')
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
    const freeInstallProvinces = ref(['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'])

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

    // Footer Settings
    const footerNewsletterTitle = ref('ไม่พลาดโปรโมชั่นและไอเดียแต่งบ้าน')
    const footerNewsletterSubtitle = ref('สมัครฟรี รับสิทธิ์ก่อนใคร')
    const footerNewsletterPrivacy = ref('ข้อมูลปลอดภัย ยกเลิกได้ทุกเมื่อ')
    const footerTrustBadges = ref([
        { title: 'เชื่อถือได้', desc: 'บริการด้วยความโปร่งใส ตรวจสอบได้', icon: 'shield' },
        { title: 'คัดสรรคุณภาพ', desc: 'คัดเลือกบ้านและบริการที่ได้มาตรฐาน', icon: 'crown' },
        { title: 'ดูแลครบวงจร', desc: 'ทีมงานมืออาชีพพร้อมดูแลคุณทุกขั้นตอน', icon: 'support' },
        { title: 'ใส่ใจลูกค้า', desc: 'เราดูแลลูกค้าทุกท่านเหมือนคนในครอบครัว', icon: 'heart' }
    ])
    const footerDistributorLabel = ref('ตัวแทนจำหน่าย')
    const footerDistributorUrl = ref('/ai-consultant')
    const footerSitemapLabel = ref('แผนผังเว็บไซต์')
    const footerSitemapUrl = ref('/contact')

    const initializeSettings = (pubSettings) => {
        if (!pubSettings) return

        if (pubSettings.online_shopping_enabled !== undefined) {
            isOnlineShoppingEnabled.value = String(pubSettings.online_shopping_enabled) === 'true'
        }
        if (pubSettings.wishlist_enabled !== undefined) {
            isWishlistEnabled.value = String(pubSettings.wishlist_enabled) === 'true'
        }
        if (pubSettings.ai_consultant_enabled !== undefined) {
            isAiConsultantEnabled.value = String(pubSettings.ai_consultant_enabled) === 'true'
        }
        if (pubSettings.compare_enabled !== undefined) {
            isCompareEnabled.value = String(pubSettings.compare_enabled) === 'true'
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
        if (pubSettings.store_name !== undefined) storeName.value = pubSettings.store_name || 'STORAGE HOUSE';
        if (pubSettings.store_description !== undefined) storeDescription.value = pubSettings.store_description;
        if (pubSettings.store_logo !== undefined) storeLogo.value = pubSettings.store_logo;
        if (pubSettings.store_favicon !== undefined) storeFavicon.value = pubSettings.store_favicon;
        if (pubSettings.store_address !== undefined) storeAddress.value = pubSettings.store_address;
        if (pubSettings.store_tax_id !== undefined) storeTaxId.value = pubSettings.store_tax_id;
        if (pubSettings.store_phone !== undefined) storePhone.value = pubSettings.store_phone;
        
        if (pubSettings.warehouse_lat !== undefined) warehouseLat.value = pubSettings.warehouse_lat;
        if (pubSettings.warehouse_lng !== undefined) warehouseLng.value = pubSettings.warehouse_lng;

        // Contact Channels
        if (pubSettings.contact_phones) {
            try { const p = typeof pubSettings.contact_phones === 'string' ? JSON.parse(pubSettings.contact_phones) : pubSettings.contact_phones; if (p.length) contactPhones.value = p } catch (e) {}
        }
        if (pubSettings.contact_emails) {
            try { const e = typeof pubSettings.contact_emails === 'string' ? JSON.parse(pubSettings.contact_emails) : pubSettings.contact_emails; if (e.length) contactEmails.value = e } catch (e) {}
        }
        if (pubSettings.contact_lines) {
            try { const l = typeof pubSettings.contact_lines === 'string' ? JSON.parse(pubSettings.contact_lines) : pubSettings.contact_lines; if (l.length) contactLines.value = l } catch (e) {}
        }
        if (pubSettings.contact_facebook_url !== undefined) contactFacebookUrl.value = pubSettings.contact_facebook_url;
        if (pubSettings.contact_tiktok_url !== undefined) contactTiktokUrl.value = pubSettings.contact_tiktok_url;
        if (pubSettings.contact_youtube_url !== undefined) contactYoutubeUrl.value = pubSettings.contact_youtube_url;
        if (pubSettings.contact_company_name !== undefined) contactCompanyName.value = pubSettings.contact_company_name;
        if (pubSettings.contact_address !== undefined) contactAddress.value = pubSettings.contact_address;
        if (pubSettings.contact_working_hours !== undefined) contactWorkingHours.value = pubSettings.contact_working_hours;

        // Footer Settings
        if (pubSettings.footer_newsletter_title !== undefined) footerNewsletterTitle.value = pubSettings.footer_newsletter_title || 'ไม่พลาดโปรโมชั่นและไอเดียแต่งบ้าน';
        if (pubSettings.footer_newsletter_subtitle !== undefined) footerNewsletterSubtitle.value = pubSettings.footer_newsletter_subtitle || 'สมัครฟรี รับสิทธิ์ก่อนใคร';
        if (pubSettings.footer_newsletter_privacy !== undefined) footerNewsletterPrivacy.value = pubSettings.footer_newsletter_privacy || 'ข้อมูลปลอดภัย ยกเลิกได้ทุกเมื่อ';
        if (pubSettings.footer_trust_badges) {
            try {
                const parsed = typeof pubSettings.footer_trust_badges === 'string' ? JSON.parse(pubSettings.footer_trust_badges) : pubSettings.footer_trust_badges;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    footerTrustBadges.value = parsed;
                }
            } catch (e) {
                console.error('Failed to parse footer_trust_badges:', e);
            }
        }
        if (pubSettings.footer_distributor_label !== undefined) footerDistributorLabel.value = pubSettings.footer_distributor_label || 'ตัวแทนจำหน่าย';
        if (pubSettings.footer_distributor_url !== undefined) footerDistributorUrl.value = pubSettings.footer_distributor_url || '/ai-consultant';
        if (pubSettings.footer_sitemap_label !== undefined) footerSitemapLabel.value = pubSettings.footer_sitemap_label || 'แผนผังเว็บไซต์';
        if (pubSettings.footer_sitemap_url !== undefined) footerSitemapUrl.value = pubSettings.footer_sitemap_url || '/contact';

        // Apply dynamically to DOM
        if (storeName.value) {
            document.title = storeName.value;
        }
        if (storeFavicon.value) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = storeFavicon.value;
        }

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

    return {
        storeName,
        storeDescription,
        storeLogo,
        storeFavicon,
        storeAddress,
        storeTaxId,
        storePhone,
        warehouseLat,
        warehouseLng,
        isOnlineShoppingEnabled,
        isWishlistEnabled,
        isCompareEnabled,
        isAiConsultantEnabled,
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
