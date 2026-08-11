<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()

const apiKey = ref('');

const loadGeminiExtras = async () => {
  try {
    const [mRes, sRes] = await Promise.all([
      apiFetch('/api/ai/available-models'),
      apiFetch('/api/ai/key-status')
    ]);
    const mData = await mRes.json();
    const sData = await sRes.json();
    if (mData.success) availableModels.value = mData.models;
    if (sData.success) geminiKeyStatus.value = sData;
  } catch(e){ console.error(e); }
};
const geminiPreferredModel = ref('');
const availableModels = ref([]);
const geminiKeyStatus = ref(null);

const addModelModal = ref({
  show: false,
  id: '',
  name: '',
  description: '',
  tier: 'stable'
})

const openAddModelModal = () => {
  addModelModal.value = {
    show: true,
    id: '',
    name: '',
    description: '',
    tier: 'stable'
  }
}

const addModel = () => {
  const modelId = addModelModal.value.id.trim()
  const modelName = addModelModal.value.name.trim()
  const modelDesc = addModelModal.value.description.trim()
  const modelTier = addModelModal.value.tier

  if (!modelId) {
    showToast('กรุณากรอก Model ID', 'error')
    return
  }
  if (!modelName) {
    showToast('กรุณากรอก ชื่อโมเดล', 'error')
    return
  }

  // Check duplicate
  const exists = availableModels.value.some(m => m.id === modelId)
  if (exists) {
    showToast('Model ID นี้มีอยู่แล้วในระบบ', 'error')
    return
  }

  availableModels.value.push({
    id: modelId,
    name: modelName,
    description: modelDesc,
    tier: modelTier
  })

  addModelModal.value.show = false
  showToast('เพิ่มโมเดลสำเร็จ (กรุณากดบันทึกการตั้งค่าเพื่อบันทึกลงฐานข้อมูล)', 'success')
}

const deleteModel = (index) => {
  const modelName = availableModels.value[index].name
  availableModels.value.splice(index, 1)
  showToast(`ลบโมเดล ${modelName} สำเร็จ (กรุณากดบันทึกการตั้งค่าเพื่อบันทึกลงฐานข้อมูล)`, 'success')
}
const activeTab = ref('general')
const aiRecommendationEnabled = ref(true)
const aiWidgetDelay = ref(15)
const aiWidgetCooldown = ref(60)
const aiWidgetProductCount = ref(4)
const recentlyViewedEnabled = ref(true)
const fbtEnabled = ref(true)
const showCookieConsent = ref(true)
const cookiePurposeAnalytics = ref(true)
const cookiePurposeMarketing = ref(true)
const cookiePurposePersonalization = ref(true)
const onlineShoppingEnabled = ref(true)
const wishlistEnabled = ref(true)
const compareEnabled = ref(true)
const showProductRating = ref(true)
const showProductReview = ref(true)
const maintenanceModeEnabled = ref(false)
const maintenanceMessage = ref('ขออภัยค่ะ ขณะนี้เว็บไซต์อยู่ระหว่างการปรับปรุงระบบชั่วคราว กรุณาติดต่อทางไลน์หรือโทรศัพท์')
const holidayModeEnabled = ref(false)
const holidayMessage = ref('ร้านค้าอยู่ในช่วงวันหยุดยาว การจัดส่งอาจมีระยะเวลานานกว่าปกติ ขออภัยในความไม่สะดวกค่ะ')
const holidayName = ref('')
const holidayStartDate = ref('')
const holidayEndDate = ref('')
const holidayImage = ref('')
const uploadingHolidayImage = ref(false)
const storeName = ref('')
const storeDescription = ref('')
const storeKeywords = ref('')
const storeOgTitle = ref('')
const storeOgDescription = ref('')
const seoDefaultLlmContext = ref('ผู้เชี่ยวชาญด้านบ้านเก็บของ โกดังสำเร็จรูป และตู้เก็บของกลางแจ้ง ทนแดด ทนฝน พร้อมบริการประกอบและติดตั้งทั่วประเทศ')
const seoAiCrawlingEnabled = ref(true)

// SEO & GEO Real-Data Previewer State
const previewType = ref('home')
const previewTargetId = ref('')
const previewLoading = ref(false)
const previewData = ref(null)
const previewSubTab = ref('google') // 'google', 'social', 'ai', 'schema'
const pingingIndexNow = ref(false)

const fetchSeoPreview = async () => {
  previewLoading.value = true
  try {
    const url = `/api/settings/seo-preview?type=${previewType.value}&id=${previewTargetId.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    if (data.success) {
      previewData.value = data
    }
  } catch (e) {
    console.error('Failed to fetch SEO preview:', e)
  } finally {
    previewLoading.value = false
  }
}

const triggerIndexNowPing = async () => {
  pingingIndexNow.value = true
  try {
    const res = await apiFetch('/api/sitemap/ping-bing')
    const data = await res.json()
    if (data.success) {
      showToast(data.message || 'ส่งสัญญาณ Bing IndexNow เรียบร้อยแล้ว', 'success')
    } else {
      showToast(data.error || 'ไม่สามารถส่งสัญญาณ IndexNow ได้', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ IndexNow', 'error')
  } finally {
    pingingIndexNow.value = false
  }
}

const companyLegalName = ref('')
const storeUrl = ref('')
const storeLogo = ref('')
const storeFavicon = ref('')
const storeAddress = ref('')
const storeTaxId = ref('')
const storePhone = ref('')
const warehouseLat = ref('')
const warehouseLng = ref('')
const uploadingLogo = ref(false)
const uploadingFavicon = ref(false)
const paymentIbankingEnabled = ref(false)
const paymentPromptpayEnabled = ref(false)
const paymentBankTransferEnabled = ref(false)
const paymentIpayEnabled = ref(false)
const paymentIpayMerchantId = ref('')
const paymentPromptpayNumber = ref('')
const paymentBankAccounts = ref([])
const shippingRestrictedProvincesText = ref('')
const freeInstallProvincesText = ref('กรุงเทพมหานคร, นนทบุรี, ปทุมธานี, สมุทรปราการ, สมุทรสาคร, นครปฐม')
const shippingVolumetricDivisor = ref(5000)
const shippingDefaultWeight = ref(5)
const shippingZoneRates = ref({
  BKK: 7.00,
  EAST: 7.67,
  WEST: 7.67,
  CENTRAL: 8.72,
  NE: 8.30,
  SOUTH: 9.58,
  NORTH: 9.00,
  SOUTH_ISLAND: 9.58,
  ISLAND_REMOTE: 11.40
})
const THAI_BANKS = [
  { id: 'kbank', name: 'ธนาคารกสิกรไทย', color: '#138f2d', text: 'white' },
  { id: 'scb', name: 'ธนาคารไทยพาณิชย์', color: '#4e2e7f', text: 'white' },
  { id: 'bbl', name: 'ธนาคารกรุงเทพ', color: '#1e4598', text: 'white' },
  { id: 'ktb', name: 'ธนาคารกรุงไทย', color: '#00aeeF', text: 'white' },
  { id: 'krungsri', name: 'ธนาคารกรุงศรีอยุธยา', color: '#fec43b', text: 'gray-900' },
  { id: 'ttb', name: 'ทีเอ็มบีธนชาต (ttb)', color: '#0050f0', text: 'white' },
  { id: 'gsb', name: 'ธนาคารออมสิน', color: '#eb198d', text: 'white' },
  { id: 'baac', name: 'ธ.ก.ส.', color: '#4b8b3b', text: 'white' },
]
const notifyTelegramEnabled = ref(false)
const notifyTelegramToken = ref('')
const notifyTelegramChatId = ref('')
const notifyEmailEnabled = ref(false)
const notifyEmailList = ref([''])
const notifyBrowserEnabled = ref(false)
const notifyLineOaEnabled = ref(false)
const notifyLineOaToken = ref('')
const notifyLineOaUserId = ref('')
const testingLineOa = ref(false)

const googleLoginEnabled = ref(false)
const googleClientId = ref('')
const lineLoginEnabled = ref(false)
const lineChannelId = ref('')
const lineChannelSecret = ref('')
const loading = ref(true)
const saving = ref(false)
const testingKey = ref(false)
const testingTelegram = ref(false)
const testingEmail = ref(false)
const testingReport = ref(false)
const testingSmtp = ref(false)
const smtpHost = ref('')
const smtpPort = ref('587')
const smtpUser = ref('')
const smtpPass = ref('')
const smtpFrom = ref('')
const smtpSecure = ref(false)
const smtpTestEmail = ref('')
const exportApiKeyInput = ref('')
const apiTokenName = ref('')
const apiTokenType = ref('temporary')
const generatingToken = ref(false)
const generatedToken = ref('')
const activeApiTokens = ref([])

// Cron & Automation State
const cronSecretKey = ref('')
const cronTasks = ref([])
const loadingCronInfo = ref(false)
const runningCronTask = ref({})
const cronRunResult = ref({})
const forceLineBroadcast = ref(false)

const getTriggerUrl = (taskId) => `${window.location.origin}/api/system/cron/run?key=${cronSecretKey.value}&task=${taskId}`
const getPulseUrl = () => `${window.location.origin}/api/system/cron/pulse?key=${cronSecretKey.value}`
const getPulseCrontabCommand = () => `* * * * * curl -s "${getPulseUrl()}" >/dev/null 2>&1`
const getTaskCrontabCommand = (taskId, schedule) => `${schedule} curl -s "${getTriggerUrl(taskId)}" >/dev/null 2>&1`

const loadCronInfo = async () => {
  loadingCronInfo.value = true
  try {
    const res = await apiFetch('/api/system/cron/info')
    const data = await res.json()
    if (data.success) {
      cronSecretKey.value = data.secretKey
      cronTasks.value = data.tasks
    } else {
      showToast(data.message || 'ไม่สามารถโหลดข้อมูลระบบงานอัตโนมัติได้', 'error')
    }
  } catch (error) {
    console.error('Error loading cron info:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลระบบงานอัตโนมัติ', 'error')
  } finally {
    loadingCronInfo.value = false
  }
}

const regenerateCronSecretKey = async () => {
  try {
    const res = await apiFetch('/api/system/cron/secret-key', {
      method: 'POST'
    })
    const data = await res.json()
    if (data.success) {
      cronSecretKey.value = data.secretKey
      showToast(data.message || 'เปลี่ยนรหัสความปลอดภัยสำเร็จ', 'success')
      await loadCronInfo()
    } else {
      showToast(data.message || 'ไม่สามารถเปลี่ยนรหัสความปลอดภัยได้', 'error')
    }
  } catch (error) {
    console.error('Error regenerating secret key:', error)
    showToast('เกิดข้อผิดพลาดในการเปลี่ยนรหัสความปลอดภัย', 'error')
  }
}

const confirmKeyUpdate = async () => {
  const confirmed = await showConfirmModal(
    'ยืนยันการเปลี่ยนรหัสความปลอดภัย',
    'การเปลี่ยนรหัสความปลอดภัยจะทำให้ลิงก์สำหรับ Trigger Cron Job เดิมทั้งหมดใช้งานไม่ได้ทันที และคุณต้องไปแก้ไข URL ในการตั้งค่า external cronjob ของคุณใหม่ ยืนยันการดำเนินการหรือไม่?'
  )
  if (confirmed) {
    await regenerateCronSecretKey()
  }
}

const runCronTaskManual = async (task) => {
  const isLineBroadcast = task.id === 'line_broadcast'
  let msg = `คุณต้องการรันงานอัตโนมัติ "${task.name}" ทันทีหรือไม่?`
  if (isLineBroadcast) {
    msg += '\n\n* หมายเหตุ: หากเลือกข้ามข้อจำกัดความถี่ ระบบจะส่งบรอดแคสต์หาลูกค้าทันทีโดยไม่ตรวจสอบว่าเพิ่งส่งไปไม่นานนี้หรือไม่'
  }
  
  const confirmed = await showConfirmModal('ยืนยันการรันงานทันที', msg)
  if (!confirmed) return

  runningCronTask.value[task.id] = true
  cronRunResult.value[task.id] = null
  
  try {
    let url = `/api/system/cron/run?key=${cronSecretKey.value}&task=${task.id}`
    if (isLineBroadcast && forceLineBroadcast.value) {
      url += `&force=true`
    }
    
    const res = await apiFetch(url, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      cronRunResult.value[task.id] = {
        success: true,
        message: data.result?.message || 'รันงานสำเร็จ'
      }
      showToast(`รันงาน "${task.name}" สำเร็จ`, 'success')
    } else {
      cronRunResult.value[task.id] = {
        success: false,
        message: data.error || 'การรันงานล้มเหลว'
      }
      showToast(data.error || `รันงาน "${task.name}" ไม่สำเร็จ`, 'error')
    }
  } catch (error) {
    console.error(`Error running task ${task.id}:`, error)
    cronRunResult.value[task.id] = {
      success: false,
      message: error.message || 'การเชื่อมต่อผิดพลาด'
    }
    showToast(`เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อรันงาน`, 'error')
  } finally {
    runningCronTask.value[task.id] = false
  }
}

const confirmModal = ref({ show: false, title: '', message: '', onConfirm: null })
const showConfirmModal = (title, message) => {
  return new Promise((resolve) => {
    confirmModal.value = {
      show: true, title, message,
      onConfirm: () => { confirmModal.value.show = false; resolve(true) },
      onCancel: () => { confirmModal.value.show = false; resolve(false) }
    }
  })
}
const guideModal = ref({ show: false, title: '', content: '' })
const openGuide = (type) => {
  const guides = {
    line_oa: { title: 'คู่มือตั้งค่า LINE OA', content: '<p>เข้า LINE Developers สร้าง Channel Messaging API แล้วนำ Token และ User ID มาใช้</p>' },
    telegram: { title: 'คู่มือ Telegram Bot', content: '<p>ค้นหา @BotFather สร้าง Bot แล้วนำ Token และ Chat ID มาวาง</p>' },
    gemini: { title: 'คู่มือ Gemini AI', content: '<p>เข้า Google AI Studio กด Get API key แล้วนำมาวาง</p>' },
    smtp: { title: 'คู่มือ SMTP', content: '<p>Gmail: smtp.gmail.com Port 587 ใช้ App Passwords</p>' },
    ipay: { title: 'คู่มือ iPay', content: '<p>สมัคร BBL iPay แล้วนำ Merchant ID มากรอก</p>' },
    google_login: { title: 'Google Login', content: '<p>สร้าง OAuth client ID ใน Google Cloud Console</p>' },
    line_login: { title: 'LINE Login', content: '<p>สร้าง Channel LINE Login นำ Channel ID และ secret มาวาง</p>' }
  }
  if (guides[type]) { guideModal.value = { show: true, ...guides[type] } }
}

const loadSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      if (data.data.gemini_api_key) {
        apiKey.value = data.data.gemini_api_key
      }
      if (data.data.ai_recommendation_enabled !== undefined) {
        aiRecommendationEnabled.value = data.data.ai_recommendation_enabled === 'true'
      }
      if (data.data.ai_widget_delay !== undefined) {
        aiWidgetDelay.value = parseInt(data.data.ai_widget_delay) || 15
      }
      if (data.data.ai_widget_cooldown !== undefined) {
        aiWidgetCooldown.value = parseInt(data.data.ai_widget_cooldown) || 60
      }
      if (data.data.show_cookie_consent !== undefined) {
        showCookieConsent.value = data.data.show_cookie_consent === 'true'
      }
      if (data.data.cookie_purpose_analytics !== undefined) {
        cookiePurposeAnalytics.value = data.data.cookie_purpose_analytics === 'true'
      }
      if (data.data.cookie_purpose_marketing !== undefined) {
        cookiePurposeMarketing.value = data.data.cookie_purpose_marketing === 'true'
      }
      if (data.data.cookie_purpose_personalization !== undefined) {
        cookiePurposePersonalization.value = data.data.cookie_purpose_personalization === 'true'
      }
      if (data.data.online_shopping_enabled !== undefined) {
        onlineShoppingEnabled.value = data.data.online_shopping_enabled === 'true'
      }
      if (data.data.wishlist_enabled !== undefined) {
        wishlistEnabled.value = data.data.wishlist_enabled === 'true'
      }
      if (data.data.compare_enabled !== undefined) {
        compareEnabled.value = data.data.compare_enabled === 'true'
      }
      if (data.data.show_product_rating !== undefined) {
        showProductRating.value = data.data.show_product_rating === 'true'
      }
      if (data.data.show_product_review !== undefined) {
        showProductReview.value = data.data.show_product_review === 'true'
      }

      // Maintenance & Holiday Modes loading
      if (data.data.maintenance_mode_enabled !== undefined) {
        maintenanceModeEnabled.value = data.data.maintenance_mode_enabled === 'true'
      }
      if (data.data.maintenance_message !== undefined) {
        maintenanceMessage.value = data.data.maintenance_message
      }
      if (data.data.holiday_mode_enabled !== undefined) {
        holidayModeEnabled.value = data.data.holiday_mode_enabled === 'true'
      }
      // Load Store Settings
      if (data.data.store_name !== undefined) storeName.value = data.data.store_name
      if (data.data.store_description !== undefined) storeDescription.value = data.data.store_description
      if (data.data.store_keywords !== undefined) storeKeywords.value = data.data.store_keywords
      if (data.data.store_og_title !== undefined) storeOgTitle.value = data.data.store_og_title
      if (data.data.store_og_description !== undefined) storeOgDescription.value = data.data.store_og_description
      if (data.data.seo_default_llm_context !== undefined) seoDefaultLlmContext.value = data.data.seo_default_llm_context
      if (data.data.seo_ai_crawling_enabled !== undefined) seoAiCrawlingEnabled.value = data.data.seo_ai_crawling_enabled === 'true'
      if (data.data.company_legal_name !== undefined) companyLegalName.value = data.data.company_legal_name
      if (data.data.store_url !== undefined) storeUrl.value = data.data.store_url
      if (data.data.store_logo !== undefined) storeLogo.value = data.data.store_logo
      if (data.data.store_favicon !== undefined) storeFavicon.value = data.data.store_favicon
      if (data.data.store_address !== undefined) storeAddress.value = data.data.store_address
      if (data.data.store_tax_id !== undefined) storeTaxId.value = data.data.store_tax_id
      if (data.data.store_phone !== undefined) storePhone.value = data.data.store_phone
      if (data.data.warehouse_lat !== undefined) warehouseLat.value = data.data.warehouse_lat
      if (data.data.warehouse_lng !== undefined) warehouseLng.value = data.data.warehouse_lng

      // Load Payment Settings
      if (data.data.payment_ibanking_enabled !== undefined) {
        paymentIbankingEnabled.value = data.data.payment_ibanking_enabled === 'true'
      }
      if (data.data.payment_promptpay_enabled !== undefined) {
        paymentPromptpayEnabled.value = data.data.payment_promptpay_enabled === 'true'
      }
      if (data.data.payment_bank_transfer_enabled !== undefined) {
        paymentBankTransferEnabled.value = data.data.payment_bank_transfer_enabled === 'true'
      }
      if (data.data.payment_ipay_enabled !== undefined) {
        paymentIpayEnabled.value = data.data.payment_ipay_enabled === 'true'
      }
      if (data.data.payment_ipay_merchant_id) {
        paymentIpayMerchantId.value = data.data.payment_ipay_merchant_id
      }
      if (data.data.payment_bank_accounts) {
        try {
          paymentBankAccounts.value = typeof data.data.payment_bank_accounts === 'string'
            ? JSON.parse(data.data.payment_bank_accounts)
            : data.data.payment_bank_accounts;
        } catch (e) {
          console.error('Failed to parse payment_bank_accounts', e)
        }
      }
      if (data.data.payment_promptpay_number) {
        paymentPromptpayNumber.value = data.data.payment_promptpay_number
      }

      // Load Shipping Restrictions
      if (data.data.shipping_restricted_provinces) {
        try {
          const parsed = JSON.parse(data.data.shipping_restricted_provinces)
          if (Array.isArray(parsed)) {
            shippingRestrictedProvincesText.value = parsed.join(', ')
          }
        } catch (e) {
          console.error("Failed to parse shipping_restricted_provinces")
        }
      }

      // Load Free Install Provinces
      if (data.data.free_install_provinces) {
        try {
          const parsed = JSON.parse(data.data.free_install_provinces)
          if (Array.isArray(parsed) && parsed.length > 0) {
            freeInstallProvincesText.value = parsed.join(', ')
          }
        } catch (e) {
          console.error("Failed to parse free_install_provinces")
        }
      }

      // Load Shipping Formula Config
      if (data.data.shipping_formula_config) {
        try {
          const parsed = JSON.parse(data.data.shipping_formula_config)
          if (parsed.volumetricDivisor) shippingVolumetricDivisor.value = parsed.volumetricDivisor
          if (parsed.defaultWeightPerItem) shippingDefaultWeight.value = parsed.defaultWeightPerItem
          if (parsed.zoneRates) {
            shippingZoneRates.value = { ...shippingZoneRates.value, ...parsed.zoneRates }
          }
        } catch (e) {
          console.error("Failed to parse shipping_formula_config")
        }
      }

      // Load Notification Settings
      if (data.data.notify_telegram_enabled !== undefined) {
        notifyTelegramEnabled.value = data.data.notify_telegram_enabled === 'true'
      }
      if (data.data.notify_telegram_token) {
        notifyTelegramToken.value = data.data.notify_telegram_token
      }
      if (data.data.notify_telegram_chat_id) {
        notifyTelegramChatId.value = data.data.notify_telegram_chat_id
      }
      if (data.data.notify_line_oa_enabled !== undefined) {
        notifyLineOaEnabled.value = data.data.notify_line_oa_enabled === 'true'
      }
      if (data.data.notify_line_oa_token) {
        notifyLineOaToken.value = data.data.notify_line_oa_token
      }
      if (data.data.notify_line_oa_user_id) {
        notifyLineOaUserId.value = data.data.notify_line_oa_user_id
      }
      if (data.data.notify_email_enabled !== undefined) {
        notifyEmailEnabled.value = data.data.notify_email_enabled === 'true'
      }
      if (data.data.notify_email_address) {
        const emails = data.data.notify_email_address.split(',').map(e => e.trim()).filter(e => e)
        if (emails.length > 0) {
          notifyEmailList.value = emails
        }
      }
      if (data.data.notify_browser_enabled !== undefined) {
        notifyBrowserEnabled.value = data.data.notify_browser_enabled === 'true'
      }
      

      if (data.data.google_login_enabled !== undefined) {
        googleLoginEnabled.value = data.data.google_login_enabled === 'true'
      }
      if (data.data.google_client_id) {
        googleClientId.value = data.data.google_client_id
      }
      if (data.data.line_login_enabled !== undefined) {
        lineLoginEnabled.value = data.data.line_login_enabled === 'true'
      }
      if (data.data.line_channel_id) {
        lineChannelId.value = data.data.line_channel_id
      }
      if (data.data.line_channel_secret) {
        lineChannelSecret.value = data.data.line_channel_secret
      }

      // Load SMTP Settings
      if (data.data.smtp_host) smtpHost.value = data.data.smtp_host
      if (data.data.smtp_port) smtpPort.value = data.data.smtp_port
      if (data.data.smtp_user) smtpUser.value = data.data.smtp_user
      if (data.data.smtp_password) smtpPass.value = data.data.smtp_password
      if (data.data.smtp_from_name) smtpFrom.value = data.data.smtp_from_name
      if (data.data.smtp_secure !== undefined) smtpSecure.value = data.data.smtp_secure === 'true'
    }
    
    // Load dynamic Gemini configurations
    await loadGeminiExtras()

    // Load API Tokens
    await fetchApiTokens()

    // Load Cron Info
    await loadCronInfo()

    // Fetch live SEO real data preview
    await fetchSeoPreview()
  } catch (error) {
    if (error.message !== 'Unexpected end of JSON input') {
      console.error('Failed to load settings:', error)
    }
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const settingsPayload = [
      { key: 'gemini_api_key', value: apiKey.value },
      { key: 'gemini_preferred_model', value: geminiPreferredModel.value },

      { key: 'ai_recommendation_enabled', value: aiRecommendationEnabled.value.toString() },
      { key: 'ai_widget_delay', value: aiWidgetDelay.value.toString() },
      { key: 'ai_widget_cooldown', value: aiWidgetCooldown.value.toString() },
      { key: 'ai_widget_product_count', value: aiWidgetProductCount.value.toString() },
      { key: 'recently_viewed_enabled', value: recentlyViewedEnabled.value.toString() },
      { key: 'fbt_enabled', value: fbtEnabled.value.toString() },
      { key: 'show_cookie_consent', value: showCookieConsent.value.toString() },
      { key: 'cookie_purpose_analytics', value: cookiePurposeAnalytics.value.toString() },
      { key: 'cookie_purpose_marketing', value: cookiePurposeMarketing.value.toString() },
      { key: 'cookie_purpose_personalization', value: cookiePurposePersonalization.value.toString() },
      { key: 'online_shopping_enabled', value: onlineShoppingEnabled.value.toString() },
      { key: 'wishlist_enabled', value: wishlistEnabled.value.toString() },
      { key: 'compare_enabled', value: compareEnabled.value.toString() },
      { key: 'show_product_rating', value: showProductRating.value.toString() },
      { key: 'show_product_review', value: showProductReview.value.toString() },
      
      // Maintenance & Holiday Settings
      { key: 'maintenance_mode_enabled', value: maintenanceModeEnabled.value.toString() },
      { key: 'maintenance_message', value: maintenanceMessage.value },
      { key: 'holiday_mode_enabled', value: holidayModeEnabled.value.toString() },
      { key: 'holiday_message', value: holidayMessage.value },
      { key: 'holiday_name', value: holidayName.value },
      { key: 'holiday_start_date', value: holidayStartDate.value },
      { key: 'holiday_end_date', value: holidayEndDate.value },
      { key: 'holiday_image', value: holidayImage.value },
      
      // Store Settings
      { key: 'store_name', value: storeName.value },
      { key: 'store_description', value: storeDescription.value },
      { key: 'store_keywords', value: storeKeywords.value },
      { key: 'store_og_title', value: storeOgTitle.value },
      { key: 'store_og_description', value: storeOgDescription.value },
      { key: 'seo_default_llm_context', value: seoDefaultLlmContext.value },
      { key: 'seo_ai_crawling_enabled', value: seoAiCrawlingEnabled.value.toString() },
      { key: 'company_legal_name', value: companyLegalName.value },
      { key: 'store_url', value: storeUrl.value },
      { key: 'store_logo', value: storeLogo.value },
      { key: 'store_favicon', value: storeFavicon.value },
      { key: 'store_address', value: storeAddress.value },
      { key: 'store_tax_id', value: storeTaxId.value },
      { key: 'store_phone', value: storePhone.value },
      { key: 'warehouse_lat', value: warehouseLat.value },
      { key: 'warehouse_lng', value: warehouseLng.value },

      // Payment Settings
      { key: 'payment_ibanking_enabled', value: paymentIbankingEnabled.value.toString() },
      { key: 'payment_promptpay_enabled', value: paymentPromptpayEnabled.value.toString() },
      { key: 'payment_bank_transfer_enabled', value: paymentBankTransferEnabled.value.toString() },
      { key: 'payment_ipay_enabled', value: paymentIpayEnabled.value.toString() },
      { key: 'payment_ipay_merchant_id', value: paymentIpayMerchantId.value },
      { key: 'payment_bank_accounts', value: JSON.stringify(paymentBankAccounts.value.filter(b => b.bank && b.name && b.number)) },
      { key: 'payment_promptpay_number', value: paymentPromptpayNumber.value },

      // Shipping Restrictions & Free Install
      { key: 'shipping_restricted_provinces', value: JSON.stringify(shippingRestrictedProvincesText.value.split(',').map(s => s.trim()).filter(Boolean)) },
      { key: 'free_install_provinces', value: JSON.stringify(freeInstallProvincesText.value.split(',').map(s => s.trim()).filter(Boolean)) },
      { key: 'shipping_formula_config', value: JSON.stringify({
          volumetricDivisor: shippingVolumetricDivisor.value,
          defaultWeightPerItem: shippingDefaultWeight.value,
          zoneRates: shippingZoneRates.value
      }) },

      // Notification Settings
      { key: 'notify_telegram_enabled', value: notifyTelegramEnabled.value.toString() },
      { key: 'notify_telegram_token', value: notifyTelegramToken.value },
      { key: 'notify_telegram_chat_id', value: notifyTelegramChatId.value },
      { key: 'notify_line_oa_enabled', value: notifyLineOaEnabled.value.toString() },
      { key: 'notify_line_oa_token', value: notifyLineOaToken.value },
      { key: 'notify_line_oa_user_id', value: notifyLineOaUserId.value },
      { key: 'notify_email_enabled', value: notifyEmailEnabled.value.toString() },
      { key: 'notify_email_address', value: notifyEmailList.value.filter(e => e.trim()).join(',') },
      { key: 'notify_browser_enabled', value: notifyBrowserEnabled.value.toString() },
      // Social Login Settings
      { key: 'google_login_enabled', value: googleLoginEnabled.value.toString() },
      { key: 'google_client_id', value: googleClientId.value },
      { key: 'line_login_enabled', value: lineLoginEnabled.value.toString() },
      { key: 'line_channel_id', value: lineChannelId.value },
      { key: 'line_channel_secret', value: lineChannelSecret.value },

      // SMTP Settings (stored encrypted keys)
      { key: 'smtp_host', value: smtpHost.value },
      { key: 'smtp_port', value: smtpPort.value },
      { key: 'smtp_user', value: smtpUser.value },
      { key: 'smtp_password', value: smtpPass.value },
      { key: 'smtp_from_name', value: smtpFrom.value },
      { key: 'smtp_secure', value: smtpSecure.value.toString() }
    ]

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: settingsPayload })
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกการตั้งค่าสำเร็จ', 'success')
    } else {
      showToast('บันทึกการตั้งค่าไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    saving.value = false
  }
}

const handleLogoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  uploadingLogo.value = true
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      storeLogo.value = data.url
      showToast('อัปโหลดโลโก้สำเร็จ', 'success')
    } else {
      showToast(data.error || 'ไม่สามารถอัปโหลดรูปภาพได้', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    uploadingLogo.value = false
    event.target.value = '' // reset input
  }
}

const handleFaviconUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  uploadingFavicon.value = true
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      storeFavicon.value = data.url
      showToast('อัปโหลด Favicon สำเร็จ', 'success')
    } else {
      showToast(data.error || 'ไม่สามารถอัปโหลดรูปภาพได้', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    uploadingFavicon.value = false
    event.target.value = '' // reset input
  }
}

const handleHolidayImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  // Ensure the server handles 'image' key via multer
  formData.append('image', file)

  uploadingHolidayImage.value = true
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      holidayImage.value = data.url
      showToast('อัปโหลดรูปภาพแบนเนอร์สำเร็จ', 'success')
    } else {
      showToast(data.error || 'ไม่สามารถอัปโหลดรูปภาพได้', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    uploadingHolidayImage.value = false
    event.target.value = ''
  }
}

const testApiKey = async () => {
  if (!apiKey.value) {
    showToast('กรุณากรอก API Key ก่อนทำการทดสอบ', 'warning')
    return
  }

  testingKey.value = true
  try {
    const res = await apiFetch('/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: apiKey.value })
    })
    const data = await res.json()
    if (data.success) {
      showToast('สถานะ: ใช้งานได้ปกติ (Connected)', 'success')
    } else {
      showToast('สถานะ: ไม่สามารถใช้งานได้ โปรดตรวจสอบ Key อีกครั้ง', 'error')
      console.error(data.error)
    }
  } catch (error) {
    console.error('Test API Key error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อทดสอบ', 'error')
  } finally {
    testingKey.value = false
  }
}

const addEmailField = () => {
  notifyEmailList.value.push('')
}

const removeEmailField = (index) => {
  if (notifyEmailList.value.length > 1) {
    notifyEmailList.value.splice(index, 1)
  } else {
    notifyEmailList.value[0] = ''
  }
}

const addBankAccount = () => {
  paymentBankAccounts.value.push({ bank: '', name: '', number: '' })
}

const removeBankAccount = (index) => {
  paymentBankAccounts.value.splice(index, 1)
}

const testTelegram = async () => {
  if (!notifyTelegramToken.value || !notifyTelegramChatId.value) {
    showToast('กรุณากรอก Bot Token และ Chat ID ก่อนทดสอบ', 'error')
    return
  }
  
  try {
    testingTelegram.value = true
    const res = await apiFetch('/api/settings/test-notification', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'telegram',
        token: notifyTelegramToken.value,
        chatId: notifyTelegramChatId.value
      })
    })
    
    const data = await res.json()
    
    if (res.ok && data.success) {
      showToast('ส่งข้อความทดสอบ Telegram สำเร็จ', 'success')
    } else {
      throw new Error(data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('Test Telegram error:', error)
    showToast(`เกิดข้อผิดพลาด: ${error.message || 'ตรวจสอบ Token และ Chat ID อีกครั้ง'}`, 'error')
  } finally {
    testingTelegram.value = false
  }
}

const testLineOa = async () => {
  if (!notifyLineOaToken.value || !notifyLineOaUserId.value) {
    showToast('กรุณากรอก Channel Access Token และ Admin User ID ก่อนทดสอบ', 'error')
    return
  }
  
  try {
    testingLineOa.value = true
    const res = await apiFetch('/api/settings/test-notification', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'lineoa',
        token: notifyLineOaToken.value,
        userId: notifyLineOaUserId.value
      })
    })
    
    const data = await res.json()
    
    if (res.ok && data.success) {
      showToast('ส่งข้อความทดสอบ LINE OA สำเร็จ', 'success')
    } else {
      throw new Error(data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('Test LINE OA error:', error)
    showToast(`เกิดข้อผิดพลาด: ${error.message || 'ตรวจสอบ Token และ User ID อีกครั้ง'}`, 'error')
  } finally {
    testingLineOa.value = false
  }
}

const testEmail = async () => {
  const validEmails = notifyEmailList.value.filter(e => e.trim())
  if (validEmails.length === 0) {
    showToast('กรุณากรอกอีเมลอย่างน้อย 1 อีเมลก่อนทดสอบ', 'error')
    return
  }

  try {
    testingEmail.value = true
    const res = await apiFetch('/api/settings/test-notification', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'email',
        emails: validEmails
      })
    })

    const data = await res.json()

    if (res.ok && data.success) {
      showToast('ส่งอีเมลทดสอบสำเร็จ', 'success')
    } else {
      throw new Error(data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('Test Email error:', error)
    showToast(`เกิดข้อผิดพลาด: ${error.message || 'โปรดตรวจสอบการตั้งค่า SMTP'}`, 'error')
  } finally {
    testingEmail.value = false
  }
}

const testReport = async () => {
  try {
    testingReport.value = true
    const res = await apiFetch('/api/settings/test-report', {
      method: 'POST',
      body: JSON.stringify({})
    })
    const data = await res.json()
    if (res.ok && data.success) {
      showToast('ส่งรายงานประจำวันไปที่ Telegram เรียบร้อย!', 'success')
    } else {
      throw new Error(data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('Test report error:', error)
    showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error')
  } finally {
    testingReport.value = false
  }
}

const testSmtp = async () => {
  if (!smtpHost.value || !smtpUser.value || !smtpPass.value) {
    showToast('กรุณากรอก Host, User และ Password ก่อนทดสอบ', 'error')
    return
  }
  const toEmail = smtpTestEmail.value.trim() || smtpUser.value
  try {
    testingSmtp.value = true
    const res = await apiFetch('/api/settings/test-smtp', {
      method: 'POST',
      body: JSON.stringify({
        host: smtpHost.value, port: smtpPort.value,
        user: smtpUser.value, pass: smtpPass.value,
        secure: smtpSecure.value, from: smtpFrom.value,
        to: toEmail
      })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      showToast(`ส่ง Email ทดสอบไป ${toEmail} สำเร็จ!`, 'success')
    } else {
      showToast(`ส่งไม่สำเร็จ: ${data.error}`, 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    testingSmtp.value = false
  }
}

const generateApiToken = async () => {
  if (!exportApiKeyInput.value) {
    showToast('กรุณากรอก Master API Key', 'error')
    return
  }
  generatingToken.value = true
  generatedToken.value = ''
  if (!apiTokenName.value.trim()) {
    toast.error('กรุณาระบุชื่อ Token เพื่อช่วยจำ')
    generatingToken.value = false
    return
  }

  try {
    const res = await apiFetch('/api/admin/api-token', {
      method: 'POST',
      body: JSON.stringify({ 
        api_key: exportApiKeyInput.value, 
        type: apiTokenType.value,
        name: apiTokenName.value.trim() 
      })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      generatedToken.value = data.token
      apiTokenName.value = ''
      showToast('สร้าง API Token สำเร็จ', 'success')
      await fetchApiTokens()
    } else {
      showToast(data.error || 'Master API Key ไม่ถูกต้อง', 'error')
    }
  } catch (error) {
    console.error('Generate token error:', error)
    showToast('เกิดข้อผิดพลาดในการขอ Token', 'error')
  } finally {
    generatingToken.value = false
  }
}

const copyToken = () => {
  if (!generatedToken.value) return
  navigator.clipboard.writeText(generatedToken.value)
  showToast('คัดลอก Token สำเร็จ', 'success')
}

// Key Input Helpers (Copy / Paste / Clear)
const copyToClipboard = (value) => {
  if (!value) return
  navigator.clipboard.writeText(value)
    .then(() => showToast('\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27', 'success'))
    .catch(() => showToast('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e44\u0e14\u0e49', 'error'))
}

const pasteFromClipboard = async (refObj) => {
  try {
    const text = await navigator.clipboard.readText()
    refObj.value = text
    showToast('\u0e27\u0e32\u0e07\u0e08\u0e32\u0e01\u0e04\u0e25\u0e34\u0e1b\u0e1a\u0e2d\u0e23\u0e4c\u0e14\u0e41\u0e25\u0e49\u0e27', 'success')
  } catch (e) {
    showToast('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e27\u0e32\u0e07\u0e44\u0e14\u0e49', 'error')
  }
}

const clearField = (refObj) => {
  refObj.value = ''
}

const copyTokenFromList = (tokenStr) => {
  navigator.clipboard.writeText(tokenStr)
    .then(() => showToast('คัดลอก Token ลงคลิปบอร์ดแล้ว', 'success'))
    .catch(() => showToast('ไม่สามารถคัดลอกได้', 'error'))
}

// Fetch all active API tokens
const fetchApiTokens = async () => {
  try {
    const res = await apiFetch('/api/admin/api-tokens')
    const data = await res.json()
    if (res.ok && data.success) {
      activeApiTokens.value = data.data
    }
  } catch (error) {
    console.error('Error fetching api tokens:', error)
  }
}

// Revoke an active API token
const revokeToken = async (id) => {
  const confirmed = await showConfirmModal(
    'เพิกถอน Token',
    'คุณแน่ใจหรือไม่ว่าต้องการเพิกถอน Token นี้? ระบบที่ใช้งานอยู่จะถูกตัดการเชื่อมต่อทันที'
  )
  if (!confirmed) return
  try {
    const res = await apiFetch(`/api/admin/api-tokens/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok && data.success) {
      showToast('เพิกถอน Token สำเร็จ', 'success')
      await fetchApiTokens()
    } else {
      showToast(data.error || 'ไม่สามารถเพิกถอน Token ได้', 'error')
    }
  } catch (error) {
    console.error('Error revoking token:', error)
    showToast('เกิดข้อผิดพลาดในการเพิกถอน Token', 'error')
  }
}

const requestNotificationPermission = async () => {
  if (notifyBrowserEnabled.value) {
    if (!("Notification" in window)) {
      showToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน (Desktop Notifications)", "error");
      notifyBrowserEnabled.value = false;
    } else if (Notification.permission === "granted") {
      showToast("อนุญาตการแจ้งเตือนบนเบราว์เซอร์แล้ว", "success");
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        showToast("เปิดใช้งานการแจ้งเตือนสำเร็จ", "success");
      } else {
        notifyBrowserEnabled.value = false;
        showToast("คุณปฏิเสธการแจ้งเตือน", "error");
      }
    } else {
      notifyBrowserEnabled.value = false;
      showToast("คุณตั้งค่าปิดกั้นการแจ้งเตือนไว้ในเบราว์เซอร์", "error");
    }
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="h-full flex flex-col relative pb-32">
    <div class="mb-4">
      <h1 class="text-2xl font-black text-gray-900 tracking-tight">ตั้งค่าระบบ (System Settings)</h1>
      <p class="text-sm text-gray-500 mt-1">จัดการตั้งค่าพื้นฐานของเว็บไซต์ และการเชื่อมต่อต่างๆ</p>
    </div>

    <!-- TABS NAVIGATION (MODERN SEGMENTED) -->
    <div class="mb-8 pb-2">
      <nav class="flex flex-wrap bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl gap-1" aria-label="Tabs">
        <!-- Tab: General -->
        <button @click="activeTab = 'general'" :class="[activeTab === 'general' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'general' ? 'text-indigo-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          ข้อมูลร้านค้า (General)
        </button>

        <!-- Tab: System -->
        <button @click="activeTab = 'system'" :class="[activeTab === 'system' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'system' ? 'text-indigo-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          ระบบเว็บ (System)
        </button>

        <!-- Tab: Payments -->
        <button @click="activeTab = 'payment'" :class="[activeTab === 'payment' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'payment' ? 'text-indigo-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          การชำระเงิน (Payments)
        </button>

        <!-- Tab: Notifications -->
        <button @click="activeTab = 'notification'" :class="[activeTab === 'notification' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'notification' ? 'text-indigo-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          การแจ้งเตือน (Notifications)
        </button>

        <!-- Tab: Integrations -->
        <button @click="activeTab = 'integration'" :class="[activeTab === 'integration' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'integration' ? 'text-indigo-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          AI & เชื่อมต่อ (Integrations)
        </button>

        <!-- Tab: SMTP Email -->
        <button @click="activeTab = 'smtp'" :class="[activeTab === 'smtp' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'smtp' ? 'text-emerald-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          SMTP Email
        </button>

        <!-- Tab: Shipping -->
        <button @click="activeTab = 'shipping'" :class="[activeTab === 'shipping' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'shipping' ? 'text-emerald-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          การจัดส่ง (Shipping)
        </button>

        <!-- Tab: Cron Jobs -->
        <button type="button" @click="activeTab = 'cron'" :class="[activeTab === 'cron' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'cron' ? 'text-indigo-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          งานอัตโนมัติ (Cron Jobs)
        </button>

        <!-- Tab: SEO & AI (GEO Engine) -->
        <button type="button" @click="activeTab = 'seo'" :class="[activeTab === 'seo' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60', 'group flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap']">
          <svg class="w-4 h-4" :class="activeTab === 'seo' ? 'text-white' : 'text-amber-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          SEO & AI (GEO Engine)
        </button>
      </nav>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 font-medium">
      <div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
      กำลังดึงข้อมูลการตั้งค่า...
    </div>

    <div v-else class="w-full">
      <form id="settings-form" @submit.prevent="saveSettings" class="relative space-y-8">
        

        <!-- ======================= -->
        <!-- 1. GENERAL TAB -->
        <!-- ======================= -->
        <div v-if="activeTab === 'general'" class="space-y-8 animate-fade-in-up">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
<!-- Store Profile Settings -->
            <div class="p-8 border-b border-gray-100">
              <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                ข้อมูลร้านค้า (Store Profile)
              </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Branding Graphics -->
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">โลโก้ร้านค้าหลัก (Main Logo)</label>
                <div class="flex items-center gap-4">
                  <div class="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <img v-if="storeLogo" :src="storeLogo" class="max-w-full max-h-full object-contain p-2" />
                    <svg v-else class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div class="flex-1">
                    <label class="px-4 py-2 bg-white text-gray-700 font-bold text-sm rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors" :class="{ 'opacity-50': uploadingLogo }">
                      {{ uploadingLogo ? 'กำลังอัปโหลด...' : 'เปลี่ยนโลโก้' }}
                      <input type="file" class="hidden" accept="image/*" @change="handleLogoUpload" :disabled="uploadingLogo">
                    </label>
                    <p class="text-xs text-gray-500 mt-2">ขนาดแนะนำ: แนวนอน 400x120px, พื้นหลังโปร่งใส (.PNG)</p>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">ไอคอนร้านค้า (Favicon)</label>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    <img v-if="storeFavicon" :src="storeFavicon" class="w-full h-full object-cover" />
                    <svg v-else class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div class="flex-1">
                    <label class="px-3 py-1.5 bg-white text-gray-700 font-bold text-xs rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors" :class="{ 'opacity-50': uploadingFavicon }">
                      {{ uploadingFavicon ? 'กำลังอัปโหลด...' : 'เปลี่ยนไอคอน' }}
                      <input type="file" class="hidden" accept="image/png,image/x-icon,image/jpeg" @change="handleFaviconUpload" :disabled="uploadingFavicon">
                    </label>
                    <p class="text-[10px] text-gray-500 mt-1.5">ขนาดจัตุรัส 64x64px (.PNG / .ICO) ปรากฏบนแท็บเบราว์เซอร์</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Basic Info -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">ชื่อร้านค้า (Store Name) *ประดับบน Title bar</label>
                <input v-model="storeName" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">ลิงก์เว็บไซต์หลัก (Store URL)</label>
                <input v-model="storeUrl" type="url" placeholder="https://www.yourdomain.com" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                <p class="text-xs text-gray-500 mt-1">ใช้เป็นลิงก์อ้างอิงในระบบอีเมลอัตโนมัติ (Newsletter)</p>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">เบอร์โทรศัพท์ร้าน</label>
                <input v-model="storePhone" type="text" placeholder="02-XXX-XXXX" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">ชื่อบริษัท / นิติบุคคล (Company Legal Name)</label>
                <input v-model="companyLegalName" type="text" placeholder="เช่น บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี (TAX ID)</label>
                <input v-model="storeTaxId" type="text" placeholder="010XXXXXXXXXX" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
            </div>
          </div>
          
          <div class="space-y-4 pt-4 border-t border-gray-100">
            <h3 class="text-md font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              การตั้งค่า SEO & Social Sharing (Search Engine & Open Graph)
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">รายละเอียดเว็บไซต์หลัก (Site Meta Description)</label>
                <textarea v-model="storeDescription" rows="3" placeholder="ระบุรายละเอียดสั้นๆ สำหรับแสดงในผลการค้นหา Google (แนะนำ 120-160 ตัวอักษร)" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">คำค้นหาหลัก (Site Meta Keywords)</label>
                <textarea v-model="storeKeywords" rows="3" placeholder="เช่น บ้านเก็บของ, ตู้เก็บของกลางแจ้ง, โกดังเก็บของ, ห้องเก็บของ" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อแสดงผลบนโซเชียล (OG / Social Title)</label>
                <input v-model="storeOgTitle" type="text" placeholder="เช่น STORAGE HOUSE - บ้านเก็บของและโรงเรือนสำเร็จรูประดับพรีเมียม" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายบนโซเชียล (OG / Social Description)</label>
                <input v-model="storeOgDescription" type="text" placeholder="เช่น จำหน่ายและติดตั้งบ้านเก็บของ โรงเรือนสำเร็จรูป คุณภาพพรีเมียม" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-100">
            <label class="block text-sm font-bold text-gray-700 mb-1">ที่อยู่ร้านค้าแบบเต็ม (จัดแสดงบนใบหน้าบิล/PDF)</label>
            <textarea v-model="storeAddress" rows="2" placeholder="กรอกที่อยู่บริษัท, อาคาร, ชั้น, ถนน, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>
        </div>

        
<!-- Warehouse Info -->
        <div class="p-8 border-b border-gray-100 bg-emerald-50/30">
          <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            พิกัดคลังสินค้า (Warehouse Location)
          </h2>
          <p class="text-sm text-gray-600 mb-4">จัดเก็บพิกัดเพื่อรองรับการคำนวณค่าจัดส่งตามระยะทางจริงในอนาคต (Distance-based Delivery)</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">ละติจูด (Latitude)</label>
              <input v-model="warehouseLat" type="text" placeholder="เช่น 13.7563" class="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">ลองจิจูด (Longitude)</label>
              <input v-model="warehouseLng" type="text" placeholder="เช่น 100.5018" class="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
            </div>
          </div>
        </div>
        
        
          </div>
        </div>

        <!-- ======================= -->
        <!-- SHIPPING TAB -->
        <!-- ======================= -->
        <div v-if="activeTab === 'shipping'" class="space-y-8 animate-fade-in-up">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            <!-- Shipping Restrictions Settings -->
            <div class="p-8 border-b border-gray-100">
              <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                พื้นที่งดให้บริการจัดส่ง (Restricted Shipping Zones)
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">จังหวัดที่ไม่มีบริการจัดส่ง</label>
                  <textarea v-model="shippingRestrictedProvincesText" rows="3" placeholder="เช่น ปัตตานี, ยะลา, นราธิวาส (คั่นด้วยลูกน้ำ)" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                  <p class="text-xs text-gray-500 mt-2">พิมพ์ชื่อจังหวัดที่ต้องการปิดรับออร์เดอร์ โดยคั่นด้วยลูกน้ำ (,)</p>
                </div>
              </div>
            </div>

            <!-- Free Installation Settings -->
            <div class="p-8 border-b border-gray-100">
              <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                จังหวัดที่ติดตั้งฟรี (Free Installation Provinces)
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">ระบุจังหวัดที่ติดตั้งฟรี</label>
                  <textarea v-model="freeInstallProvincesText" rows="3" placeholder="เช่น กรุงเทพมหานคร, นนทบุรี, ปทุมธานี (คั่นด้วยลูกน้ำ)" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"></textarea>
                  <p class="text-xs text-gray-500 mt-2">พิมพ์ชื่อจังหวัดที่ลูกค้าไม่ต้องเสียค่าติดตั้ง โดยคั่นด้วยลูกน้ำ (,)</p>
                  <div class="mt-3">
                    <button type="button" @click="freeInstallProvincesText = 'กรุงเทพมหานคร, นนทบุรี, ปทุมธานี, สมุทรปราการ, สมุทรสาคร, นครปฐม'" class="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                      ใช้ค่าเริ่มต้น (กทม.และปริมณฑล)
                    </button>
                  </div>
                </div>
                <div class="bg-teal-50 rounded-xl p-4 border border-teal-100">
                  <h4 class="font-bold text-teal-800 text-sm mb-2">แสดงผลในหน้ารายละเอียดสินค้า:</h4>
                  <p class="text-xs text-teal-700 mb-3 leading-relaxed">
                    ระบบจะตรวจสอบรายชื่อจังหวัดนี้ เมื่อลูกค้าเลือกจังหวัดจัดส่ง หากตรงกับรายชื่อนี้ ระบบจะคำนวณ <strong>"ค่าติดตั้ง = 0"</strong> ทันที
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="(prov, idx) in freeInstallProvincesText.split(',').map(s => s.trim()).filter(Boolean)" :key="idx" class="px-2 py-1 bg-white border border-teal-200 text-teal-700 text-[10px] rounded shadow-sm whitespace-nowrap">
                      {{ prov }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shipping Formula -->
            <div class="p-8 border-b border-gray-100 bg-emerald-50/20">
              <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
                สูตรคำนวณอัตราค่าจัดส่ง (Shipping Formula)
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">ตัวหารคำนวณน้ำหนักจากปริมาตร (Volumetric Divisor)</label>
                  <input v-model.number="shippingVolumetricDivisor" type="number" class="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                  <p class="text-xs text-gray-500 mt-2">สูตร: (กว้าง x ยาว x สูง) / ตัวหาร (มาตรฐานขนส่งทั่วไปใช้ 5000)</p>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">น้ำหนักประเมินขั้นต่ำต่อชิ้น (Default Weight kg)</label>
                  <input v-model.number="shippingDefaultWeight" type="number" class="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                  <p class="text-xs text-gray-500 mt-2">ใช้ในกรณีที่สินค้าไม่ได้ระบุน้ำหนักหรือขนาดไว้ในระบบ (ค่าเริ่มต้น 5 กก.)</p>
                </div>
              </div>

              <h3 class="font-bold text-gray-800 mb-4 border-t pt-6">อัตราค่าจัดส่งรายโซน (ราคาต่อกิโลกรัม)</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">กรุงเทพฯ - ปริมณฑล (BKK)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.BKK" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคกลาง (CENTRAL)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.CENTRAL" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคเหนือ (NORTH)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.NORTH" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคตะวันออก (EAST)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.EAST" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคตะวันตก (WEST)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.WEST" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคอีสาน (NE)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.NE" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคใต้ (SOUTH)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.SOUTH" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ภาคใต้/เกาะ (SOUTH_ISLAND)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.SOUTH_ISLAND" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">เกาะห่างไกล (ISLAND_REMOTE)</label>
                  <div class="relative">
                    <input v-model.number="shippingZoneRates.ISLAND_REMOTE" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs">฿</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        <!-- ======================= -->
        <!-- 2. SYSTEM TAB -->
        <!-- ======================= -->
        <div v-if="activeTab === 'system'" class="space-y-8 animate-fade-in-up">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
<!-- Frontend Features Settings -->
        <div class="p-8 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> 
            ฟีเจอร์หน้าเว็บไซต์
          </h2>
          
          <div class="mb-4">
            <div class="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-bold text-gray-900">แบนเนอร์ขอความยินยอมคุกกี้ (Cookie Consent Banner)</h3>
                  <p class="text-sm text-gray-500 mt-1">แสดงกล่องข้อความที่มุมซ้ายล่าง เพื่อขอความยินยอมในการเก็บคุกกี้ตามนโยบาย PDPA</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input type="checkbox" v-model="showCookieConsent" class="sr-only peer">
                  <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <!-- Cookie Purposes Options -->
              <div v-if="showCookieConsent" class="mt-4 pt-4 border-t border-gray-200 space-y-3">
                 <h4 class="text-sm font-bold text-gray-700 mb-2 mt-2">เปิดใช้งานประเภทคุกกี้ที่ใช้ในเว็บไซต์นี้:</h4>
                 
                 <label class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 opacity-70">
                    <input type="checkbox" checked disabled class="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500">
                    <div>
                       <span class="block text-sm font-bold text-gray-900">คุกกี้พื้นฐานที่จำเป็น (Strictly Necessary)</span>
                       <span class="block text-xs text-gray-500 mt-0.5">จำเป็นต่อการทำงานของระบบเว็บไซต์หลัก ไม่สามารถปิดได้</span>
                    </div>
                 </label>
                 
                 <label class="flex items-start gap-3 p-3 bg-white hover:bg-emerald-50/30 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input type="checkbox" v-model="cookiePurposeAnalytics" class="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer">
                    <div>
                       <span class="block text-sm font-bold text-gray-900">คุกกี้เพื่อการวิเคราะห์และสถิติ (Analytics)</span>
                       <span class="block text-xs text-gray-500 mt-0.5">ใช้วิเคราะห์พฤติกรรมการเข้าชมเว็บไซต์ เช่น Google Analytics เพื่อนำมาปรับปรุงระบบ</span>
                    </div>
                 </label>
                 
                 <label class="flex items-start gap-3 p-3 bg-white hover:bg-emerald-50/30 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input type="checkbox" v-model="cookiePurposeMarketing" class="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer">
                    <div>
                       <span class="block text-sm font-bold text-gray-900">คุกกี้เพื่อการตลาดและการโฆษณา (Marketing)</span>
                       <span class="block text-xs text-gray-500 mt-0.5">ใช้ติดตามผู้ชมเว็บไซต์และนำเสนอโฆษณาที่ตรงตามความสนใจ (เช่น Facebook Pixel)</span>
                    </div>
                 </label>

                 <label class="flex items-start gap-3 p-3 bg-white hover:bg-emerald-50/30 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input type="checkbox" v-model="cookiePurposePersonalization" class="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer">
                    <div>
                       <span class="block text-sm font-bold text-gray-900">คุกกี้เพื่อจดจำการตั้งค่าผู้ใช้ (Personalization)</span>
                       <span class="block text-xs text-gray-500 mt-0.5">ใช้จดจำข้อมูลและการตั้งค่าต่างๆ ของลูกค้าที่เคยใช้งานเว็บไซต์</span>
                    </div>
                 </label>
              </div>
            </div>

            <!-- Maintenance & Holiday Mode Toggles -->
            <div class="px-5 py-6 border border-gray-200 rounded-2xl bg-white shadow-sm mt-8 space-y-6">
              
              <!-- Maintenance Mode -->
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    โหมดปิดปรับปรุงเว็บไซต์ (Maintenance Mode)
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">ผู้ใช้ทั่วไปทั้งหมดจะไม่สามารถเข้าใช้งานหน้าเว็บได้ (จะถูกเปลี่ยนเส้นทางไปหน้าแจ้งปิดปรับปรุง) ผู้ดูแลระบบยังสามารถใช้งานหน้า /admin ได้ตามปกติ</p>
                  
                  <div class="mt-4 border border-gray-100 rounded-xl bg-gray-50/50 p-4" v-if="maintenanceModeEnabled">
                    <label class="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">ข้อความแจ้งเตือน</label>
                    <textarea 
                      v-model="maintenanceMessage"
                      rows="2"
                      placeholder="อธิบายสาเหตุและเวลาที่จะกลับมาเปิดให้บริการ"
                      class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm resize-y"
                    ></textarea>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-2 sm:mt-0">
                  <input type="checkbox" v-model="maintenanceModeEnabled" class="sr-only peer">
                  <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <hr class="border-gray-100" />

              <!-- Holiday Mode -->
              <div class="flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-lg">
                      <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      โหมดแจ้งเตือนวันหยุด (Holiday Mode)
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">แสดงแบนเนอร์ประกาศด้านบนสุดของทุกหน้าเว็บ ลูกค้ายังเข้าดูสินค้าได้ปกติ รองรับการตั้งกำหนดการล่วงหน้า</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-2 sm:mt-0">
                    <input type="checkbox" v-model="holidayModeEnabled" class="sr-only peer">
                    <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div v-if="holidayModeEnabled" class="border border-orange-100 rounded-2xl bg-orange-50/60 p-5 space-y-4">
                  <!-- Preview Banner -->
                  <div class="rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center gap-3 py-2.5 px-4 text-sm font-bold shadow-inner mb-1">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    <span>{{ holidayName || 'ชื่อวันหยุด' }}: {{ holidayMessage || 'ข้อความจะแสดงที่นี่' }}</span>
                  </div>

                  <!-- Holiday Name -->
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">ชื่อวันหยุด / ชื่อกิจกรรม</label>
                    <input 
                      v-model="holidayName"
                      type="text"
                      placeholder="เช่น สงกรานต์, ตรุษจีน, เทศกาลปีใหม่..."
                      class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm bg-white"
                    />
                  </div>

                  <!-- Message -->
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">ข้อความแบนเนอร์</label>
                    <textarea 
                      v-model="holidayMessage"
                      rows="2"
                      placeholder="เช่น ร้านปิดทำการ 13-15 เม.ย. และจะกลับมาเปิดให้บริการตามปกติหลังวันที่ 16 เม.ย."
                      class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm resize-y bg-white"
                    ></textarea>
                  </div>

                  <!-- Date Range Scheduler -->
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <label class="text-xs font-bold text-gray-700 uppercase tracking-wide">กำหนดการล่วงหน้า <span class="text-gray-400 font-normal normal-case">(ไม่บังคับ — หากกำหนดจะเปิดแบนเนอร์เฉพาะช่วงเวลานั้น)</span></label>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[11px] text-gray-500 font-bold mb-1">วันที่เริ่มต้น</label>
                        <input 
                          v-model="holidayStartDate"
                          type="date"
                          class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] text-gray-500 font-bold mb-1">วันที่สิ้นสุด</label>
                        <input 
                          v-model="holidayEndDate"
                          type="date"
                          class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm bg-white"
                        />
                      </div>
                    </div>
                    <p v-if="holidayStartDate && holidayEndDate" class="text-xs text-orange-600 mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 font-medium flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 inline-block text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>แบนเนอร์จะแสดงอัตโนมัติตั้งแต่วันที่ {{ new Date(holidayStartDate).toLocaleDateString('th-TH', {day:'numeric', month:'long', year:'numeric'}) }} ถึง {{ new Date(holidayEndDate).toLocaleDateString('th-TH', {day:'numeric', month:'long', year:'numeric'}) }}</span>
                    </p>
                  </div>

                  <!-- Banner Image Upload -->
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">รูปภาพแบนเนอร์ (ตัวเลือกเสริม)</label>
                    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <div class="w-full sm:w-72 flex-shrink-0">
                        <div class="relative w-full h-32 rounded-xl border-2 border-dashed border-orange-300 bg-white hover:bg-orange-50/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group">
                          <input type="file" @change="handleHolidayImageUpload" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :disabled="uploadingHolidayImage">
                          <template v-if="holidayImage">
                            <img :src="holidayImage" class="w-full h-full object-contain p-2" alt="Holiday Banner">
                            <div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg class="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              <span class="text-white text-xs font-medium">เปลี่ยนรูปภาพ</span>
                            </div>
                          </template>
                          <template v-else-if="uploadingHolidayImage">
                            <svg class="w-6 h-6 text-orange-500 animate-spin mb-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span class="text-xs font-medium text-gray-500">กำลังอัปโหลด...</span>
                          </template>
                          <template v-else>
                            <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <svg class="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <span class="text-xs font-medium text-gray-500 group-hover:text-orange-600">คลิกเพื่ออัปโหลด</span>
                          </template>
                        </div>
                      </div>
                      <div class="flex-1 text-sm text-gray-600">
                        <p class="font-medium mb-1">แสดงรูปภาพคู่กับข้อความแบนเนอร์</p>
                        <p class="text-xs text-gray-400 mb-2 leading-relaxed">ช่วยเพิ่มความน่าสนใจให้กับเว็บไซต์ในช่วงแคมเปญหรือเทศกาลต่างๆ ภาพจะอยู่ด้านขวาของแบนเนอร์ ขนาดแนะนำ 600x400 px</p>
                        <button v-if="holidayImage" @click="holidayImage = ''" type="button" class="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          ลบรูปภาพ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            <!-- AI Product Recommendation Toggle -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50 mt-4">
              <div>
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM19.007 10.08L18.5 13L17.993 10.08L15 9.57L17.993 9.06L18.5 6L19.007 10.08Z" />
                  </svg>
                  ป๊อปอัพ "AI แนะนำสำหรับคุณ" (AI Product Recommendation)
                </h3>
                <p class="text-sm text-gray-500 mt-1">แสดงกล่องป๊อปอัพแนะนำสินค้าอัจฉริยะตามความสนใจของผู้เข้าชมที่มุมซ้ายล่าง</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-2 sm:mt-0">
                <input type="checkbox" v-model="aiRecommendationEnabled" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <!-- Online Shopping Toggle -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50 mt-4">
              <div>
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  ระบบช้อปปิ้งออนไลน์และสมาชิก
                </h3>
                <p class="text-sm text-gray-500 mt-1">เปิดใช้งานระบบตะกร้าสินค้า การสั่งซื้อ และการเข้าสู่ระบบ/สมัครสมาชิก</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-2 sm:mt-0">
                <input type="checkbox" v-model="onlineShoppingEnabled" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

      <!-- ======================= -->
      <!-- 2. AUTOMATION & CRON TAB -->
      <!-- ======================= -->
      <div v-if="activeTab === 'cron'" class="space-y-8 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-8 border-b border-gray-100 bg-slate-50/50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg> 
              ตั้งค่าระบบงานอัตโนมัติ (Cron Jobs & Automation)
            </h2>
            <p class="text-xs text-gray-500 mt-1">
              จัดการและตรวจสอบงานทำงานเบื้องหลังอัตโนมัติของระบบ เช่น การกู้คืนตะกร้าสินค้า, การจับคู่สินค้าซื้อร่วมกัน, การส่งบรอดแคสต์ LINE, อีเมลข่าวสาร และการสรุปรายงาน Telegram
            </p>
          </div>

          <div class="p-8 space-y-6">
            <!-- Secret Key Section -->
            <div class="bg-gradient-to-br from-slate-50 via-white to-slate-50/50 border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="space-y-1.5 flex-1">
                  <h3 class="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                    <svg class="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m-2 2a2 2 0 002-2v-.01M12 12h.01M5 12h.01M12 12a1 1 0 11-2 0 1 1 0 012 0zm-7 0a1 1 0 11-2 0 1 1 0 012 0zm14 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    รหัสผ่านความปลอดภัย (Cron Secret Key)
                  </h3>
                  <p class="text-xs text-slate-500 max-w-xl">ใช้ระบุในพารามิเตอร์ลิงก์สำหรับการเรียกจากภายนอกเซิร์ฟเวอร์เพื่อให้มีความปลอดภัยสูง</p>
                </div>
                
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div class="relative flex-1 lg:w-80 min-w-0">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      :value="cronSecretKey" 
                      readonly 
                      class="w-full min-w-0 bg-white border border-slate-200 rounded-xl pl-10 pr-20 py-2.5 font-mono text-xs text-slate-700 select-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                    />
                    <button 
                      type="button" 
                      @click="copyToClipboard(cronSecretKey)"
                      class="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
                    >
                      คัดลอก
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    @click="confirmKeyUpdate"
                    class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19.623M7 9v11M7 9H3" />
                    </svg>
                    เปลี่ยนรหัสผ่าน
                  </button>
                </div>
              </div>
            </div>

            <!-- Automated Tasks List -->
            <div>
              <h3 class="font-bold text-gray-900 mb-5 flex items-center gap-2 text-sm md:text-base">
                <svg class="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                รายการงานอัตโนมัติในระบบ ({{ cronTasks.length }} รายการ)
              </h3>

              <div v-if="loadingCronInfo" class="py-12 flex flex-col items-center justify-center gap-3">
                <svg class="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-xs font-semibold text-gray-500">กำลังโหลดรายการงานอัตโนมัติ...</span>
              </div>

              <div v-else class="grid grid-cols-1 gap-5">
                <!-- Task Card -->
                <div 
                  v-for="task in cronTasks" 
                  :key="task.id"
                  :class="[
                    task.enabled ? 'border-l-emerald-500' : 'border-l-slate-300',
                    'border-y border-r border-slate-200 border-l-4 rounded-2xl bg-white hover:border-indigo-300 hover:shadow-[0_8px_30px_rgba(79,70,229,0.04)] transition-all duration-300 overflow-hidden'
                  ]"
                >
                  <div class="p-6 md:p-7 space-y-4">
                    <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                      <div class="space-y-1.5 flex-1 min-w-0">
                        <div class="flex items-center gap-2.5 flex-wrap">
                          <h4 class="font-bold text-slate-900 text-sm md:text-base leading-snug">{{ task.name }}</h4>
                          <span 
                            :class="[
                              task.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200',
                              'px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap'
                            ]"
                          >
                            {{ task.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                          </span>
                          <span class="bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold whitespace-nowrap">
                            {{ task.cron_expr }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed max-w-3xl">{{ task.description }}</p>
                        <div class="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span class="flex items-center gap-1.5 font-medium">
                            <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            รอบเวลา: {{ task.schedule }}
                          </span>
                        </div>
                      </div>

                      <!-- Actions (Manual Run) -->
                      <div class="flex flex-wrap items-center gap-3 shrink-0 xl:self-center">
                        <!-- Optional force checkbox for LINE Broadcast -->
                        <label 
                          v-if="task.id === 'line_broadcast'" 
                          class="relative inline-flex items-center cursor-pointer mr-3 select-none gap-2 flex-shrink-0"
                          title="ข้ามเงื่อนไขความถี่การส่ง (ส่งทันที)"
                        >
                          <input 
                            type="checkbox" 
                            v-model="forceLineBroadcast"
                            class="sr-only peer"
                          />
                          <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          <span class="text-xs font-semibold text-slate-600">ส่งทันที (ไม่จำกัดความถี่)</span>
                        </label>

                        <button
                          type="button"
                          @click="runCronTaskManual(task)"
                          :disabled="runningCronTask[task.id]"
                          class="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 font-bold text-xs rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all select-none whitespace-nowrap"
                        >
                          <svg 
                            v-if="runningCronTask[task.id]" 
                            class="w-3.5 h-3.5 animate-spin" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <svg 
                            v-else 
                            class="w-3.5 h-3.5" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {{ runningCronTask[task.id] ? 'กำลังทำงาน...' : 'รันงานทันที' }}
                        </button>
                      </div>
                    </div>

                    <!-- Trigger URL and manual run result display -->
                    <div class="mt-4 pt-4 border-t border-slate-100/85 space-y-3">
                      <div class="flex flex-col lg:flex-row lg:items-center gap-3">
                        <span class="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-1.5">
                          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          ลิงก์เรียกงานเฉพาะตัว (Trigger URL):
                        </span>
                        <div class="flex items-center gap-2 flex-1 min-w-0 bg-slate-50 border border-slate-200/80 rounded-xl p-1 pl-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                          <span class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-sans tracking-wide shrink-0">GET</span>
                          <input 
                            type="text" 
                            :value="getTriggerUrl(task.id)" 
                            readonly 
                            class="w-full min-w-0 bg-transparent border-0 font-mono text-[10.5px] text-slate-600 outline-none select-all py-1"
                          />
                          <button 
                            type="button"
                            @click="copyToClipboard(getTriggerUrl(task.id))"
                            class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                            title="คัดลอกลิงก์"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Manual Run Result Notification -->
                      <div 
                        v-if="cronRunResult[task.id]" 
                        :class="[
                          cronRunResult[task.id].success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800',
                          'border rounded-xl p-4 text-xs flex items-start gap-3 animate-fade-in-up'
                        ]"
                      >
                        <svg 
                          v-if="cronRunResult[task.id].success"
                          class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <svg 
                          v-else
                          class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="font-bold text-xs">ผลการประมวลผลล่าสุด:</p>
                          <p class="mt-2 font-mono text-[10.5px] break-all leading-normal text-slate-700 bg-white/60 p-3 rounded-lg border border-black/5">{{ cronRunResult[task.id].message }}</p>
                        </div>
                        <button 
                          type="button" 
                          @click="cronRunResult[task.id] = null"
                          class="text-slate-400 hover:text-slate-600 shrink-0 self-start p-0.5 rounded-lg hover:bg-black/5"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Setup Guide -->
            <div class="border-t border-gray-100 pt-8 space-y-4 font-sans">
              <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                คำอธิบายการตั้งค่าใช้จริงบนโฮสติ้ง (Production Setup Guide)
              </h3>
              
              <div class="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-xs md:text-sm text-amber-900 space-y-2 shadow-sm">
                <p class="font-bold flex items-center gap-1.5 text-xs md:text-sm">
                  <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  สำคัญ: เหตุใดต้องใช้ระบบ Cron ภายนอกหรือระบบของโฮสต์จริง?
                </p>
                <p class="text-xs text-amber-900/90 leading-relaxed">
                  บนเซิร์ฟเวอร์จริง (โดยเฉพาะ Shared Hosting หรือระบบที่ใช้ Node Passenger, IIS) กระบวนการของ Node.js จะเข้าสู่โหมด Sleep (Standby) เมื่อไม่มีผู้เข้าเยี่ยมชมเว็บไซต์เป็นระยะเวลาหนึ่ง ซึ่งส่งผลให้จับเวลาภายใน (node-cron ในหน่วยความจำ) หยุดทำงานไปด้วย การตั้งค่า Cron Job ภายนอกให้ส่ง request มากระตุ้นตามเวลา จะช่วยให้แอปพลิเคชันตื่นขึ้นมาทำงานได้ตรงเวลา 100%
                </p>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <!-- Method 1: Pulse (Recommended) -->
                <div class="border border-gray-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
                  <h4 class="font-bold text-gray-900 flex items-center gap-2 text-xs md:text-sm">
                    <span class="w-6 h-6 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center justify-center font-black shrink-0 shadow-sm">1</span>
                    วิธีส่งสัญญาณกระตุ้นรวม (Master Pulse Endpoint)
                  </h4>
                  <p class="text-xs text-gray-500 leading-relaxed">
                    เป็นวิธีที่ <strong class="text-indigo-600 font-bold">ง่ายและแนะนำที่สุด</strong> คุณตั้งค่า Cron Job หลักเพียงงานเดียวบนโฮสติ้งให้รัน <strong class="text-indigo-600 font-bold">ทุกๆ 1 นาที</strong> มายังที่อยู่นี้ ระบบจะเช็กเองว่า ณ นาทีนี้มีงานไหนถึงเวลาทำ แล้วจะสั่งรันชิ้นงานนั้นๆ โดยอัตโนมัติ
                  </p>

                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-xs text-slate-400">
                      <span class="font-medium">Master Pulse URL:</span>
                      <button 
                        type="button" 
                        @click="copyToClipboard(getPulseUrl())"
                        class="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                      >
                        คัดลอกลิงก์
                      </button>
                    </div>
                    <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 pl-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                      <span class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-sans tracking-wide shrink-0">GET</span>
                      <input 
                        type="text" 
                        :value="getPulseUrl()" 
                        readonly 
                        class="w-full min-w-0 bg-transparent border-0 font-mono text-[10.5px] text-slate-600 outline-none select-all py-1"
                      />
                    </div>
                  </div>

                  <div class="space-y-2 mt-2">
                    <div class="flex items-center justify-between text-xs text-slate-400">
                      <span class="font-medium">คำสั่งตั้งค่า Linux Crontab (ทุกๆ 1 นาที):</span>
                    </div>
                    <div class="relative bg-slate-900 border border-slate-950 rounded-xl overflow-hidden shadow-md">
                      <div class="flex items-center justify-between px-4 py-2 bg-slate-950/60 text-[9px] font-mono text-slate-400 border-b border-slate-950/40">
                        <span>CRONTAB</span>
                        <button 
                          type="button" 
                          @click="copyToClipboard(getPulseCrontabCommand())"
                          class="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          คัดลอกคำสั่ง
                        </button>
                      </div>
                      <pre class="p-4 font-mono text-[10.5px] text-slate-200 whitespace-pre-wrap break-all leading-relaxed select-all">* * * * * curl -s "{{ getPulseUrl() }}" >/dev/null 2>&1</pre>
                    </div>
                  </div>
                </div>

                <!-- Method 2: Individual task cron -->
                <div class="border border-gray-200 rounded-2xl p-5 space-y-4 bg-white shadow-sm">
                  <h4 class="font-bold text-gray-900 flex items-center gap-2 text-xs md:text-sm">
                    <span class="w-6 h-6 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center justify-center font-black shrink-0 shadow-sm">2</span>
                    วิธีกำหนดแยกงานทีละตัว (Individual Triggers)
                  </h4>
                  <p class="text-xs text-gray-500 leading-relaxed">
                    หากคุณใช้บริการ Webcron ภายนอก (เช่น EasyCron, UptimeRobot) หรือระบบของโฮสต์ในการกำหนดควบคุมเวลาด้วยตัวเอง คุณสามารถสร้าง Cron Job บนระบบภายนอกเหล่านั้นแล้วเรียกตรงไปที่ URL รายชิ้นงานตามรอบเวลาของงานนั้นๆ ได้
                  </p>

                  <div class="space-y-4 pt-1">
                    <p class="text-xs font-semibold text-slate-700">ตัวอย่างคำสั่งใน cPanel Cron Jobs สำหรับงานเด่น:</p>
                    
                    <div class="space-y-2">
                      <div class="flex justify-between items-center text-[10px] text-slate-400">
                        <span class="font-medium">ระบบกู้คืนตะกร้าสินค้า (ทุกวัน เวลา 10:00 น.):</span>
                      </div>
                      <div class="relative bg-slate-900 border border-slate-950 rounded-xl overflow-hidden shadow-md">
                        <div class="flex items-center justify-between px-4 py-2 bg-slate-950/60 text-[9px] font-mono text-slate-400 border-b border-slate-950/40">
                          <span>CRONTAB (10:00 AM)</span>
                          <button 
                            type="button" 
                            @click="copyToClipboard(getTaskCrontabCommand('abandoned_cart', '0 10 * * *'))"
                            class="text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            คัดลอก
                          </button>
                        </div>
                        <pre class="p-3.5 font-mono text-[10px] text-slate-200 whitespace-pre-wrap break-all leading-relaxed select-all">0 10 * * * curl -s "{{ getTriggerUrl('abandoned_cart') }}" >/dev/null 2>&1</pre>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="flex justify-between items-center text-[10px] text-slate-400">
                        <span class="font-medium">วิเคราะห์สินค้าแนะนำร่วมกัน (ทุกๆ 6 ชั่วโมง):</span>
                      </div>
                      <div class="relative bg-slate-900 border border-slate-950 rounded-xl overflow-hidden shadow-md">
                        <div class="flex items-center justify-between px-4 py-2 bg-slate-950/60 text-[9px] font-mono text-slate-400 border-b border-slate-950/40">
                          <span>CRONTAB (EVERY 6 HOURS)</span>
                          <button 
                            type="button" 
                            @click="copyToClipboard(getTaskCrontabCommand('co_purchase', '0 */6 * * *'))"
                            class="text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            คัดลอก
                          </button>
                        </div>
                        <pre class="p-3.5 font-mono text-[10px] text-slate-200 whitespace-pre-wrap break-all leading-relaxed select-all">0 */6 * * * curl -s "{{ getTriggerUrl('co_purchase') }}" >/dev/null 2>&1</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 3. PAYMENT TAB -->
      <!-- ======================= -->
      <div v-if="activeTab === 'payment'" class="space-y-8 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Payment Settings -->
          <div class="p-8 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ตั้งค่าช่องทางชำระเงิน
            </h2>
            <p class="text-xs text-gray-400 mb-5 ml-7">เปิด-ปิดช่องทางชำระเงินที่แสดงในหน้า Checkout</p>

            <div class="space-y-2.5">
              <!-- PromptPay -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="flex items-center gap-3 px-4 py-3 bg-white">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-gray-900 leading-tight">พร้อมเพย์ (PromptPay)</h3>
                    <p class="text-[11px] text-gray-400 leading-tight">สแกน QR Code พร้อมเพย์</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" v-model="paymentPromptpayEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <div v-if="paymentPromptpayEnabled" class="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
                  <label class="text-xs font-bold text-gray-600 whitespace-nowrap">หมายเลข:</label>
                  <input v-model="paymentPromptpayNumber" type="text" placeholder="เบอร์โทรศัพท์ หรือ เลขผู้เสียภาษี" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white">
                </div>
              </div>

              <!-- Bank Transfer -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="flex items-center gap-3 px-4 py-3 bg-white">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-gray-900 leading-tight">โอนเงินบัญชีธนาคาร</h3>
                    <p class="text-[11px] text-gray-400 leading-tight">รับโอนผ่านบัญชีธนาคารทั่วไป</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" v-model="paymentBankTransferEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <div v-if="paymentBankTransferEnabled" class="px-4 py-3 bg-gray-50/80 border-t border-gray-100 space-y-2">
                  <div v-for="(acc, index) in paymentBankAccounts" :key="index" class="relative grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-lg p-2.5 pr-8">
                    <button @click.prevent="removeBankAccount(index)" class="absolute top-1 right-1 w-5 h-5 text-gray-300 hover:text-red-500 rounded-full flex items-center justify-center transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <select v-model="acc.bank" class="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 bg-white">
                      <option value="" disabled>ธนาคาร</option>
                      <option v-for="b in THAI_BANKS" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                    <input v-model="acc.name" type="text" placeholder="ชื่อบัญชี" class="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-500">
                    <input v-model="acc.number" type="text" placeholder="เลขบัญชี" class="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-1 focus:ring-amber-500">
                  </div>
                  <div v-if="paymentBankAccounts.length === 0" class="text-xs text-gray-400 text-center py-2">ยังไม่มีบัญชีธนาคาร</div>
                  <button type="button" @click="addBankAccount" class="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-500 hover:text-amber-600 hover:border-amber-400 hover:bg-amber-50/50 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    เพิ่มบัญชี
                  </button>
                </div>
              </div>

              <!-- Bualuang iPay -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="flex items-center gap-3 px-4 py-3 bg-white">
                  <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-gray-900 leading-tight">Bualuang iPay <button @click.prevent="openGuide('ipay')" type="button" class="ml-1.5 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-5 h-5 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button></h3>
                    <p class="text-[11px] text-gray-400 leading-tight">บัตรเครดิต/เดบิตออนไลน์ ธ.กรุงเทพ</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" v-model="paymentIpayEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <div v-if="paymentIpayEnabled" class="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
                  <label class="text-xs font-bold text-gray-600 whitespace-nowrap">Merchant ID:</label>
                  <div class="flex items-center gap-1 w-full">
                    <input v-model="paymentIpayMerchantId" type="text" placeholder="เช่น 8369" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono tracking-wider focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white">
                    <div class="flex items-center gap-0.5 flex-shrink-0">
                      <button type="button" @click="copyToClipboard(paymentIpayMerchantId)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="คัดลอก"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                      <button type="button" @click="pasteFromClipboard(paymentIpayMerchantId)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="วาง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                      <button type="button" @click="clearField(paymentIpayMerchantId)" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ล้าง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================= -->
      <!-- 4. NOTIFICATION TAB     -->
      <!-- ======================= -->
      <div v-if="activeTab === 'notification'" class="space-y-8 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-8">
          <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            ช่องทางการแจ้งเตือนหลัก
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Telegram Settings -->
            <div class="p-5 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.9 8.94c-.14.65-.53.81-1.07.51l-2.96-2.18-1.43 1.38c-.16.16-.29.29-.59.29l.21-3.03 5.51-4.98c.24-.22-.05-.34-.37-.13l-6.81 4.29-2.93-.92c-.64-.2-.65-.64.13-.95l11.45-4.42c.53-.19 1-.13 1.25.46z"/></svg>
                    Telegram Bot <button @click.prevent="openGuide('telegram')" type="button" class="ml-1.5 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-5 h-5 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button>
                  </h3>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="notifyTelegramEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>
                <div v-if="notifyTelegramEnabled" class="space-y-3 mb-3">
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Bot Token</label>
                    <div class="flex items-center gap-1 w-full">
                      <input v-model="notifyTelegramToken" type="password" placeholder="123456:ABC-DEF1234..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white">
                      <div class="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" @click="copyToClipboard(notifyTelegramToken)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="คัดลอก"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                        <button type="button" @click="pasteFromClipboard(notifyTelegramToken)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="วาง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                        <button type="button" @click="notifyTelegramToken = ''" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ล้าง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Chat ID</label>
                    <div class="flex items-center gap-1 w-full">
                      <input v-model="notifyTelegramChatId" type="text" placeholder="-1001234567890" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white">
                      <div class="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" @click="copyToClipboard(notifyTelegramChatId)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="คัดลอก"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                        <button type="button" @click="pasteFromClipboard(notifyTelegramChatId)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="วาง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                        <button type="button" @click="notifyTelegramChatId = ''" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ล้าง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="notifyTelegramEnabled">
                <button 
                  type="button" 
                  @click="testTelegram" 
                  :disabled="testingTelegram || !notifyTelegramToken || !notifyTelegramChatId"
                  class="w-full px-4 py-2 bg-sky-50 text-sky-700 font-bold text-xs rounded-lg hover:bg-sky-100 transition-colors disabled:opacity-50 border border-sky-200"
                >
                  {{ testingTelegram ? 'กำลังทดสอบ...' : 'ทดสอบส่งข้อความ' }}
                </button>
              </div>
              <p v-else class="text-xs text-gray-500">รับการแจ้งเตือนทันทีผ่านข้อความ Telegram แบบเรียลไทม์</p>
            </div>

            <!-- LINE OA Settings -->
            <div class="p-5 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-[#06C755]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.3c0-4.36-4.52-7.91-10.05-7.91S3.9 5.94 3.9 10.3c0 3.89 3.52 7.18 8.16 7.82.32.07.75.21.86.5l.28.84c.05.15.02.34-.12.44-.04.03-3.1 1.83-4.22 2.51-.31.19-.52.51-.52.88 0 .57.46 1.03 1.03 1.03.18 0 .36-.05.51-.14 2.87-1.68 8.41-4.99 10.15-6.23.1-.07.2-.15.28-.24C22.68 15.68 24 13.13 24 10.3z"/></svg>
                    LINE Messaging API <button @click.prevent="openGuide('line_oa')" type="button" class="ml-1.5 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-5 h-5 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button>
                  </h3>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="notifyLineOaEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
                  </label>
                </div>
                <div v-if="notifyLineOaEnabled" class="space-y-3 mb-3">
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Channel Access Token</label>
                    <div class="flex items-center gap-1 w-full">
                      <input v-model="notifyLineOaToken" type="password" placeholder="ey..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#06C755] focus:border-[#06C755] bg-white">
                      <div class="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" @click="copyToClipboard(notifyLineOaToken)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="คัดลอก"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                        <button type="button" @click="pasteFromClipboard(notifyLineOaToken)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="วาง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                        <button type="button" @click="notifyLineOaToken = ''" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ล้าง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Admin User ID</label>
                    <div class="flex items-center gap-1 w-full">
                      <input v-model="notifyLineOaUserId" type="text" placeholder="U6a..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#06C755] focus:border-[#06C755] bg-white">
                      <div class="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" @click="copyToClipboard(notifyLineOaUserId)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="คัดลอก"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                        <button type="button" @click="pasteFromClipboard(notifyLineOaUserId)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="วาง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                        <button type="button" @click="notifyLineOaUserId = ''" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ล้าง"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="notifyLineOaEnabled">
                <button 
                  type="button" 
                  @click="testLineOa" 
                  :disabled="testingLineOa || !notifyLineOaToken || !notifyLineOaUserId"
                  class="w-full px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 border border-emerald-200"
                >
                  {{ testingLineOa ? 'กำลังทดสอบ...' : 'ทดสอบส่งข้อความ' }}
                </button>
              </div>
              <p v-else class="text-xs text-gray-500 font-medium">รับการแจ้งเตือนรูปแบบ Push ทางบัญชี LINE ทางการ (Official Account)</p>
            </div>

            <!-- Email Settings -->
            <div class="p-5 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    อีเมล (Email)
                  </h3>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="notifyEmailEnabled" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
                <div v-if="notifyEmailEnabled" class="space-y-3 mb-3">
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-xs font-bold text-gray-700">รายชื่ออีเมลผู้รับการแจ้งเตือน</label>
                    <button type="button" @click="addEmailField" class="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                      เพิ่มอีเมล
                    </button>
                  </div>
                  <div v-for="(email, idx) in notifyEmailList" :key="idx" class="flex items-center gap-1">
                    <input v-model="notifyEmailList[idx]" type="email" placeholder="email@example.com" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-white">
                    <button type="button" @click="removeEmailField(idx)" class="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="notifyEmailEnabled">
                <button 
                  type="button" 
                  @click="testEmail" 
                  :disabled="testingEmail"
                  class="w-full px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 border border-rose-200"
                >
                  {{ testingEmail ? 'กำลังทดสอบ...' : 'ทดสอบส่งอีเมล' }}
                </button>
              </div>
              <p v-else class="text-xs text-gray-500 font-medium">รับการแจ้งเตือนทางอีเมลเมื่อมีคำสั่งซื้อหรือความเคลื่อนไหวใหม่ในระบบ</p>
            </div>

            <!-- Browser Push Settings -->
            <div class="p-5 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    แจ้งเตือนบนเบราว์เซอร์ (Push Notification)
                  </h3>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="notifyBrowserEnabled" @change="requestNotificationPermission" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
                <p class="text-xs text-gray-500 font-medium">เปิดรับการแจ้งเตือนแบบป๊อปอัพทางมุมขวาล่างของหน้าจอ แม้จะไม่ได้เปิดแท็บหน้าเว็บทิ้งไว้</p>
              </div>
            </div>
          </div>

          <!-- Daily Report Test -->
          <div class="mt-6 p-5 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  ทดสอบส่งรายงานสถิติประจำวัน
                </h3>
                <p class="text-xs text-gray-500 mt-1">ส่งรายงานสถิติเข้าชมเว็บไซต์ประจำวันไปที่ Telegram ทันที (รายงานอัตโนมัติจะส่งทุกวัน 08:00, ทุกจันทร์ 09:00, และวันที่ 1 ของเดือน)</p>
              </div>
              <button
                type="button"
                @click="testReport"
                :disabled="testingReport || !notifyTelegramEnabled"
                class="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
              >
                <svg v-if="testingReport" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                {{ testingReport ? 'กำลังส่ง...' : 'ส่งรายงานตอนนี้' }}
              </button>
            </div>
          </div>
        </div>
      </div>
        <!-- 5. INTEGRATION TAB -->
        <!-- ======================= -->
        <div v-if="activeTab === 'integration'" class="space-y-8 animate-fade-in-up">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
<!-- Google Gemini AI -->
        <div class="p-8 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> 
            Google Gemini AI <button @click.prevent="openGuide('gemini')" type="button" class="ml-2 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-7 h-7 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button>
          </h2>


          <!-- AI Product Recommendation Widget Control Card -->
          <div class="p-5 border border-gray-200 rounded-2xl bg-gray-50/40 mb-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                    <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM19.007 10.08L18.5 13L17.993 10.08L15 9.57L17.993 9.06L18.5 6L19.007 10.08Z" />
                    </svg>
                    ป๊อปอัพ "AI แนะนำสำหรับคุณ" (AI Product Recommendation Widget)
                  </h4>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold" :class="aiRecommendationEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'">
                    {{ aiRecommendationEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">แสดงกล่องวิดเจ็ตแนะนำสินค้าตามพฤติกรรมและความสนใจของผู้เข้าชมที่มุมซ้ายล่างของเว็บไซต์</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" v-model="aiRecommendationEnabled" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <!-- Detailed settings when enabled -->
            <div v-if="aiRecommendationEnabled" class="pt-4 border-t border-gray-200/80 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1.5">ระยะเวลาหน่วงก่อนแสดง (Delay)</label>
                  <div class="relative">
                    <input v-model.number="aiWidgetDelay" type="number" min="0" class="w-full border border-gray-300 rounded-xl pl-3 pr-16 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs font-medium">วินาที</span>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1">รอกี่วินาทีหลังเข้าหน้าเว็บก่อนแสดงป๊อปอัพ</p>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1.5">ระยะเวลาพักหลังกดปิด (Cooldown)</label>
                  <div class="relative">
                    <input v-model.number="aiWidgetCooldown" type="number" min="0" class="w-full border border-gray-300 rounded-xl pl-3 pr-16 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs font-medium">นาที</span>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1">เมื่อผู้ใช้กดปิด จะซ่อนป๊อปอัพไว้นานกี่นาที</p>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1.5">จำนวนสินค้าที่แนะนำ (Limit)</label>
                  <div class="relative">
                    <input v-model.number="aiWidgetProductCount" type="number" min="1" max="10" class="w-full border border-gray-300 rounded-xl pl-3 pr-16 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white">
                    <span class="absolute right-3 top-2 text-gray-400 text-xs font-medium">รายการ</span>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1">จำนวนสินค้าสูงสุดที่จะวนสไลด์แสดง</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Gemini Model / Version</label>
            <select v-model="geminiPreferredModel" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm mb-2">
              <option value="">ค่าเริ่มต้นจากระบบ (ออโต้)</option>
              <option v-for="m in availableModels" :key="m.id" :value="m.id">{{ m.name }} - {{ m.description }}</option>
            </select>
            <p class="text-xs text-gray-500 mb-4">เลือก Model ของ AI ที่ต้องการใช้งานเป็นหลัก (หากมีปัญหาจะสลับไปใช้ตัวสำรองอัตโนมัติ)</p>

            <!-- Manage Models List Section -->
            <div class="mb-6 border border-slate-100 rounded-2xl p-5 bg-slate-50/50 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-gray-900 text-sm">จัดการเวอร์ชันของโมเดล (Gemini Model Versions)</h4>
                  <p class="text-[11px] text-gray-400">คุณสามารถปรับแต่งรายการโมเดล Gemini ที่ระบบรองรับได้เองที่นี่</p>
                </div>
                <button 
                  type="button" 
                  @click="openAddModelModal" 
                  class="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                  เพิ่มเวอร์ชัน
                </button>
              </div>

              <div class="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                <table class="min-w-full divide-y divide-gray-200 text-xs">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2.5 font-bold text-gray-700 text-left">Model ID</th>
                      <th class="px-4 py-2.5 font-bold text-gray-700 text-left">ชื่อโมเดล (Name)</th>
                      <th class="px-4 py-2.5 font-bold text-gray-700 text-left">คำอธิบาย</th>
                      <th class="px-4 py-2.5 font-bold text-gray-700 text-left">ระดับ (Tier)</th>
                      <th class="px-4 py-2.5 font-bold text-gray-700 text-center w-16">ลบ</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(m, index) in availableModels" :key="m.id" class="hover:bg-slate-50/40">
                      <td class="px-4 py-2.5 font-mono text-gray-600 font-medium">{{ m.id }}</td>
                      <td class="px-4 py-2.5 text-gray-900 font-semibold">{{ m.name }}</td>
                      <td class="px-4 py-2.5 text-gray-500 leading-relaxed max-w-xs truncate" :title="m.description">{{ m.description }}</td>
                      <td class="px-4 py-2.5">
                        <span 
                          class="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block"
                          :class="{
                            'bg-indigo-50 text-indigo-700 border border-indigo-100': m.tier === 'recommended',
                            'bg-emerald-50 text-emerald-700 border border-emerald-100': m.tier === 'stable',
                            'bg-purple-50 text-purple-700 border border-purple-100': m.tier === 'premium',
                            'bg-amber-50 text-amber-700 border border-amber-100': m.tier === 'economy'
                          }"
                        >
                          {{ m.tier }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5 text-center">
                        <button 
                          type="button" 
                          @click="deleteModel(index)" 
                          class="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          title="ลบโมเดลนี้"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="availableModels.length === 0">
                      <td colspan="5" class="px-4 py-6 text-center text-gray-400">ยังไม่มีข้อมูลโมเดลในฐานข้อมูล</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Gemini API Keys Card Section -->
            <div class="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4 mb-4">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-bold text-gray-800">
                  Gemini API Keys
                </label>
                <div class="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full" :class="apiKey.split(',').filter(k => k.trim()).length > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full" :class="apiKey.split(',').filter(k => k.trim()).length > 0 ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                    <span>{{ apiKey.split(',').filter(k => k.trim()).length }} คีย์คลัง</span>
                  </span>
                  <span v-if="geminiKeyStatus && geminiKeyStatus.cooldown > 0" class="text-rose-600 font-bold ml-1">
                    (ติด Cooldown {{ geminiKeyStatus.cooldown }} คีย์)
                  </span>
                </div>
              </div>

              <!-- Input Textarea Wrapper -->
              <div class="relative rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all overflow-hidden bg-white">
                <textarea 
                  v-model="apiKey" 
                  rows="3"
                  placeholder="วาง API Key ที่นี่ (สามารถใส่ได้หลายคีย์เพื่อสลับใช้งานอัตโนมัติ โดยคั่นด้วยเครื่องหมายจุลภาค ,)"
                  class="w-full px-4 py-3.5 text-sm font-mono focus:outline-none resize-none border-0"
                ></textarea>
                
                <!-- Inner Actions inside Textarea container bottom -->
                <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
                  <div class="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      @click="copyToClipboard(apiKey)" 
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="คัดลอกทั้งหมด"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                      คัดลอก
                    </button>
                    <button 
                      type="button" 
                      @click="apiKey = ''" 
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="ล้างข้อมูล"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      ล้างข้อความ
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    @click="testApiKey" 
                    :disabled="testingKey || !apiKey.trim()"
                    class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-sm"
                  >
                    <svg v-if="testingKey" class="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ testingKey ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ' }}
                  </button>
                </div>
              </div>

              <!-- Keys Status Dashboard Table -->
              <div v-if="geminiKeyStatus && geminiKeyStatus.keys && geminiKeyStatus.keys.length > 0" class="border border-gray-150 rounded-xl overflow-hidden bg-slate-50/50 shadow-inner mt-4">
                <div class="px-4 py-2.5 bg-slate-100 border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>สถานะการเชื่อมต่อแต่ละคีย์ (Key Usage Status)</span>
                  <span class="text-[10px] text-gray-400 font-normal">ระบบจะข้ามคีย์ที่ติดคูลดาวน์อัตโนมัติ</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-255 text-xs text-left bg-white">
                    <thead class="bg-slate-50">
                      <tr>
                        <th class="px-4 py-3 font-semibold text-gray-600">ลำดับคีย์</th>
                        <th class="px-4 py-3 font-semibold text-gray-600">รหัสคีย์ (Masked Key)</th>
                        <th class="px-4 py-3 font-semibold text-gray-600">สถานะการทำงาน</th>
                        <th class="px-4 py-3 font-semibold text-gray-600">ข้อมูลเพิ่มเติม / Cooldown</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-150">
                      <tr v-for="(k, idx) in geminiKeyStatus.keys" :key="k.index" :class="k.status === 'cooldown' ? 'bg-rose-50/30' : 'hover:bg-slate-50/45'">
                        <td class="px-4 py-3 text-gray-400 font-bold font-mono">#{{ idx + 1 }}</td>
                        <td class="px-4 py-3 font-mono text-gray-700 font-medium select-all">{{ k.masked }}</td>
                        <td class="px-4 py-3">
                          <span v-if="k.status === 'active'" class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold inline-flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            พร้อมใช้งาน
                          </span>
                          <span v-else class="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-bold inline-flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                            ติดขัด / พักคีย์
                          </span>
                        </td>
                        <td class="px-4 py-3 text-gray-600">
                          <div v-if="k.status === 'cooldown'" class="flex items-center gap-1.5">
                            <span class="text-rose-600 font-semibold">ติด Cooldown รอ:</span>
                            <span class="bg-rose-100 text-rose-800 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">{{ k.cooldownRemaining }} วินาที</span>
                            <span class="text-[10px] text-gray-400">({{ k.reason }})</span>
                          </div>
                          <span v-else class="text-gray-400">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <p class="text-xs text-gray-600 leading-relaxed flex items-center gap-1 flex-wrap">
                <strong class="text-indigo-700 inline-flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  รองรับหลาย API Key:
                </strong> ใส่ได้มากกว่า 1 คีย์โดยคั่นด้วย <code class="bg-white px-1.5 py-0.5 rounded text-indigo-600 font-bold">,</code> เมื่อคีย์แรกหมดโควต้า ระบบจะสลับไปใช้คีย์ถัดไปโดยอัตโนมัติ
              </p>
              <p class="text-xs text-gray-500 mt-1.5">
                รับคีย์ฟรีได้ที่ <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-indigo-600 hover:underline font-semibold">Google AI Studio</a> (สร้างได้หลายคีย์จากหลายบัญชี Google)
              </p>
            </div>
          </div>
        </div>

        
<!-- Social Login Settings -->
        <div class="p-8 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg> 
            โซเชียลล็อกอิน (Social Login)
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Google Login -->
            <div class="p-5 border border-gray-200 rounded-xl bg-gray-50/50">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                  Google Login <button @click.prevent="openGuide('google_login')" type="button" class="ml-1.5 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-5 h-5 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button>
                </h3>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="googleLoginEnabled" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div v-if="googleLoginEnabled" class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Google Client ID</label>
                  <div class="flex items-center gap-1 w-full">
                <input v-model="googleClientId" type="text" placeholder="123456789-abc...apps.googleusercontent.com" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-pink-500 focus:border-pink-500">
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <button type="button" @click="copyToClipboard(googleClientId)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                  <button type="button" @click="pasteFromClipboard(googleClientId)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="\u0e27\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                  <button type="button" @click="clearField(googleClientId)" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="\u0e25\u0e49\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              </div>
                  <p class="text-[10px] text-gray-500 mt-1">รับได้จาก <a href="https://console.cloud.google.com/" target="_blank" class="text-pink-600 hover:underline">Google Cloud Console</a></p>
                </div>
              </div>
            </div>

            <!-- LINE Login -->
            <div class="p-5 border border-gray-200 rounded-xl bg-gray-50/50">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-[#06C755]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                  LINE Login <button @click.prevent="openGuide('line_login')" type="button" class="ml-1.5 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-5 h-5 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button>
                </h3>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="lineLoginEnabled" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <div v-if="lineLoginEnabled" class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Channel ID</label>
                  <div class="flex items-center gap-1 w-full">
                <input v-model="lineChannelId" type="text" placeholder="1234567890" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#06C755] focus:border-[#06C755]">
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <button type="button" @click="copyToClipboard(lineChannelId)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                  <button type="button" @click="pasteFromClipboard(lineChannelId)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="\u0e27\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                  <button type="button" @click="clearField(lineChannelId)" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="\u0e25\u0e49\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Channel Secret</label>
                  <div class="flex items-center gap-1 w-full">
                <input v-model="lineChannelSecret" type="password" placeholder="abc123def456..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#06C755] focus:border-[#06C755]">
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <button type="button" @click="copyToClipboard(lineChannelSecret)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                  <button type="button" @click="pasteFromClipboard(lineChannelSecret)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="\u0e27\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                  <button type="button" @click="clearField(lineChannelSecret)" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="\u0e25\u0e49\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              </div>
                  <p class="text-[10px] text-gray-500 mt-1">รับได้จาก <a href="https://developers.line.biz/" target="_blank" class="text-[#06C755] hover:underline">LINE Developers Console</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        
<!-- API & Integrations Settings -->
        <div class="p-8 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg> 
            นักพัฒนาและการเชื่อมต่อ (API & Integrations)
          </h2>
          
          <div class="p-6 border border-gray-200 rounded-xl bg-gray-50/50">
            <h3 class="font-bold text-gray-900 mb-1">สร้าง API Token สำหรับส่งออกข้อมูล</h3>
            <p class="text-xs text-gray-500 mb-4 leading-relaxed">ใช้สำหรับสร้าง <strong class="text-gray-700">JWT Token</strong> เพื่อนำไปใส่ใน Header การดึงข้อมูล API ภายนอก แทนการฝังคีย์ถาวร</p>
            <div class="flex flex-col sm:flex-row gap-3">
               <div class="flex items-center gap-1 w-full">
                <input v-model="exportApiKeyInput" type="password" placeholder="กรอก Master API Key" class="flex-1 max-w-[200px] border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm">
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <button type="button" @click="copyToClipboard(exportApiKeyInput)" class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>
                  <button type="button" @click="pasteFromClipboard(exportApiKeyInput)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="\u0e27\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></button>
                  <button type="button" @click="clearField(exportApiKeyInput)" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="\u0e25\u0e49\u0e32\u0e07"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              </div>
               <input v-model="apiTokenName" type="text" placeholder="ชื่อ / สาเหตุที่ใช้บันทึก (เช่น ระบบบัญชี)" class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm">
               <select v-model="apiTokenType" class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 px-4 py-2 sm:w-auto">
                 <option value="temporary">ชั่วคราว (2 ชั่วโมง)</option>
                 <option value="permanent">ถาวร (ไม่มีวันหมดอายุ)</option>
               </select>
               <button type="button" @click="generateApiToken" :disabled="generatingToken" class="px-6 py-2 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap">
                 {{ generatingToken ? 'กำลังสร้าง...' : 'สร้าง Token' }}
               </button>
            </div>
            
            <div v-if="generatedToken" class="mt-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
               <p class="text-xs font-bold text-emerald-800 mb-2">Token สำเร็จพร้อมใช้งาน:</p>
               <div class="flex items-center gap-2">
                 <input type="text" :value="generatedToken" readonly class="flex-1 bg-white border border-emerald-200 rounded text-xs p-2.5 font-mono text-emerald-700 outline-none selection:bg-emerald-200">
                 <button type="button" @click="copyToken" class="px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 text-xs font-bold transition-colors shadow-sm">คัดลอก</button>
               </div>
            </div>

            <!-- Active Tokens List -->
            <div class="mt-8 border-t border-gray-200 pt-6" v-if="activeApiTokens.length > 0">
               <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 รายการ Token ที่ทำงานอยู่ (Whitelist)
               </h4>
               <div class="overflow-x-auto border border-gray-200 rounded-lg">
                 <table class="w-full text-left text-sm whitespace-nowrap">
                   <thead class="bg-gray-50 border-b border-gray-200">
                     <tr>
                       <th class="px-4 py-3 font-medium text-gray-600">ชื่อรายการ (Memo)</th>
                       <th class="px-4 py-3 font-medium text-gray-600">ประเภท</th>
                       <th class="px-4 py-3 font-medium text-gray-600">วันที่สร้าง</th>
                       <th class="px-4 py-3 font-medium text-gray-600 text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-100 bg-white">
                     <tr v-for="token in activeApiTokens" :key="token.id" class="hover:bg-gray-50">
                       <td class="px-4 py-3 font-medium text-gray-900">{{ token.name }}</td>
                       <td class="px-4 py-3">
                         <span v-if="token.type === 'permanent'" class="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">ถาวร</span>
                         <span v-else class="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">ชั่วคราว</span>
                       </td>
                       <td class="px-4 py-3 text-gray-500 text-xs text-wrap min-w-[120px]">
                         {{ new Date(token.created_at).toLocaleString('th-TH') }}
                         <div v-if="token.expires_at" class="text-[10px] text-rose-500 mt-0.5">หมดอายุ: {{ new Date(token.expires_at).toLocaleString('th-TH') }}</div>
                       </td>
                       <td class="px-4 py-3 text-right">
                         <div class="flex items-center justify-end gap-1">
                            <button @click="copyTokenFromList(token.token)" class="text-gray-500 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Copy Token">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            </button>
                            <button @click="revokeToken(token.id)" class="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors" title="เพิกถอน Token">
                           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                         </button>
                          </div>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>

        
          </div>
        </div>

        <!-- ======================= -->
        <!-- SMTP TAB               -->
        <!-- ======================= -->
        <div v-if="activeTab === 'smtp'" class="space-y-6 animate-fade-in-up">
          <!-- Info Banner -->
          <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4">
            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="text-sm font-bold text-emerald-800">SMTP ใช้สำหรับส่ง Email ยืนยัน Order และแจ้งสถานะจัดส่งให้ลูกค้า</p>
              <p class="text-xs text-emerald-700 mt-1">ค่าที่ตั้งที่นี่จะมีความสำคัญสูงกว่าค่าใน <code class="bg-emerald-100 px-1 rounded">.env</code> ทำให้ไม่ต้องจัดการไฟล์ server โดยตรง</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                ตั้งค่า SMTP Server <button @click.prevent="openGuide('smtp')" type="button" class="ml-2 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-7 h-7 transition-colors" title="คู่มือการตั้งค่า"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></button>
              </h2>
              <p class="text-sm text-gray-500 mt-1">กำหนด SMTP สำหรับส่ง Email ออกจากระบบ</p>
            </div>

            <div class="p-6 space-y-5">
              <!-- Presets -->
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">เลือก Preset</label>
                <div class="flex flex-wrap gap-2">
                  <button type="button" @click="smtpHost = 'smtp.gmail.com'; smtpPort = '587'; smtpSecure = false"
                    class="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all flex items-center gap-2">
                    <img src="https://www.google.com/favicon.ico" class="w-4 h-4"> Gmail
                  </button>
                  <button type="button" @click="smtpHost = 'smtp-mail.outlook.com'; smtpPort = '587'; smtpSecure = false"
                    class="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all flex items-center gap-2">
                    <img src="https://outlook.com/favicon.ico" class="w-4 h-4"> Outlook
                  </button>
                  <button type="button" @click="smtpHost = 'smtp.office365.com'; smtpPort = '587'; smtpSecure = false"
                    class="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all">
                    Office 365
                  </button>
                  <button type="button" @click="smtpHost = 'mail.yourdomain.com'; smtpPort = '587'; smtpSecure = false"
                    class="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    cPanel Hosting
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- SMTP Host -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">SMTP Host *</label>
                  <input v-model="smtpHost" type="text" placeholder="smtp.gmail.com"
                    class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono">
                </div>
                <!-- SMTP Port -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">SMTP Port *</label>
                  <div class="flex gap-2">
                    <input v-model="smtpPort" type="number" placeholder="587"
                      class="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono">
                    <div class="flex gap-1">
                      <button type="button" @click="smtpPort = '587'; smtpSecure = false" class="px-3 py-2 text-xs font-bold rounded-xl border" :class="smtpPort === '587' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'">587</button>
                      <button type="button" @click="smtpPort = '465'; smtpSecure = true" class="px-3 py-2 text-xs font-bold rounded-xl border" :class="smtpPort === '465' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'">465</button>
                    </div>
                  </div>
                </div>

                <!-- SMTP User -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">Email (Username) *</label>
                  <input v-model="smtpUser" type="email" placeholder="your@email.com"
                    class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <p class="text-xs text-gray-400 mt-1">Email ที่ใช้ Login เข้า SMTP Server</p>
                </div>

                <!-- SMTP Password -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">Password / App Password *</label>
                  <input v-model="smtpPass" type="password" placeholder="••••••••••••••••"
                    class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono">
                  <p class="text-xs text-gray-400 mt-1">Gmail ใช้ <a href="https://myaccount.google.com/apppasswords" target="_blank" class="text-blue-500 hover:underline">App Password</a> (ไม่ใช่รหัสปกติ)</p>
                </div>

                <!-- From Name -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อผู้ส่ง (From Name)</label>
                  <input v-model="smtpFrom" type="text" placeholder="Online Shop"
                    class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <p class="text-xs text-gray-400 mt-1">ชื่อที่ลูกค้าจะเห็นในกล่อง Inbox</p>
                </div>

                <!-- SSL/TLS -->
                <div class="flex items-end">
                  <label class="flex items-center gap-3 cursor-pointer py-2.5">
                    <div class="relative">
                      <input type="checkbox" v-model="smtpSecure" class="sr-only">
                      <div @click="smtpSecure = !smtpSecure" class="w-11 h-6 rounded-full transition-colors cursor-pointer" :class="smtpSecure ? 'bg-emerald-500' : 'bg-gray-300'">
                        <div class="w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1" :class="smtpSecure ? 'translate-x-6' : 'translate-x-1'"></div>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-gray-700">ใช้ SSL/TLS (Port 465)</p>
                      <p class="text-xs text-gray-400">สำหรับ Port 587 ปิดตัวเลือกนี้ได้</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Test Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ทดสอบการส่ง Email
            </h3>
            <div class="flex gap-3">
              <input v-model="smtpTestEmail" type="email" placeholder="กรอก Email ปลายทางสำหรับทดสอบ (ไม่กรอก = ใช้ User Email)"
                class="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <button type="button" @click="testSmtp" :disabled="testingSmtp"
                class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap">
                <svg v-if="testingSmtp" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                {{ testingSmtp ? 'กำลังส่ง...' : 'ส่งทดสอบ' }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              กด "บันทึกการตั้งค่า" ก่อนทดสอบ เพื่อให้ระบบใช้ค่าล่าสุด
            </p>
          </div>
        </div>

        <!-- ======================= -->
        <!-- SEO & AI (GEO ENGINE) TAB -->
        <!-- ======================= -->
        <div v-if="activeTab === 'seo'" class="space-y-8 animate-fade-in-up">
          <!-- Banner / Header -->
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
            <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="space-y-2 max-w-2xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  Generative Engine Optimization (GEO Ready)
                </div>
                <h2 class="text-2xl md:text-3xl font-black tracking-tight text-white">
                  ศูนย์ควบคุม SEO & AI Knowledge Engine
                </h2>
                <p class="text-slate-300 text-sm leading-relaxed">
                  จัดการโครงสร้าง Meta Tags, JSON-LD Schema และไฟล์ <code class="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">llms.txt</code> สำหรับบอทค้นหาทั้ง Googlebot และ AI Search Engines (ChatGPT, Perplexity, Claude, Gemini) พร้อมระบบทดสอบและจำลองตัวอย่างข้อมูลจริงแบบเรียลไทม์
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <button type="button" @click="triggerIndexNowPing" :disabled="pingingIndexNow" class="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                  <svg v-if="pingingIndexNow" class="w-4 h-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  {{ pingingIndexNow ? 'กำลังส่ง IndexNow...' : 'ส่ง IndexNow Ping ไปยัง Bing' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Section 1: Global Site Meta & AI Settings -->
          <div class="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 space-y-6">
            <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
              <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              ตั้งค่าข้อมูล SEO & AI Context ประจำเว็บไซต์ (Global Context)
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">ชื่อแสดงผล Meta Title บนโซเชียลและ Search</label>
                <input v-model="storeOgTitle" type="text" placeholder="เช่น STORAGE HOUSE - บ้านเก็บของและโรงเรือนสำเร็จรูประดับพรีเมียม" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายหลัก (Site Meta Description)</label>
                <input v-model="storeDescription" type="text" placeholder="รายละเอียดสั้นๆ แสดงใน Google Search" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">คำค้นหาหลัก (Meta Keywords)</label>
                <input v-model="storeKeywords" type="text" placeholder="เช่น บ้านเก็บของ, ตู้เก็บของกลางแจ้ง, โกดังสำเร็จรูป" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">บริบทสำหรับ AI Search (Default LLM Context)</label>
                <input v-model="seoDefaultLlmContext" type="text" placeholder="คำอธิบายสรุปสั้นๆ สำหรับระบบ AI Search เช่น ChatGPT/Perplexity" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-gray-900">อนุญาตให้ AI Search Bots เข้าถึงข้อมูล (GEO Crawling)</h4>
                <p class="text-xs text-gray-500">เปิดให้ GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot ดึงข้อมูลสินค้าและบทความจาก llms.txt และ Meta Tags</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="seoAiCrawlingEnabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          <!-- Section 2: Real-Data Live Preview Suite -->
          <div class="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  ชุดเครื่องมือตรวจสอบและจำลองการแสดงผลข้อมูลจริง (Real Live Data Inspector)
                </h3>
                <p class="text-xs text-gray-500">เลือกดูตัวอย่างข้อมูลจริงจากสินค้าหรือบทความในฐานข้อมูล เพื่อตรวจสอบว่า Google, โซเชียลมีเดีย และ AI จะมองเห็นเว็บไซต์อย่างไร</p>
              </div>

              <!-- Selector Controls -->
              <div class="flex items-center gap-3">
                <select v-model="previewType" @change="previewTargetId = ''; fetchSeoPreview();" class="border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500">
                  <option value="home">หน้าหลัก (Home)</option>
                  <option value="product">สินค้าจริง (Product)</option>
                  <option value="article">บทความจริง (Article)</option>
                  <option value="project">ผลงานจริง (Project)</option>
                </select>

                <select v-if="previewType === 'product' && previewData?.productsList" v-model="previewTargetId" @change="fetchSeoPreview()" class="border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold max-w-[200px] truncate focus:ring-2 focus:ring-amber-500">
                  <option value="">-- เลือกสินค้า --</option>
                  <option v-for="p in previewData.productsList" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>

                <select v-if="previewType === 'article' && previewData?.articlesList" v-model="previewTargetId" @change="fetchSeoPreview()" class="border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold max-w-[200px] truncate focus:ring-2 focus:ring-amber-500">
                  <option value="">-- เลือกบทความ --</option>
                  <option v-for="a in previewData.articlesList" :key="a.id" :value="a.id">{{ a.title }}</option>
                </select>

                <select v-if="previewType === 'project' && previewData?.projectsList" v-model="previewTargetId" @change="fetchSeoPreview()" class="border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold max-w-[200px] truncate focus:ring-2 focus:ring-amber-500">
                  <option value="">-- เลือกผลงาน --</option>
                  <option v-for="prj in previewData.projectsList" :key="prj.id" :value="prj.id">{{ prj.title }}</option>
                </select>

                <button type="button" @click="fetchSeoPreview" class="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors shrink-0">
                  โหลดข้อมูล
                </button>
              </div>
            </div>

            <!-- Preview Sub-Tabs -->
            <div class="flex items-center gap-2 border-b border-gray-200 pb-2">
              <button type="button" @click="previewSubTab = 'google'" :class="[previewSubTab === 'google' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-gray-500 border-transparent', 'px-4 py-2 border-b-2 text-xs transition-all flex items-center gap-1.5']">
                <svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.9 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                Google Search Card
              </button>
              <button type="button" @click="previewSubTab = 'social'" :class="[previewSubTab === 'social' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-gray-500 border-transparent', 'px-4 py-2 border-b-2 text-xs transition-all flex items-center gap-1.5']">
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Social Card (FB & X)
              </button>
              <button type="button" @click="previewSubTab = 'ai'" :class="[previewSubTab === 'ai' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-gray-500 border-transparent', 'px-4 py-2 border-b-2 text-xs transition-all flex items-center gap-1.5']">
                <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                AI Knowledge (LLMs)
              </button>
              <button type="button" @click="previewSubTab = 'schema'" :class="[previewSubTab === 'schema' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-gray-500 border-transparent', 'px-4 py-2 border-b-2 text-xs transition-all flex items-center gap-1.5']">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                JSON-LD Inspector
              </button>
            </div>

            <!-- Preview Displays -->
            <div v-if="previewLoading" class="p-8 text-center text-gray-500">
              <div class="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              กำลังดึงและสกัดข้อมูล real-time จากฐานข้อมูล...
            </div>

            <div v-else-if="previewData?.data" class="space-y-4">
              <!-- SubTab: Google -->
              <div v-if="previewSubTab === 'google'" class="p-6 bg-slate-50 border border-gray-200 rounded-2xl space-y-3">
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <div class="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">M</div>
                  <span class="truncate font-mono text-slate-600">{{ previewData.data.googleSnippet.url }}</span>
                </div>
                <h4 class="text-lg font-medium text-blue-800 hover:underline cursor-pointer leading-snug">
                  {{ previewData.data.googleSnippet.title }}
                </h4>
                <p class="text-xs text-slate-600 leading-relaxed max-w-2xl line-clamp-2">
                  {{ previewData.data.googleSnippet.description }}
                </p>
                <div v-if="previewData.data.googleSnippet.priceFormatted" class="flex items-center gap-3 text-xs pt-1">
                  <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{{ previewData.data.googleSnippet.priceFormatted }}</span>
                  <span class="text-amber-600 font-bold">★ {{ previewData.data.googleSnippet.rating }} ({{ previewData.data.googleSnippet.reviewCount }} รีวิว)</span>
                  <span class="text-emerald-600 font-bold" v-if="previewData.data.googleSnippet.inStock">✓ มีสินค้าพร้อมจัดส่ง</span>
                </div>
              </div>

              <!-- SubTab: Social -->
              <div v-if="previewSubTab === 'social'" class="max-w-md bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">
                <div class="h-48 bg-slate-100 overflow-hidden relative">
                  <img :src="previewData.data.socialCard.image" class="w-full h-full object-cover" @error="previewData.data.socialCard.image = '/og-image.jpg'">
                  <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded font-mono uppercase">Open Graph Preview</div>
                </div>
                <div class="p-4 space-y-1.5 bg-slate-50">
                  <span class="text-[10px] text-slate-400 font-mono uppercase">{{ previewData.data.socialCard.domain }}</span>
                  <h4 class="font-bold text-sm text-slate-900 line-clamp-1">{{ previewData.data.socialCard.title }}</h4>
                  <p class="text-xs text-slate-500 line-clamp-2">{{ previewData.data.socialCard.description }}</p>
                </div>
              </div>

              <!-- SubTab: AI -->
              <div v-if="previewSubTab === 'ai'" class="p-6 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span class="text-amber-400 font-bold flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    ข้อมูลที่ส่งให้ AI Crawlers (llm-context & llms.txt Feed)
                  </span>
                  <span class="text-[10px] text-slate-400">Content-Type: text/plain</span>
                </div>
                <div class="space-y-2">
                  <p class="text-slate-400">// Direct LLM Context Meta Tag:</p>
                  <pre class="bg-slate-950 p-3 rounded-xl text-amber-200 whitespace-pre-wrap">&lt;meta name="llm-context" content="{{ previewData.data.aiPreview.llmContext }}" /&gt;</pre>
                </div>
                <div class="space-y-2 pt-2">
                  <p class="text-slate-400">// Markdown Knowledge Feed Snippet:</p>
                  <pre class="bg-slate-950 p-3 rounded-xl text-slate-300 whitespace-pre-wrap">{{ previewData.data.aiPreview.knowledgeFeedSnippet }}</pre>
                </div>
              </div>

              <!-- SubTab: Schema -->
              <div v-if="previewSubTab === 'schema'" class="relative">
                <pre class="p-5 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">{{ previewData.data.jsonLdSchema }}</pre>
              </div>
            </div>
          </div>

          <!-- Section 3: Live Files & Bot Action Center -->
          <div class="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 space-y-4">
            <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              ไฟล์สำหรับบอทและลิงก์ตรวจสอบฉบับจริง (Live Endpoints)
            </h3>
            <p class="text-xs text-gray-500">คุณสามารถเปิดทดสอบลิงก์ที่สร้างขึ้นสำหรับ Search Engine และ AI Models ได้ทันที:</p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <a href="/sitemap.xml" target="_blank" class="p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-2xl text-center group transition-all">
                <span class="block font-mono text-xs font-bold text-indigo-600 group-hover:underline">/sitemap.xml</span>
                <span class="text-[10px] text-gray-500 mt-1 block">แผนผังเว็บไซต์ Google</span>
              </a>
              <a href="/robots.txt" target="_blank" class="p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-2xl text-center group transition-all">
                <span class="block font-mono text-xs font-bold text-indigo-600 group-hover:underline">/robots.txt</span>
                <span class="text-[10px] text-gray-500 mt-1 block">กฎสำหรับ Search Crawlers</span>
              </a>
              <a href="/llms.txt" target="_blank" class="p-4 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-2xl text-center group transition-all">
                <span class="block font-mono text-xs font-bold text-amber-600 group-hover:underline">/llms.txt</span>
                <span class="text-[10px] text-gray-500 mt-1 block">ดรรชนีความรู้สำหรับ AI</span>
              </a>
              <a href="/llms-full.txt" target="_blank" class="p-4 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-2xl text-center group transition-all">
                <span class="block font-mono text-xs font-bold text-amber-600 group-hover:underline">/llms-full.txt</span>
                <span class="text-[10px] text-gray-500 mt-1 block">ฐานข้อมูลสินค้าฉบับเต็ม</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Sticky Save Actions -->
        <div class="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 shrink-0 flex justify-end gap-4 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] filter transform translate-y-0 transition-transform">
          <button type="button" @click="loadSettings" :disabled="loading || saving" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm disabled:opacity-50">
            รีเซ็ตค่า
          </button>
          <button type="submit" :disabled="saving" class="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-2">
            <svg v-if="saving" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            {{ saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
          </button>
        </div>
      </form>
    </div>
  </div>

    
  <!-- ADD GEMINI MODEL MODAL -->
  <div v-if="addModelModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" @click.self="addModelModal.show = false">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up flex flex-col overflow-hidden bg-white">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-lg text-gray-900">เพิ่มเวอร์ชันโมเดล Gemini</h3>
        <button @click="addModelModal.show = false" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1">Model ID <span class="text-rose-500">*</span></label>
          <input v-model="addModelModal.id" type="text" placeholder="เช่น gemini-3.5-flash" class="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono">
          <p class="text-[10px] text-gray-400 mt-1">ต้องตรงตาม Model ID ของ Google API เช่น gemini-2.5-pro, gemini-3.5-flash</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1">ชื่อโมเดล (Display Name) <span class="text-rose-500">*</span></label>
          <input v-model="addModelModal.name" type="text" placeholder="เช่น Gemini 3.5 Flash" class="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1">ระดับโมเดล (Tier) <span class="text-rose-500">*</span></label>
          <select v-model="addModelModal.tier" class="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="recommended">recommended (แนะนำ)</option>
            <option value="stable">stable (เสถียร)</option>
            <option value="premium">premium (ขั้นสูง)</option>
            <option value="economy">economy (ประหยัด)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายโมเดล</label>
          <textarea v-model="addModelModal.description" rows="2" placeholder="เช่น รุ่นใหม่ล่าสุด ฉลาดและรวดเร็วที่สุด" class="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white"></textarea>
        </div>
      </div>
      <div class="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <button @click="addModelModal.show = false" class="px-4 py-2 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors">
          ยกเลิก
        </button>
        <button @click="addModel" class="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          เพิ่มเวอร์ชัน
        </button>
      </div>
    </div>
  </div>

  <!-- GUIDE MODAL POPUP -->
  <div v-if="guideModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" @click.self="guideModal.show = false">
    <div class="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-lg text-gray-900">{{ guideModal.title }}</h3>
        <button @click="guideModal.show = false" class="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 overflow-y-auto">
        <div v-html="guideModal.content"></div>
      </div>
      <div class="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button @click="guideModal.show = false" class="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors text-sm">
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  </div>
\n    <!-- Confirm Modal -->
<Teleport to="body">
      <Transition name="fade">
        <div v-if="confirmModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="confirmModal.onCancel"></div>
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">{{ confirmModal.title }}</h3>
            </div>
            <p class="text-sm text-gray-600 mb-6 leading-relaxed">{{ confirmModal.message }}</p>
            <div class="flex gap-3 justify-end">
              <button @click="confirmModal.onCancel" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
              <button @click="confirmModal.onConfirm" class="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors">ยืนยัน</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
</template>
