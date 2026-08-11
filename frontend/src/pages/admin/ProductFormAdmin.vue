<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'
import IconSelect from '../../components/ui/IconSelect.vue'
import draggable from 'vuedraggable'
import { useRoute, useRouter } from 'vue-router'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'
import AdminCategoryDropdown from '../../components/admin/AdminCategoryDropdown.vue'
import AdminCategoryMultiDropdown from '../../components/admin/AdminCategoryMultiDropdown.vue'
import { useSettingsStore } from '../../stores/settingsStore'

const settingsStore = useSettingsStore()

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const route = useRoute()
const router = useRouter()

// Editor Config
const editor = ClassicEditor
const editorConfig = ref({
    licenseKey: 'GPL',
    plugins: [
        Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo,
        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed
    ],
    toolbar: [
        'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|',
        'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'bulletedList', 'numberedList'
    ],
    table: {
        contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
    },
    image: {
        toolbar: [
            'imageTextAlternative', 'toggleImageCaption', '|',
            'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
            'resizeImage'
        ]
    },
    simpleUpload: {
        uploadUrl: '/api/upload/ckeditor',
    }
})

// Navigation Tabs
const activeTab = ref('basic')
const tabs = [
  { id: 'basic', label: 'ข้อมูลพื้นฐาน', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'details', label: 'รายละเอียดสินค้า', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'attributes', label: 'สเปกสินค้า (Attributes)', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'media', label: 'รูปภาพ', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'sales', label: 'สินค้าเกี่ยวเนื่อง', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'marketplaces', label: 'ลิงก์ร้านค้าภายนอก', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'card_ui', label: 'การ์ดสินค้า', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'seo', label: 'ตั้งค่า SEO', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
]

const form = ref({
  name: '',
  sku: '',
  category: '',
  categories: [],
  original_price: null,
  price: 0,
  has_installation_fee: false,
  free_install_bkk: false,
  requires_foundation: true,
  installation_fee: null,
  size: '',
  image_url: '',
  description: '',
  images: [],
  is_active: true,
  is_out_of_stock: false,
  stock_quantity: '',
  sale_end_date: '',
  weight_kg: '',
  width_cm: '',
  length_cm: '',
  height_cm: '',
  limit_one_per_order: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  shopee_link: '',
  lazada_link: '',
  tiktok_link: '',
  llm_context: '',
  short_description: '',
  remarks: '',
  slug: '',
  image_alt: '',
  attributes: [{ key: '', value: '' }],
  faq: [{ question: '', answer: '' }],
  related_products: [],
  badge_free_shipping: false,
  free_shipping_bkk: false,
  badge_warranty: false,
  badge_installation: false,
  badge_new: false,
  badge_bestseller: false,
  badge_recommended: false,
  badges: [],
  rating: 5.0,
  review_count: 0,
  compare_enabled: true,
  card_features: {
    enabled: true,
    show_stack: true,
    show_badge: true,
    show_bottom_bar: true,
    stack: [],
    badge: { icon: '', text1: '', text2: '' },
    bottom_bar: []
  }
})

const loading = ref(false)
const saving = ref(false)
const aiGenerating = ref(false)
const aiGeneratingAttributes = ref(false)
const aiGeneratingFaq = ref(false)
const aiFormatting = ref(false)
const uploadingImages = ref(false)
const allImages = ref([]) // Unified images layout
const isEdit = ref(false)
const isLoadingProduct = ref(false)
const productId = ref(null)

const categories = ref([])
const allProductsForSelect = ref([])
const relatedFilterCategory = ref('all')

const filteredRelatedProducts = computed(() => {
  let list = allProductsForSelect.value.filter(p => !isEdit.value || p.id !== productId.value)
  if (relatedFilterCategory.value !== 'all') {
    list = list.filter(p => p.category === relatedFilterCategory.value)
  }
  return list
})

const isRelatedSelected = (id) => {
  if (!form.value.related_products || !Array.isArray(form.value.related_products)) return false;
  return form.value.related_products.some(relId => String(relId) === String(id));
}

// Badge management
const allBadges = ref([])
const showBadgeModal = ref(false)
const badgeForm = ref({ name: '', icon: 'tag', color: 'gray' })
const editingBadgeId = ref(null)
const badgeSaving = ref(false)

const badgeIconMap = {
  check: 'M5 13l4 4L19 7',
  shield: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  fire: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  thumbsup: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  gift: 'M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 00-2 2v2h6zm0 0V5.5A2.5 2.5 0 0114.5 3 2 2 0 0116 5v3h-4zm-8 4h16M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
}
const badgeColorOptions = ['emerald', 'blue', 'teal', 'amber', 'rose', 'indigo', 'purple', 'gray', 'red', 'orange', 'cyan', 'pink']
const badgeIconOptions = Object.keys(badgeIconMap)

// Icon options with Thai labels for Card UI tab
const cardIconOptions = [
  { value: 'sun', label: 'พระอาทิตย์ (กันแดด)' },
  { value: 'cloud', label: 'เมฆ (กันฝน)' },
  { value: 'shield', label: 'โล่ (ทนทาน)' },
  { value: 'shield-check', label: 'โล่เครื่องหมายถูก' },
  { value: 'wind', label: 'ลม (ระบายอากาศ)' },
  { value: 'water', label: 'หยดน้ำ (กันน้ำ)' },
  { value: 'leaf', label: 'ใบไม้ (ธรรมชาติ)' },
  { value: 'lightning', label: 'สายฟ้า (พลังงาน)' },
  { value: 'fire', label: 'ไฟ (ทนความร้อน)' },
  { value: 'check', label: 'เครื่องหมายถูก' },
  { value: 'star', label: 'ดาว (พรีเมียม)' },
  { value: 'medal', label: 'เหรียญ (รับรอง)' },
  { value: 'clock', label: 'นาฬิกา (อายุใช้งาน)' },
  { value: 'cube', label: 'กล่อง (ประกอบง่าย)' },
  { value: 'truck', label: 'รถขนส่ง (จัดส่ง)' },
  { value: 'cog', label: 'เฟือง (ระบบ)' },
  { value: 'chip', label: 'ชิป (เทคโนโลยี)' },
  { value: 'eye', label: 'ตา (มองเห็น)' },
  { value: 'heart', label: 'หัวใจ (ชื่นชอบ)' },
  { value: 'home', label: 'บ้าน (ใช้ในบ้าน)' },
  { value: 'lock', label: 'กุญแจ (ปลอดภัย)' },
  { value: 'globe', label: 'โลก (สากล)' },
  { value: 'tag', label: 'แท็ก (ป้าย)' },
  { value: 'tools', label: 'เครื่องมือ' },
  { value: 'sparkles', label: 'ประกาย (พิเศษ)' }
]

const getBadgeIconPath = (icon) => badgeIconMap[icon] || badgeIconMap.tag

const loadBadges = async () => {
  try {
    const res = await apiFetch('/api/badges')
    const data = await res.json()
    if (data.success) allBadges.value = data.data
  } catch (e) { console.error('Load badges error:', e) }
}

const toggleBadge = (badgeId) => {
  const idx = form.value.badges.indexOf(badgeId)
  if (idx >= 0) form.value.badges.splice(idx, 1)
  else form.value.badges.push(badgeId)
}

const openCreateBadge = () => {
  editingBadgeId.value = null
  badgeForm.value = { name: '', icon: 'tag', color: 'gray' }
  showBadgeModal.value = true
}

const openEditBadge = (badge) => {
  editingBadgeId.value = badge.id
  badgeForm.value = { name: badge.name, icon: badge.icon, color: badge.color }
  showBadgeModal.value = true
}

const saveBadge = async () => {
  if (!badgeForm.value.name.trim()) return showToast('กรุณาระบุชื่อป้ายกำกับ', 'warning')
  badgeSaving.value = true
  try {
    const url = editingBadgeId.value ? `/api/badges/${editingBadgeId.value}` : '/api/badges'
    const method = editingBadgeId.value ? 'PUT' : 'POST'
    const res = await apiFetch(url, { method, body: JSON.stringify(badgeForm.value) })
    const data = await res.json()
    if (data.success) {
      showToast(editingBadgeId.value ? 'แก้ไขป้ายกำกับแล้ว' : 'เพิ่มป้ายกำกับใหม่แล้ว', 'success')
      await loadBadges()
      showBadgeModal.value = false
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { badgeSaving.value = false }
}

const deleteBadge = async (badge) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบป้ายกำกับ',
    message: `ต้องการลบป้าย "${badge.name}" ใช่หรือไม่?`,
    confirmText: 'ลบ',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (!isConfirmed) return
  try {
    const res = await apiFetch(`/api/badges/${badge.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('ลบป้ายกำกับแล้ว', 'success')
      form.value.badges = form.value.badges.filter(id => id !== badge.id)
      await loadBadges()
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') }
}

onMounted(async () => {
  await loadCategories()
  await loadAllProductsForSelect()
  await loadBadges()
  
  if (route.params.id) {
    isEdit.value = true
    productId.value = route.params.id
    loading.value = true
    await loadProduct()
    loading.value = false
  }
})

const loadCategories = async () => {
  try {
    const res = await apiFetch('/api/categories')
    const data = await res.json()
    if (data.success) {
      categories.value = data.data
    }
  } catch (error) {
    console.error('Fetch categories error:', error)
  }
}

// System for Category Templates
const categoryTemplates = ref([])

const loadCategoryTemplates = async (categoryName) => {
  if (!categoryName) return
  try {
    const res = await apiFetch(`/api/category-attributes/${encodeURIComponent(categoryName)}`)
    const data = await res.json()
    if (data.success) {
      categoryTemplates.value = data.data
      syncAttributesWithTemplate()
    }
  } catch (error) {
    console.error('Fetch templates error:', error)
  }
}

const syncAttributesWithTemplate = () => {
  if (!Array.isArray(form.value.attributes)) form.value.attributes = []
  
  const existingAttrsMap = new Map()
  form.value.attributes.forEach(attr => {
    if (attr && attr.key) existingAttrsMap.set(attr.key, attr)
  })
  
  const newAttributes = []
  
  // Add template attributes
  categoryTemplates.value.forEach(template => {
    const existing = existingAttrsMap.get(template.attribute_key)
    newAttributes.push({
      key: template.attribute_key,
      value: existing ? existing.value : '',
      isTemplate: true,
      label: template.attribute_label,
      type: template.attribute_type,
      options: template.options ? JSON.parse(template.options) : [],
      required: template.is_required
    })
    existingAttrsMap.delete(template.attribute_key)
  })
  
  // Append custom attributes
  existingAttrsMap.forEach(attr => {
    newAttributes.push({
      key: attr.key,
      value: attr.value,
      isTemplate: false
    })
  })
  
  // If empty and no templates, add a blank row
  if (newAttributes.length === 0) {
    newAttributes.push({ key: '', value: '', isTemplate: false })
  }
  
  form.value.attributes = newAttributes
}

watch(() => form.value.categories, (newCategories) => {
  if (newCategories && newCategories.length > 0) {
    const primaryCategory = newCategories[0]
    // Keep legacy category field in sync
    form.value.category = primaryCategory
    // Skip watcher-triggered template load during initial product load
    if (!isLoadingProduct.value) {
      loadCategoryTemplates(primaryCategory)
    }
    // Default filter to product's primary category
    if (relatedFilterCategory.value === 'all' && primaryCategory) {
      relatedFilterCategory.value = primaryCategory
    }
  }
}, { deep: true })

const loadAllProductsForSelect = async () => {
  try {
    // Only fetch for admin, to get all active/inactive for selection
    const res = await apiFetch('/api/products?admin=true')
    const data = await res.json()
    if (data.success) {
      allProductsForSelect.value = data.data
    }
  } catch (error) {
    console.error('Fetch all products error:', error)
  }
}

const loadProduct = async () => {
  isLoadingProduct.value = true
  try {
    const res = await apiFetch(`/api/products/${productId.value}`)
    const data = await res.json()
    if (data.success) {
      const p = data.data

      // ── Parse all JSON string fields from raw API data first ──
      if (typeof p.images === 'string') {
        try { p.images = JSON.parse(p.images) } catch { p.images = [] }
      }
      if (typeof p.attributes === 'string') {
        try { p.attributes = JSON.parse(p.attributes) || [] } catch { p.attributes = [] }
      }
      if (!Array.isArray(p.attributes)) p.attributes = []
      
      if (typeof p.faq === 'string') {
        try { p.faq = JSON.parse(p.faq) } catch { p.faq = [{ question: '', answer: '' }] }
      }
      if (typeof p.related_products === 'string') {
        try { p.related_products = JSON.parse(p.related_products) } catch { p.related_products = [] }
      }
      if (typeof p.badges === 'string') {
        try { p.badges = JSON.parse(p.badges) || [] } catch { p.badges = [] }
      } else if (!p.badges) {
        p.badges = []
      }
      if (!Array.isArray(p.badges)) {
        p.badges = [p.badges]
      }

      // Sync database boolean badge columns to dynamic badges list
      const systemBadgesMap = {
        badge_bestseller: 'badge-bestseller',
        badge_warranty: 'badge-warranty',
        badge_installation: 'badge-installation',
        badge_new: 'badge-new',
        badge_recommended: 'badge-recommended',
        badge_free_shipping: 'badge-free-shipping'
      }
      for (const [col, badgeId] of Object.entries(systemBadgesMap)) {
        if (p[col] && !p.badges.includes(badgeId)) {
          p.badges.push(badgeId)
        }
      }

      // Parse categories JSON
      if (typeof p.categories === 'string') {
        try { p.categories = JSON.parse(p.categories) } catch { p.categories = [] }
      }
      if (!Array.isArray(p.categories) || p.categories.length === 0) {
        // Fallback: use old category field
        p.categories = p.category ? [p.category] : []
      }

      // Ensure arrays have at least one empty entry for the UI
      if (!p.faq || p.faq.length === 0) p.faq = [{ question: '', answer: '' }]
      if (!p.related_products) p.related_products = []

      // Ensure card_features has default structure
      if (!p.card_features) {
        p.card_features = { enabled: true, show_stack: true, show_badge: true, show_bottom_bar: true, stack: [], badge: { icon: '', text1: '', text2: '' }, bottom_bar: [] }
      } else {
        if (p.card_features.enabled === undefined) p.card_features.enabled = true
        if (p.card_features.show_stack === undefined) p.card_features.show_stack = true
        if (p.card_features.show_badge === undefined) p.card_features.show_badge = true
        if (p.card_features.show_bottom_bar === undefined) p.card_features.show_bottom_bar = true
        if (!p.card_features.stack) p.card_features.stack = []
        if (!p.card_features.badge) p.card_features.badge = { icon: '', text1: '', text2: '' }
        if (!p.card_features.bottom_bar) p.card_features.bottom_bar = []
      }

      // ── Single assign to form.value (without attributes — will be synced via template) ──
      const { attributes: rawAttributes, ...restData } = p
      form.value = { ...form.value, ...restData, attributes: rawAttributes }

      // ── Fix sale_end_date timezone ──
      if (form.value.sale_end_date) {
        try {
           const d = new Date(form.value.sale_end_date)
           d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
           form.value.sale_end_date = d.toISOString().slice(0, 16)
        } catch(e) {}
      }

      // ── Populate unified images array ──
      const arr = []
      if (p.image_url) arr.push(p.image_url)
      if (Array.isArray(p.images)) arr.push(...p.images)
      allImages.value = arr.filter(Boolean)

      // ── Load category templates and sync attributes LAST ──
      // This ensures syncAttributesWithTemplate() merges raw attributes with template metadata
      // and does NOT get overwritten by a second form.value assignment
      // Load category templates based on primary category
      const primaryCat = form.value.categories && form.value.categories.length > 0 ? form.value.categories[0] : form.value.category
      if (primaryCat) {
        await loadCategoryTemplates(primaryCat)
      }
    }
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    isLoadingProduct.value = false
  }
}

const handleImagesUpload = async (e) => {
  const files = Array.from(e.target.files || e.dataTransfer?.files || [])
  if (files.length === 0) return
  
  const validFiles = files.filter(f => f.type.startsWith('image/'))
  if (validFiles.length < files.length) {
    showToast('บางไฟล์ไม่ใช่รูปภาพ ระบบจะข้ามไฟล์เหล่านั้นไป', 'warning')
  }
  
  if (validFiles.length === 0) return

  uploadingImages.value = true
  for (const file of validFiles) {
    await uploadFile(file, (url) => { allImages.value.push('' + url) })
  }
  uploadingImages.value = false
  if (e.target.value) e.target.value = ''
}

const handleImagesDrop = (e) => { handleImagesUpload(e) }

const removeImage = (index) => {
  allImages.value.splice(index, 1)
}

const generateSEO = async () => {
  if (!form.value.name) {
    showToast('กรุณากรอกชื่อสินค้าก่อนให้ AI สร้าง SEO', 'warning')
    return
  }

  aiGenerating.value = true
  try {
    const res = await apiFetch('/api/ai/generate-seo', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data) {
      form.value.seo_title = data.data.title || form.value.seo_title
      form.value.seo_keywords = data.data.keywords || form.value.seo_keywords
      form.value.seo_description = data.data.description || form.value.seo_description
      if (data.data.llm_context) {
        form.value.llm_context = data.data.llm_context
      }
      showToast('AI สร้างข้อมูล SEO และ LLM Context อัตโนมัติสำเร็จแล้ว', 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI Generation error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGenerating.value = false
  }
}

const generateAttributes = async () => {
  if (!form.value.description && !form.value.name) {
    showToast('กรุณากรอกชื่อและรายละเอียดสินค้าก่อนให้ AI สร้างสเปก', 'warning')
    return
  }

  aiGeneratingAttributes.value = true
  try {
    const res = await apiFetch('/api/ai/generate-attributes', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data && Array.isArray(data.data)) {
      form.value.attributes = data.data
      if (categoryTemplates.value && categoryTemplates.value.length > 0) {
        syncAttributesWithTemplate()
      }
      showToast('AI สร้างตารางสเปกสินค้าสำเร็จแล้ว', 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI Attributes Generation error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingAttributes.value = false
  }
}

const generateFaq = async () => {
  if (!form.value.description && !form.value.name) {
    showToast('กรุณากรอกชื่อและรายละเอียดสินค้าก่อนให้ AI สร้าง FAQ', 'warning')
    return
  }

  aiGeneratingFaq.value = true
  try {
    const res = await apiFetch('/api/ai/generate-faq', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data && Array.isArray(data.data)) {
      // If FAQ is empty (just the default blank entry), replace entirely
      if (form.value.faq.length === 1 && !form.value.faq[0].question && !form.value.faq[0].answer) {
        form.value.faq = data.data
      } else {
        // Otherwise append new FAQ items to existing ones
        form.value.faq = [...form.value.faq, ...data.data]
      }
      showToast('AI สร้างคำถามที่พบบ่อยสำเร็จแล้ว', 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI FAQ Generation error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingFaq.value = false
  }
}

const addCardFeatureStack = () => {
  if (!form.value.card_features.stack) form.value.card_features.stack = []
  if (form.value.card_features.stack.length < 3) {
    form.value.card_features.stack.push({ icon: 'tag', text: '' })
  }
}
const removeCardFeatureStack = (idx) => {
  form.value.card_features.stack.splice(idx, 1)
}
const addCardFeatureBottom = () => {
  if (!form.value.card_features.bottom_bar) form.value.card_features.bottom_bar = []
  if (form.value.card_features.bottom_bar.length < 3) {
    form.value.card_features.bottom_bar.push({ icon: 'tag', title: '', subtitle: '' })
  }
}
const removeCardFeatureBottom = (idx) => {
  form.value.card_features.bottom_bar.splice(idx, 1)
}

const uploadFile = async (file, callback) => {
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      callback(data.url)
    } else {
      showToast('อัปโหลดล้มเหลว: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
  }
}

const formatDescriptionSEO = async () => {
  if (!form.value.description) {
    showToast('กรุณากรอกรายละเอียดสินค้าเบื้องต้นก่อนให้ AI ช่วยจัดรูปแบบ', 'warning')
    return
  }
  
  try {
    aiFormatting.value = true
    const res = await apiFetch('/api/ai/format-description', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description
      })
    })

    const data = await res.json()
    if (data.success) {
      form.value.description = data.data
      
      showToast('AI จัดรูปแบบเนื้อหาเรียบร้อยแล้ว', 'success')
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาดในการจัดรูปแบบ', 'error')
    }
  } catch (error) {
    console.error('AI format error:', error)
    showToast('การเชื่อมต่อกับ AI ขัดข้อง', 'error')
  } finally {
    aiFormatting.value = false
  }
}

const generateSlug = () => {
  if (!form.value.name) return
  let s = form.value.name.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-ก-๙]+/g, '')
        .replace(/\u0e4d/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
  form.value.slug = s
}

const addAttribute = () => form.value.attributes.push({ key: '', value: '' })
const removeAttribute = (index) => form.value.attributes.splice(index, 1)

const addFaq = () => form.value.faq.push({ question: '', answer: '' })
const removeFaq = async (index) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบ',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม FAQ นี้?',
    confirmText: 'ลบข้อมูล',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (!isConfirmed) return
  form.value.faq.splice(index, 1)
  // Auto-save to persist deletion immediately (only if editing existing product)
  if (isEdit.value) {
    await saveProduct()
  }
}

const saveProduct = async () => {
  // ─── Client-side Validation ───
  const validationErrors = []

  // 1. Required: Product Name
  if (!form.value.name || !String(form.value.name).trim()) {
    validationErrors.push('กรุณากรอกชื่อสินค้า')
  }

  // 2. Required: Category (at least one)
  if (!form.value.categories || !Array.isArray(form.value.categories) || form.value.categories.length === 0) {
    validationErrors.push('กรุณาเลือกหมวดหมู่สินค้าอย่างน้อย 1 หมวดหมู่')
  }

  // 3. Price validation
  const priceVal = form.value.price !== null && form.value.price !== undefined && form.value.price !== ''
    ? Number(typeof form.value.price === 'string' ? form.value.price.replace(/[^\d.]/g, '') : form.value.price)
    : null

  if (priceVal === null || isNaN(priceVal)) {
    validationErrors.push('กรุณากรอกราคาสินค้าให้ถูกต้อง')
  } else if (priceVal < 0) {
    validationErrors.push('ราคาสินค้าต้องไม่ติดลบ')
  }

  // 3.5. Installation fee validation
  if (form.value.has_installation_fee) {
    const installFee = Number(form.value.installation_fee)
    if (isNaN(installFee) || installFee < 0) {
      validationErrors.push('กรุณาระบุค่าติดตั้งให้ถูกต้อง (ไม่ติดลบ)')
    }
  }

  // 4. Original price vs sale price
  if (form.value.original_price !== null && form.value.original_price !== undefined && form.value.original_price !== '') {
    const origVal = Number(typeof form.value.original_price === 'string' ? form.value.original_price.replace(/[^\d.]/g, '') : form.value.original_price)
    if (isNaN(origVal)) {
      validationErrors.push('ราคาเต็ม (ก่อนลด) ไม่ถูกต้อง กรุณากรอกเป็นตัวเลข')
    } else if (origVal < 0) {
      validationErrors.push('ราคาเต็ม (ก่อนลด) ต้องไม่ติดลบ')
    } else if (priceVal !== null && !isNaN(priceVal) && origVal > 0 && priceVal > 0 && origVal <= priceVal) {
      validationErrors.push('ราคาเต็ม (ก่อนลด) ต้องมากกว่าราคาขาย')
    }
  }

  // 5. Image recommendation (warning, not blocking)
  if (!allImages.value || allImages.value.length === 0) {
    showToast('แนะนำให้เพิ่มรูปภาพสินค้าอย่างน้อย 1 รูป', 'warning')
  }

  // 6. Numeric dimension fields validation
  const numericFields = [
    { key: 'weight_kg', label: 'น้ำหนัก' },
    { key: 'width_cm', label: 'ความกว้าง' },
    { key: 'length_cm', label: 'ความยาว' },
    { key: 'height_cm', label: 'ความสูง' },
    { key: 'stock_quantity', label: 'จำนวนสต็อก' }
  ]
  for (const field of numericFields) {
    const val = form.value[field.key]
    if (val !== null && val !== undefined && val !== '') {
      const num = Number(val)
      if (isNaN(num)) {
        validationErrors.push(`${field.label} ต้องเป็นตัวเลขเท่านั้น`)
      } else if (num < 0) {
        validationErrors.push(`${field.label} ต้องไม่ติดลบ`)
      }
    }
  }

  // 7. Sale end date validation
  if (form.value.sale_end_date) {
    const saleEnd = new Date(form.value.sale_end_date)
    if (isNaN(saleEnd.getTime())) {
      validationErrors.push('วันสิ้นสุดโปรโมชัน ไม่ถูกต้อง')
    } else if (saleEnd < new Date()) {
      showToast('วันสิ้นสุดโปรโมชันผ่านมาแล้ว ระบบจะบันทึกให้แต่โปรดตรวจสอบอีกครั้ง', 'warning')
    }
  }

  // 8. SKU duplicate-character check (basic format)
  if (form.value.sku && String(form.value.sku).trim().length > 100) {
    validationErrors.push('รหัส SKU ยาวเกินไป (สูงสุด 100 ตัวอักษร)')
  }

  // 9. Slug validation
  if (form.value.slug && /\s/.test(form.value.slug)) {
    validationErrors.push('Slug ต้องไม่มีช่องว่าง')
  }

  // ─── Show validation errors and abort ───
  if (validationErrors.length > 0) {
    validationErrors.forEach((msg, i) => {
      setTimeout(() => showToast(msg, 'error', 5000), i * 200)
    })
    return
  }

  saving.value = true
  
  // Sync allImages back to form
  form.value.image_url = allImages.value && allImages.value.length > 0 ? allImages.value[0] : ''
  form.value.images = allImages.value && allImages.value.length > 1 ? allImages.value.slice(1) : []
  
  // Create a deep copy payload for sending to the API so we don't destroy `form.value` UI state
  const payload = JSON.parse(JSON.stringify(form.value))
  
  // Clean arrays for attributes (strip template UI metadata before saving to DB)
  if (Array.isArray(payload.attributes)) {
    payload.attributes = payload.attributes
      .filter(a => a && (String(a.key || '').trim() !== '' || String(a.value || '').trim() !== ''))
      .map(a => ({ key: String(a.key || '').trim(), value: String(a.value || '') }))
  } else {
    payload.attributes = []
  }

  if (Array.isArray(payload.faq)) {
    payload.faq = payload.faq.filter(f => f && (String(f.question || '').trim() !== '' || String(f.answer || '').trim() !== ''))
  } else {
    payload.faq = []
  }

  if (!Array.isArray(payload.badges)) {
    payload.badges = []
  }

  // Sync database boolean badge columns with dynamic badges list before coercion/saving
  const systemBadgesMap = {
    badge_bestseller: 'badge-bestseller',
    badge_warranty: 'badge-warranty',
    badge_installation: 'badge-installation',
    badge_new: 'badge-new',
    badge_recommended: 'badge-recommended',
    badge_free_shipping: 'badge-free-shipping'
  }
  for (const [col, badgeId] of Object.entries(systemBadgesMap)) {
    payload[col] = payload.badges.includes(badgeId)
  }

  if (payload.price === null || payload.price === undefined) payload.price = 0
  if (payload.category === null || payload.category === undefined) payload.category = ''
  // Sync categories array to payload
  if (!Array.isArray(payload.categories) || payload.categories.length === 0) {
    payload.categories = payload.category ? [payload.category] : []
  }
  payload.category = payload.categories.length > 0 ? payload.categories[0] : ''
  
  if (typeof payload.price === 'string') {
    payload.price = Number(payload.price.replace(/[^\d.]/g, ''))
  }
  if (typeof payload.original_price === 'string' && payload.original_price) {
    payload.original_price = Number(payload.original_price.replace(/[^\d.]/g, ''))
  }
  
  payload.is_active = typeof payload.is_active === 'string' ? payload.is_active === 'true' : Boolean(payload.is_active)
  payload.is_out_of_stock = typeof payload.is_out_of_stock === 'string' ? payload.is_out_of_stock === 'true' : Boolean(payload.is_out_of_stock)
  payload.badge_free_shipping = typeof payload.badge_free_shipping === 'string' ? payload.badge_free_shipping === 'true' : Boolean(payload.badge_free_shipping)
  payload.free_shipping_bkk = typeof payload.free_shipping_bkk === 'string' ? payload.free_shipping_bkk === 'true' : Boolean(payload.free_shipping_bkk)
  payload.requires_foundation = typeof payload.requires_foundation === 'string' ? payload.requires_foundation === 'true' : Boolean(payload.requires_foundation)
  payload.badge_warranty = typeof payload.badge_warranty === 'string' ? payload.badge_warranty === 'true' : Boolean(payload.badge_warranty)
  payload.badge_installation = typeof payload.badge_installation === 'string' ? payload.badge_installation === 'true' : Boolean(payload.badge_installation)
  payload.badge_new = typeof payload.badge_new === 'string' ? payload.badge_new === 'true' : Boolean(payload.badge_new)
  payload.badge_bestseller = typeof payload.badge_bestseller === 'string' ? payload.badge_bestseller === 'true' : Boolean(payload.badge_bestseller)
  payload.badge_recommended = typeof payload.badge_recommended === 'string' ? payload.badge_recommended === 'true' : Boolean(payload.badge_recommended)
  payload.limit_one_per_order = typeof payload.limit_one_per_order === 'string' ? payload.limit_one_per_order === 'true' : Boolean(payload.limit_one_per_order)
  payload.compare_enabled = typeof payload.compare_enabled === 'string' ? payload.compare_enabled === 'true' : payload.compare_enabled !== false
  
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `/api/products/${productId.value}` : '/api/products'
  
  try {
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload)
    })

    // ─── Handle HTTP status-level errors ───
    if (!res.ok) {
      let errorData = {}
      try { errorData = await res.json() } catch { /* non-JSON response */ }
      const serverMsg = errorData.error || ''

      if (res.status === 401 || res.status === 403) {
        showToast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error', 5000)
        router.push('/admin/login')
        return
      }
      if (res.status === 400) {
        showToast('ข้อมูลไม่ถูกต้อง: ' + (serverMsg || 'กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง'), 'error', 5000)
        return
      }
      if (res.status === 404) {
        showToast('ไม่พบสินค้าในระบบ อาจถูกลบไปแล้ว', 'error', 5000)
        return
      }
      if (res.status === 413) {
        showToast('ข้อมูลมีขนาดใหญ่เกินไป กรุณาลดขนาดรูปภาพหรือเนื้อหา', 'error', 5000)
        return
      }
      if (res.status === 429) {
        showToast('คำขอถูกจำกัด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง', 'warning', 5000)
        return
      }
      if (res.status >= 500) {
        showToast('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง หรือติดต่อผู้ดูแลระบบ', 'error', 5000)
        console.error('Server error:', res.status, serverMsg)
        return
      }
      // Generic fallback for other HTTP errors
      showToast('บันทึกไม่สำเร็จ (HTTP ' + res.status + '): ' + (serverMsg || 'Unknown Error'), 'error', 5000)
      return
    }

    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลสินค้าเรียบร้อยแล้ว', 'success')
      if (!isEdit.value && data.id) {
        isEdit.value = true
        productId.value = data.id
        router.replace(`/admin/products/${data.id}/edit`)
      }
    } else {
      console.error('Save product failed:', data.error)
      showToast('บันทึกไม่สำเร็จ: ' + (data.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'), 'error', 5000)
    }
  } catch (error) {
    console.error('Save error:', error)
    // ─── Differentiate network-level errors ───
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต', 'error', 5000)
    } else if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('Timeout')) {
      showToast('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง', 'error', 5000)
    } else {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error', 5000)
    }
  } finally {
    saving.value = false
  }
}

// AI Auto-fill Basic Info from Description
const aiAutoFillBasic = ref(false)

const autoFillBasicFromDescription = async () => {
  // Collect all available text from the form to feed AI
  const parts = []
  if (form.value.name) parts.push('ชื่อสินค้า: ' + form.value.name)
  if (form.value.description) {
    // Strip HTML tags for cleaner input
    const plainDesc = form.value.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (plainDesc) parts.push('รายละเอียด: ' + plainDesc)
  }
  if (form.value.short_description) parts.push('รายละเอียดย่อ: ' + form.value.short_description)
  if (form.value.remarks) parts.push('หมายเหตุ: ' + form.value.remarks)
  if (form.value.llm_context) parts.push('ข้อมูลเพิ่มเติม: ' + form.value.llm_context)
  if (form.value.category) parts.push('หมวดหมู่: ' + form.value.category)
  if (form.value.size) parts.push('ขนาด: ' + form.value.size)
  if (form.value.sku) parts.push('SKU: ' + form.value.sku)

  // Also gather existing attributes
  if (Array.isArray(form.value.attributes)) {
    const attrText = form.value.attributes
      .filter(a => a && a.key && a.value)
      .map(a => `${a.key}: ${a.value}`)
      .join(', ')
    if (attrText) parts.push('สเปก: ' + attrText)
  }

  const rawText = parts.join('\n')
  if (rawText.length < 20) {
    showToast('กรุณากรอกรายละเอียดสินค้าในแท็บ "รายละเอียดสินค้า" หรือ "สเปกสินค้า" ก่อน แล้วค่อยใช้ AI ช่วยกรอกข้อมูลอัตโนมัติ', 'warning')
    return
  }

  aiAutoFillBasic.value = true
  try {
    const res = await apiFetch('/api/ai/extract-product-all', {
      method: 'POST',
      body: JSON.stringify({ rawText, knownCategory: form.value.category })
    })

    const data = await res.json()
    if (data.success && data.data) {
      const extracted = data.data
      let filledCount = 0

      if (extracted.name) { form.value.name = extracted.name; filledCount++ }
      // Auto-fill image alt with product name for SEO
      if (extracted.name && !form.value.image_alt) form.value.image_alt = extracted.name
      if (extracted.sku) { form.value.sku = extracted.sku; filledCount++ }
      if (extracted.price) { form.value.price = extracted.price; filledCount++ }
      if (extracted.original_price) { form.value.original_price = extracted.original_price; filledCount++ }
      if (extracted.slug) { form.value.slug = extracted.slug; filledCount++ }
      if (extracted.category && extracted.category !== form.value.category) {
        const catObj = categories.value.find(c => c.name === extracted.category)
        if (catObj) form.value.category = catObj.name
        else form.value.category = extracted.category
        await loadCategoryTemplates(form.value.category)
        filledCount++
      } else if (!extracted.category && form.value.category) {
        // Just ensure templates are loaded if we already have a category
        if (categoryTemplates.value.length === 0) {
          await loadCategoryTemplates(form.value.category)
        }
      }
      if (extracted.size) { form.value.size = extracted.size; filledCount++ }
      if (extracted.weight_kg !== undefined && extracted.weight_kg !== null) { form.value.weight_kg = extracted.weight_kg; filledCount++ }
      if (extracted.width_cm !== undefined && extracted.width_cm !== null) { form.value.width_cm = extracted.width_cm; filledCount++ }
      if (extracted.length_cm !== undefined && extracted.length_cm !== null) { form.value.length_cm = extracted.length_cm; filledCount++ }
      if (extracted.height_cm !== undefined && extracted.height_cm !== null) { form.value.height_cm = extracted.height_cm; filledCount++ }
      if (extracted.short_description) { form.value.short_description = extracted.short_description; filledCount++ }
      if (extracted.remarks) { form.value.remarks = extracted.remarks; filledCount++ }
      if (extracted.description) { form.value.description = extracted.description; filledCount++ }
      if (extracted.seo_title) { form.value.seo_title = extracted.seo_title; filledCount++ }
      if (extracted.seo_description) { form.value.seo_description = extracted.seo_description; filledCount++ }
      if (extracted.seo_keywords) { form.value.seo_keywords = extracted.seo_keywords; filledCount++ }
      if (extracted.llm_context) { form.value.llm_context = extracted.llm_context; filledCount++ }

      // Badges
      if (extracted.badge_free_shipping === true) { form.value.badge_free_shipping = true; filledCount++ }
      if (extracted.free_shipping_bkk === true) { form.value.free_shipping_bkk = true; filledCount++ }
      if (extracted.requires_foundation === false) { form.value.requires_foundation = false; filledCount++ }
      if (extracted.badge_warranty === true) { form.value.badge_warranty = true; filledCount++ }
      if (extracted.badge_installation === true) { form.value.badge_installation = true; filledCount++ }
      if (extracted.badge_new === true) { form.value.badge_new = true; filledCount++ }
      if (extracted.badge_bestseller === true) { form.value.badge_bestseller = true; filledCount++ }

      // Images
      if (extracted.image_url && typeof extracted.image_url === 'string') {
        form.value.image_url = extracted.image_url
        if (!allImages.value.includes(extracted.image_url)) {
          allImages.value.unshift(extracted.image_url)
        }
        filledCount++
      }
      if (Array.isArray(extracted.images)) {
        extracted.images.forEach(img => {
          if (img && typeof img === 'string' && !allImages.value.includes(img)) {
            allImages.value.push(img)
          }
        })
      }

      // Attributes
      if (Array.isArray(extracted.attributes) && extracted.attributes.length > 0) {
        if (form.value.attributes.length === 1 && !form.value.attributes[0].key) {
          form.value.attributes = extracted.attributes
        } else {
          extracted.attributes.forEach(attr => {
            const attrKey = attr.key ? String(attr.key).trim() : ''
            const existing = form.value.attributes.find(a => 
              a.key === attrKey || 
              a.label === attrKey ||
              (a.label && attrKey && a.label.includes(attrKey)) ||
              (a.key && attrKey && attrKey.includes(a.key))
            )
            if (existing) existing.value = attr.value
            else form.value.attributes.push({ key: attrKey, value: attr.value, isTemplate: false })
          })
        }
        filledCount++
      }

      // FAQ
      if (Array.isArray(extracted.faq) && extracted.faq.length > 0) {
        if (form.value.faq.length === 1 && !form.value.faq[0].question) {
          form.value.faq = extracted.faq
        } else {
          form.value.faq.push(...extracted.faq)
        }
        filledCount++
      }

      showToast(`AI วิเคราะห์และกรอกข้อมูลอัตโนมัติสำเร็จ! (${filledCount} ช่อง)`, 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถวิเคราะห์ข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI Auto-fill error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiAutoFillBasic.value = false
  }
}

// AI Import Feature
const showAiImportModal = ref(false)
const rawAiInput = ref('')
const extractingAiAll = ref(false)

// AI Copywriting State
const showAiGenerateModal = ref(false)
const aiGeneratingDescription = ref(false)
const aiModelParams = ref({
  keywords: '',
  highlights: '',
  tone: 'luxury',
  length: 'standard',
  includeSEO: true
})

const openAiImportModal = () => {
  rawAiInput.value = ''
  showAiImportModal.value = true
}

const extractFromRaw = async () => {
  if (!rawAiInput.value.trim()) {
    showToast('กรุณาวางข้อมูลดิบก่อน', 'warning')
    return
  }
  
  extractingAiAll.value = true
  try {
    const res = await apiFetch('/api/ai/extract-product-all', {
      method: 'POST',
      body: JSON.stringify({ rawText: rawAiInput.value, knownCategory: form.value.category })
    })

    const data = await res.json()
    if (data.success && data.data) {
      const extracted = data.data
      
      // Merge values into form intelligently
      if (extracted.name) form.value.name = extracted.name
      // Auto-fill image alt with product name for SEO
      if (extracted.name) form.value.image_alt = extracted.name
      if (extracted.sku) form.value.sku = extracted.sku
      if (extracted.price) form.value.price = extracted.price
      if (extracted.original_price) form.value.original_price = extracted.original_price
      if (extracted.image_url && typeof extracted.image_url === 'string') {
        form.value.image_url = extracted.image_url;
        if (!allImages.value.includes(extracted.image_url)) {
          allImages.value.unshift(extracted.image_url);
        }
      }
      if (Array.isArray(extracted.images)) {
        extracted.images.forEach(img => {
          if (img && typeof img === 'string' && !allImages.value.includes(img)) {
            allImages.value.push(img);
          }
        });
      }
      if (extracted.category && extracted.category !== form.value.category) {
        // Find if the category exists via name or just set it
        const catObj = categories.value.find(c => c.name === extracted.category)
        if (catObj) form.value.category = catObj.name
        else form.value.category = extracted.category
        
        await loadCategoryTemplates(form.value.category)
      } else if (!extracted.category && form.value.category) {
        if (categoryTemplates.value.length === 0) {
          await loadCategoryTemplates(form.value.category)
        }
      }
      if (extracted.seo_title) form.value.seo_title = extracted.seo_title
      if (extracted.seo_description) form.value.seo_description = extracted.seo_description
      if (extracted.seo_keywords) form.value.seo_keywords = extracted.seo_keywords
      if (extracted.slug) form.value.slug = extracted.slug
      if (extracted.llm_context) form.value.llm_context = extracted.llm_context
      if (extracted.description) form.value.description = extracted.description
      if (extracted.short_description) form.value.short_description = extracted.short_description
      if (extracted.remarks) form.value.remarks = extracted.remarks
      if (extracted.size) form.value.size = extracted.size
      
      if (extracted.weight_kg !== undefined && extracted.weight_kg !== null) form.value.weight_kg = extracted.weight_kg
      if (extracted.width_cm !== undefined && extracted.width_cm !== null) form.value.width_cm = extracted.width_cm
      if (extracted.length_cm !== undefined && extracted.length_cm !== null) form.value.length_cm = extracted.length_cm
      if (extracted.height_cm !== undefined && extracted.height_cm !== null) form.value.height_cm = extracted.height_cm
      
      // Badges
      if (extracted.badge_free_shipping === true) form.value.badge_free_shipping = true
      if (extracted.free_shipping_bkk === true) form.value.free_shipping_bkk = true
      if (extracted.requires_foundation === false) form.value.requires_foundation = false
      if (extracted.requires_foundation === true) form.value.requires_foundation = true
      if (extracted.badge_warranty === true) form.value.badge_warranty = true
      if (extracted.badge_installation === true) form.value.badge_installation = true
      if (extracted.badge_new === true) form.value.badge_new = true
      if (extracted.badge_bestseller === true) form.value.badge_bestseller = true
      
      if (Array.isArray(extracted.attributes) && extracted.attributes.length > 0) {
        // Build template-based attributes first, then map AI values into them
        if (categoryTemplates.value.length > 0) {
          // Start with template structure
          const templateAttrs = categoryTemplates.value.map(t => ({
            key: t.attribute_key,
            label: t.attribute_label,
            value: '',
            isTemplate: true
          }))
          
          // Map AI-extracted values into template slots
          const unmatchedAttrs = []
          extracted.attributes.forEach(attr => {
            const attrKey = attr.key ? String(attr.key).trim() : ''
            const attrKeyLower = attrKey.toLowerCase()
            const matched = templateAttrs.find(t => {
              const tKey = (t.key || '').toLowerCase()
              const tLabel = (t.label || '').toLowerCase()
              return tKey === attrKeyLower || 
                     tLabel === attrKeyLower ||
                     tLabel.includes(attrKeyLower) ||
                     attrKeyLower.includes(tKey) ||
                     tKey.includes(attrKeyLower)
            })
            if (matched) {
              matched.value = attr.value
            } else {
              unmatchedAttrs.push({ key: attrKey, value: attr.value, isTemplate: false })
            }
          })
          
          // Combine: templates (with filled values) + extra unmatched attributes
          form.value.attributes = [...templateAttrs, ...unmatchedAttrs]
        } else {
          // No templates available — just use raw AI attributes
          form.value.attributes = extracted.attributes
        }
      }
      
      if (Array.isArray(extracted.faq) && extracted.faq.length > 0) {
        if (form.value.faq.length === 1 && !form.value.faq[0].question) {
           form.value.faq = extracted.faq
        } else {
           form.value.faq.push(...extracted.faq)
        }
      }

      showToast('AI ดึงข้อมูลทั้งหมดและเติมลงฟอร์มเรียบร้อยแล้ว', 'success')
      showAiImportModal.value = false
    }
  } catch (error) {
    console.error('AI Extraction error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    extractingAiAll.value = false
  }
}

const openAiGenerateModal = () => {
  aiModelParams.value.keywords = form.value.seo_keywords || ''
  
  let highlightsArr = []
  if (form.value.name) highlightsArr.push(`สินค้า: ${form.value.name}`)
  if (form.value.category) highlightsArr.push(`หมวดหมู่: ${form.value.category}`)
  
  if (form.value.attributes && form.value.attributes.length > 0) {
    form.value.attributes.forEach(attr => {
      if (attr.key && attr.value) {
        highlightsArr.push(`- ${attr.key}: ${attr.value}`)
      }
    })
  }
  
  aiModelParams.value.highlights = highlightsArr.join('\n')
  aiModelParams.value.tone = 'luxury'
  aiModelParams.value.length = 'standard'
  aiModelParams.value.includeSEO = true
  
  showAiGenerateModal.value = true
}

const generateDescriptionWithAI = async () => {
  if (!form.value.name) {
    showToast('กรุณากรอกชื่อสินค้าเพื่อความถูกต้องในการเขียนเนื้อหา', 'warning')
    return
  }

  aiGeneratingDescription.value = true
  try {
    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการเขียนคำโฆษณาขาย (Copywriter) และนักจัดทำ SEO (Search Engine Optimization) ระดับมืออาชีพ
หน้าที่ของคุณคือเขียนบทความแนะนำสินค้าภาษาไทยที่มีพลังดึงดูดใจ กระตุ้นอารมณ์อยากซื้อ และถูกจัดโครงสร้างให้เหมาะสมสำหรับการเก็บดัชนีของ Search Engine (Google SEO On-Page)
และส่งคืนผลลัพธ์เป็น JSON object ที่ถูกต้องตามโครงสร้างที่ระบุเท่านั้น โดยไม่มีสัญลักษณ์มาร์กดาวน์ \`\`\`json หรือ \`\`\` ล้อมรอบ และไม่มีคำเกริ่นนำหรือเครื่องหมายคำอธิบายเพิ่มเติมใดๆ ทั้งสิ้น

รูปแบบ JSON ที่ต้องส่งคืน:
{
  "description": "คำอธิบายรายละเอียดแบบเต็มในรูปแบบ HTML (ใช้โครงสร้าง <h2>, <h3>, ย่อหน้า <p>, รายการจุดเด่น <ul><li>, และตารางเปรียบเทียบหรือตารางสเปกสินค้า <table> ที่สวยงามและสะอาด)",
  "seo_title": "หัวข้อ SEO Title ที่มีเสน่ห์ดึงดูดและใส่คีย์เวิร์ด (ความยาวไม่เกิน 60 ตัวอักษร)",
  "seo_description": "คำโปรย Meta Description สำหรับแสดงบนผลลัพธ์การค้นหา Google เพื่อกระตุ้นยอดคลิก (ความยาว 120-160 ตัวอักษร)",
  "seo_keywords": "คีย์เวิร์ด SEO คั่นด้วยเครื่องหมายจุลภาค"
}`

    const promptText = `ช่วยสร้างเนื้อหาแนะนำสินค้าพรีเมียมตามรายละเอียดดังต่อไปนี้:
ชื่อสินค้า: ${form.value.name}
หมวดหมู่สินค้า: ${form.value.category || 'ทั่วไป'}
คีย์เวิร์ด SEO ที่ต้องการเน้น: ${aiModelParams.value.keywords}
จุดเด่น/ข้อมูลจำเพาะสินค้า:
${aiModelParams.value.highlights}

ข้อมูลการเขียนที่ต้องการ:
1. โทนเสียงและสไตล์ภาษา: ${
      aiModelParams.value.tone === 'luxury' ? 'Luxury & Premium (หรูหรา น่าเชื่อถือ ใช้ภาษาสุภาพ เป็นทางการ)' :
      aiModelParams.value.tone === 'friendly' ? 'Friendly & Informative (เป็นมิตร อบอุ่น ชวนอ่านสบายๆ)' :
      'Sales-Driven & Persuasive (เน้นปิดการขาย กระตุ้นอารมณ์ความคุ้มค่า)'
    }
2. ระดับความยาวของเนื้อหา: ${
      aiModelParams.value.length === 'short' ? 'สั้นกระชับ ประมาณ 300 คำ' :
      aiModelParams.value.length === 'comprehensive' ? 'ลงลึกครอบคลุมทุกประเด็น ประมาณ 1000 คำ' :
      'มาตรฐาน เหมาะสมสำหรับ SEO ประมาณ 600 คำ'
    }

ข้อกำหนดเพิ่มเติม:
- ในฟิลด์ "description" ให้แต่งเนื้อหาเป็นรูปแบบ HTML แท้ๆ โดยจัดหน้าให้น่าอ่าน ใช้หัวข้อ <h2> และ <h3> เพื่อแบ่งหัวข้อ รวมถึงใส่ตารางสเปกสินค้า <table> แบบไม่มี Inline Style
- ห้ามใช้คำอธิบายนำหน้า JSON ห้ามส่งมาเป็นเครื่องหมายคำพูดรอบนอก ส่งออกมาเป็น JSON ตรงๆ`

    const res = await apiFetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText,
        systemPrompt: systemPrompt
      })
    })

    const data = await res.json()
    if (data.success && data.data) {
      let rawText = data.data.trim()
      
      if (rawText.startsWith('```json')) {
        rawText = rawText.substring(7)
      } else if (rawText.startsWith('```')) {
        rawText = rawText.substring(3)
      }
      if (rawText.endsWith('```')) {
        rawText = rawText.substring(0, rawText.length - 3)
      }
      rawText = rawText.trim()

      try {
        const parsed = JSON.parse(rawText)
        
        if (parsed.description) {
          form.value.description = parsed.description
        }
        
        if (aiModelParams.value.includeSEO) {
          if (parsed.seo_title) form.value.seo_title = parsed.seo_title.substring(0, 60)
          if (parsed.seo_description) form.value.seo_description = parsed.seo_description.substring(0, 160)
          if (parsed.seo_keywords) form.value.seo_keywords = parsed.seo_keywords
        }
        
        showToast('AI สร้างและอัปเดตรายละเอียดสินค้าเรียบร้อยแล้ว!', 'success')
        showAiGenerateModal.value = false
      } catch (e) {
        console.error('Failed to parse AI JSON:', rawText, e)
        form.value.description = rawText
        showToast('AI สร้างเนื้อหาสำเร็จ แต่ผลลัพธ์ไม่ได้อยู่ในรูปแบบ JSON จึงนำมาใส่ในช่องรายละเอียดแบบเต็มโดยตรง', 'warning')
        showAiGenerateModal.value = false
      }
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างเนื้อหาได้', 'error')
    }
  } catch (error) {
    console.error('AI Copywriting error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingDescription.value = false
  }
}

</script>

<template>
  <div class="bg-gradient-to-br from-slate-50 via-[#F8FAFC] to-blue-50/30 min-h-screen pb-32">
    <!-- Sticky Header & Tab Navigation -->
    <div class="relative z-30 border-b border-white/60" style="background: linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.95) 50%, rgba(240,249,255,0.92) 100%); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);">
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <!-- Top Action Bar -->
        <div class="flex items-center justify-between py-4 sm:py-5">
          <div class="flex items-center gap-4">
            <router-link to="/admin/products" class="p-2.5 bg-white/80 border border-slate-200/80 text-slate-400 rounded-2xl hover:bg-white hover:text-slate-900 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
              <svg class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </router-link>
            <div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">{{ isEdit ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่' }}</span>
                <span v-if="isEdit" class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 rounded-lg border border-amber-200/50">แก้ไข</span>
                <span v-else class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200/50">ใหม่</span>
              </h1>
              <p v-if="form.name" class="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-md mt-0.5 font-medium">{{ form.name }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
             <button type="button" @click="openAiImportModal" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-[13px] font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                เพิ่มจาก AI
             </button>
          </div>
        </div>
        
        <!-- Premium Segmented Tabs -->
        <div class="pb-3 -mx-4 sm:mx-0 overflow-x-auto hide-scrollbar sm:flex sm:justify-start pl-4 sm:pl-0">
          <div class="inline-flex gap-1 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-inner">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 sm:px-5 py-2.5 text-[13px] font-bold flex items-center gap-2 whitespace-nowrap rounded-xl transition-all duration-300 focus:outline-none select-none relative',
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/[0.04]' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              ]"
            >
              <svg class="w-4 h-4 transition-all duration-300 shrink-0" :class="activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="activeTab === tab.id ? 2.5 : 2" :d="tab.icon"></path>
              </svg>
              {{ tab.label }}
              <span v-if="activeTab === tab.id" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-pulse flex flex-col items-center">
        <div class="h-8 w-8 bg-emerald-200 rounded-full mb-4"></div>
        <div class="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- Main Form Content -->
    <form v-else @submit.prevent="saveProduct" class="w-full px-4 sm:px-6 lg:px-8 mt-8">
      
      <!-- TAB: Basic Info -->
      <div v-show="activeTab === 'basic'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div class="mb-10 pb-6 border-b border-slate-100/80">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-100/50">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 
                </div>
                ข้อมูลพื้นฐาน
              </h2>
              <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">ตั้งค่าชื่อสินค้า ราคา หมวดหมู่ และข้อมูลหลักสำหรับการแสดงผล</p>
            </div>
            <button 
              type="button" 
              @click="autoFillBasicFromDescription" 
              :disabled="aiAutoFillBasic"
              class="relative inline-flex items-center gap-2.5 px-5 py-3 text-sm font-bold text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-wait overflow-hidden group whitespace-nowrap shrink-0"
              :class="aiAutoFillBasic 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600' 
                : 'bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 hover:from-violet-600 hover:via-indigo-600 hover:to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40'"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
              <svg v-if="aiAutoFillBasic" class="w-5 h-5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              <span class="relative z-10">{{ aiAutoFillBasic ? 'AI กำลังวิเคราะห์...' : 'AI โอนถ่ายข้อมูล' }}</span>
            </button>
          </div>
          <!-- AI description tip -->
          <div v-if="!form.description && !aiAutoFillBasic" class="mt-4 sm:ml-14 flex items-start gap-2 p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl">
            <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-xs text-amber-700 font-medium leading-relaxed"><strong>เคล็ดลับ:</strong> ไปที่แท็บ "รายละเอียดสินค้า" แล้วกรอกหรือวางข้อมูลสินค้าก่อน จากนั้นกลับมากดปุ่ม AI ที่นี่ ระบบจะวิเคราะห์และกรอกทุกช่องให้อัตโนมัติ</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
          <!-- SKU -->
          <div class="group">
            <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-300 group-focus-within:bg-emerald-500 transition-colors"></span>
                รหัสสินค้า / SKU
                <InfoTooltip title="รหัสสินค้า (SKU) คืออะไร?" description="<strong>SKU (Stock Keeping Unit)</strong> คือรหัสเฉพาะที่ใช้ระบุสินค้าแต่ละตัว เช่น <code>MS-GH004</code><ul><li>ช่วยค้นหาสินค้าได้ง่ายในหลังบ้าน</li><li>ใช้อ้างอิงในเอกสารใบเสนอราคาและใบแจ้งหนี้</li><li>ไม่จำเป็นต้องกรอกหากไม่มีระบบรหัสสินค้า</li></ul>" />
              </span>
              <span class="text-[11px] font-bold text-slate-400 font-mono">{{ form.sku?.length || 0 }}/100</span>
            </label>
            <input v-model="form.sku" type="text" maxlength="100" placeholder="เช่น MS-GH004" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100">
          </div>
          <!-- Product Name -->
          <div class="group">
            <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                ชื่อสินค้า <span class="text-rose-500 ml-0.5">*</span>
              </span>
              <span class="text-[11px] font-bold text-slate-400 font-mono">{{ form.name?.length || 0 }}/1000</span>
            </label>
            <input v-model="form.name" type="text" maxlength="1000" placeholder="เช่น โรงเรือนปลูกต้นไม้ไซส์ L" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100">
          </div>
          <!-- URL Slug -->
          <div class="md:col-span-2">
            <label class="block text-[13px] font-black text-indigo-800 mb-2 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              ลิงก์ย่อหน้าสินค้า (URL Slug)
              <InfoTooltip title="URL Slug คืออะไร?" description="<strong>Slug</strong> คือส่วนท้ายของ URL ที่ใช้แสดงหน้าสินค้า เช่น <code>domain.com/product/โรงเรือน-ปลูกพืช</code><ul><li>ช่วยให้ Google ค้นพบสินค้าง่ายขึ้น (SEO)</li><li>ควรใช้ชื่อที่สื่อความหมาย ไม่มีเว้นวรรค</li><li>กดปุ่ม 'สร้างจากชื่อ' เพื่อสร้างอัตโนมัติ</li><li>ห้ามซ้ำกับสินค้าอื่น มิฉะนั้นจะเกิดข้อผิดพลาด</li></ul>" />
              <span class="text-[11px] font-medium text-slate-400 ml-1">(ภาษาอังกฤษหรือไทย ไม่มีเว้นวรรค)</span>
            </label>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 p-1.5 bg-white rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-500/[0.07] focus-within:border-indigo-500 transition-all shadow-sm shadow-slate-100">
              <span class="text-slate-400 font-mono text-sm hidden sm:inline-block pl-4 select-none shrink-0">domain.com/product/</span>
              <input v-model="form.slug" type="text" maxlength="255" placeholder="premium-greenhouse-l" class="flex-1 w-full border-none bg-transparent px-3 py-2.5 font-mono text-sm text-indigo-700 focus:ring-0 placeholder:text-slate-300 outline-none">
              <button type="button" @click="generateSlug" class="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap m-0.5 active:scale-95 border border-indigo-100">
                สร้างจากชื่อ
              </button>
            </div>
            <p v-if="form.slug" class="text-xs text-slate-400 mt-2 font-mono truncate ml-1 flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg> /product/{{ form.slug }}</p>
          </div>
        </div>

        <!-- Pricing Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 p-6 bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 rounded-2xl border border-emerald-100/60">
          <div class="md:col-span-2 mb-1">
            <h3 class="text-sm font-black text-emerald-800 flex items-center gap-2">
              <div class="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              ราคาสินค้า
              <InfoTooltip title="ระบบราคาสินค้า" description="<strong>ราคาตั้งต้น:</strong> ราคาเดิมก่อนลด จะแสดงเป็นตัวขีดฆ่าสีเทาบนหน้าเว็บ<br/><br/><strong>ราคาขายจริง:</strong> ราคาที่ลูกค้าจ่ายจริง แสดงเป็นตัวเขียวเด่น<br/><br/>หาก 2 ราคาเท่ากัน หน้าเว็บจะแสดงแค่ราคาเดียว ไม่มีขีดฆ่า" />
            </h3>
          </div>
          <div class="group">
            <label class="block text-[13px] font-bold text-slate-600 mb-2">ราคาตั้งต้น <span class="text-[11px] text-slate-400 font-medium ml-1">(ราคาที่ถูกขีดฆ่า)</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span class="text-slate-400 font-bold text-sm">฿</span>
              </div>
              <input v-model.number="form.original_price" type="number" placeholder="15000" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl pl-10 pr-4 py-3.5 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100">
            </div>
          </div>
          <div class="group">
            <label class="block text-[13px] font-bold text-emerald-700 mb-2">ราคาขายจริง <span class="text-rose-500">*</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span class="text-emerald-600 font-black text-sm">฿</span>
              </div>
              <input v-model.number="form.price" type="number" placeholder="12900" class="w-full bg-emerald-50/50 border-2 border-emerald-200 text-emerald-900 text-sm rounded-2xl pl-10 pr-4 py-3.5 hover:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-emerald-300 font-black outline-none shadow-sm">
            </div>
          </div>
          
          <!-- Installation Fee Section -->
          <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-emerald-100/60 mt-2">
            <div class="group">
              <label class="block text-[13px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>มีค่าติดตั้งแยกต่างหาก</span>
              </label>
              <div @click="form.has_installation_fee = !form.has_installation_fee" class="flex items-center gap-4 cursor-pointer p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm group">
                <div :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none shrink-0', form.has_installation_fee ? 'bg-emerald-500 shadow-inner shadow-emerald-600/30' : 'bg-slate-200']">
                  <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300', form.has_installation_fee ? 'translate-x-6' : 'translate-x-1']"/>
                </div>
                <div>
                  <span class="block text-sm font-bold text-slate-800 transition-colors">คิดค่าติดตั้ง</span>
                  <span class="block text-xs text-slate-400 mt-0.5">ระบุค่าติดตั้งตายตัว (แทนที่จะคำนวณตามพื้นที่)</span>
                </div>
              </div>
            </div>

            <div class="group transition-opacity duration-300" :class="!form.has_installation_fee ? 'opacity-40 pointer-events-none' : ''">
              <label class="block text-[13px] font-bold text-slate-700 mb-2">ค่าติดตั้ง <span v-if="form.has_installation_fee" class="text-rose-500">*</span></label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="text-slate-500 font-bold text-sm">฿</span>
                </div>
                <input v-model.number="form.installation_fee" :disabled="!form.has_installation_fee" type="number" min="0" placeholder="เช่น 1500" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl pl-10 pr-4 py-3.5 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100 disabled:bg-slate-50">
              </div>

              <div class="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors" @click="form.free_install_bkk = !form.free_install_bkk">
                <div :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none shrink-0', form.free_install_bkk ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300']">
                  <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300', form.free_install_bkk ? 'translate-x-4' : 'translate-x-0.5']"/>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-700">ติดตั้งฟรี (จังหวัดที่กำหนด)</span>
                  <span class="block text-[10px] text-slate-500">ฟรีค่าติดตั้งสำหรับ {{ settingsStore.freeInstallProvinces.length }} จังหวัด ({{ settingsStore.freeInstallProvinces.join(', ') }}) นอกพื้นที่คิดราคาเหมาปกติ — <router-link to="/admin/settings" class="text-indigo-500 hover:underline">แก้ไขจังหวัดที่ตั้งค่า</router-link></span>
                </div>
              </div>

            </div>

          </div>

          <!-- Shipping Options -->
          <div class="group md:col-span-2 mt-2 pt-4 border-t border-emerald-100/60">
            <label class="block text-[13px] font-bold text-slate-700 mb-4 flex items-center justify-between">
              <span>การจัดส่งสินค้า (Shipping)</span>
            </label>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <!-- Option 1: Standard -->
              <label class="relative flex cursor-pointer rounded-xl border p-3 hover:bg-slate-50 transition-colors"
                     :class="(!form.badge_free_shipping && !form.free_shipping_bkk) ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-slate-200'">
                <input type="radio" name="shipping_type" class="sr-only" 
                       :checked="!form.badge_free_shipping && !form.free_shipping_bkk"
                       @change="form.badge_free_shipping = false; form.free_shipping_bkk = false">
                <div class="flex w-full items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                         :class="(!form.badge_free_shipping && !form.free_shipping_bkk) ? 'border-emerald-500' : 'border-slate-300'">
                      <div v-if="!form.badge_free_shipping && !form.free_shipping_bkk" class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <span class="block text-[13px] font-bold text-slate-800">มีค่าจัดส่ง</span>
                      <span class="block text-[10px] text-slate-500 mt-0.5">คิดตามระยะทางและน้ำหนัก</span>
                    </div>
                  </div>
                </div>
              </label>

              <!-- Option 2: Free BKK -->
              <label class="relative flex cursor-pointer rounded-xl border p-3 hover:bg-slate-50 transition-colors"
                     :class="form.free_shipping_bkk ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-slate-200'">
                <input type="radio" name="shipping_type" class="sr-only" 
                       :checked="form.free_shipping_bkk"
                       @change="form.badge_free_shipping = false; form.free_shipping_bkk = true">
                <div class="flex w-full items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                         :class="form.free_shipping_bkk ? 'border-emerald-500' : 'border-slate-300'">
                      <div v-if="form.free_shipping_bkk" class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <span class="block text-[13px] font-bold text-slate-800">ส่งฟรี กทม./ปริมณฑล</span>
                      <span class="block text-[10px] text-slate-500 mt-0.5">ฟรี 6 จังหวัดรอบกทม.</span>
                    </div>
                  </div>
                </div>
              </label>

              <!-- Option 3: Free Nationwide -->
              <label class="relative flex cursor-pointer rounded-xl border p-3 hover:bg-slate-50 transition-colors"
                     :class="form.badge_free_shipping ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-slate-200'">
                <input type="radio" name="shipping_type" class="sr-only" 
                       :checked="form.badge_free_shipping"
                       @change="form.badge_free_shipping = true; form.free_shipping_bkk = false">
                <div class="flex w-full items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                         :class="form.badge_free_shipping ? 'border-emerald-500' : 'border-slate-300'">
                      <div v-if="form.badge_free_shipping" class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <span class="block text-[13px] font-bold text-slate-800">ฟรีทั่วประเทศ</span>
                      <span class="block text-[10px] text-slate-500 mt-0.5">ฟรีค่าจัดส่งทุกพื้นที่</span>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div class="group md:col-span-2 mt-2 pt-4 border-t border-emerald-100/60">
            <label class="block text-[13px] font-bold text-orange-600 mb-2 flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clip-rule="evenodd"/></svg>
              เวลาสิ้นสุด Flash Sale
              <InfoTooltip title="Flash Sale คืออะไร?" description="ระบบ <strong>Flash Sale</strong> จะแสดงนาฬิกานับถอยหลังบนหน้าสินค้า เช่น 'จบโปรใน 2 วัน 5 ชม.'<ul><li>กำหนดวัน/เวลาที่ต้องการให้โปรโมชันหมดอายุ</li><li>เมื่อครบเวลา นาฬิกาจะหายไปอัตโนมัติ</li><li>ปล่อยว่างไว้หากไม่ต้องการจำกัดเวลา</li></ul>" />
              <span class="text-[11px] font-medium text-orange-500/70 ml-1">(ปล่อยว่างไว้หากไม่จำกัดเวลาลดราคา)</span>
            </label>
            <input v-model="form.sale_end_date" type="datetime-local" class="w-full sm:w-1/2 bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/[0.07] focus:border-orange-500 transition-all font-medium outline-none shadow-sm shadow-slate-100">
          </div>
        </div>

        <!-- Category & Size -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
          <div class="group">
            <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              หมวดหมู่ <span class="text-rose-500 ml-0.5">*</span>
            </label>
            <AdminCategoryMultiDropdown v-model="form.categories" :categories="categories" value-key="name" placeholder="เลือกหมวดหมู่สินค้า" />
          </div>
          <div class="group">
            <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                ขนาด (กxยxส)
              </span>
              <span class="text-[11px] font-bold text-slate-400 font-mono">{{ form.size?.length || 0 }}/100</span>
            </label>
            <input v-model="form.size" type="text" maxlength="100" placeholder="เช่น 2.4 x 3.6 x 2.2 เมตร" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100">
          </div>
        </div>

        <!-- Inventory Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 p-6 bg-slate-50 border border-slate-200/60 rounded-2xl relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r"></div>
          <div class="md:col-span-2 mb-1 pl-3">
            <h3 class="text-sm font-black text-slate-800 flex items-center gap-2">
              <div class="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              การจัดการสต๊อกสินค้า
            </h3>
            <p class="text-xs text-slate-500 mt-2 font-medium">ระบุจำนวนที่สามารถขายได้ ระบบจะปิดการขายอัตโนมัติเมื่อสต๊อกเป็น 0</p>
          </div>
          <div class="group pl-3 md:col-span-2 sm:max-w-md">
            <label class="block text-[13px] font-bold text-slate-700 mb-2">
              จำนวนสินค้าคงเหลือ <span class="text-[11px] text-slate-400 font-medium ml-1">(ปล่อยว่างไว้ถ้ามีของตลอด)</span>
            </label>
            <input v-model.number="form.stock_quantity" type="number" min="0" placeholder="เช่น 100" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-blue-300 focus:ring-4 focus:ring-blue-500/[0.07] focus:border-blue-500 transition-all font-medium outline-none shadow-sm shadow-slate-100">
          </div>
        </div>

        <!-- Shipping Dimensions -->
        <div class="md:col-span-2 mb-10">
          <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r"></div>
            <h3 class="text-sm font-black text-slate-800 mb-5 flex items-center gap-2.5 pl-3">
              <div class="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              ขนาดและน้ำหนักเพื่อการจัดส่ง
              <InfoTooltip title="ทำไมต้องระบุน้ำหนักและขนาด?" description="ข้อมูลน้ำหนักและขนาดนี้ <strong>มีผลโดยตรงต่อค่าจัดส่ง</strong> ที่คำนวณโดยอัตโนมัติ<ul><li>ระบบคำนวณค่าส่งจาก <strong>น้ำหนักรวม</strong> ของสินค้าทั้งหมดในตะกร้า</li><li>สินค้าที่หนักมาก อาจถูกจำกัดให้ซื้อได้ 1 ชิ้น/ออเดอร์</li><li>ต้องกรอกให้ครบ มิฉะนั้นจะบันทึกไม่ได้</li></ul>" />
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pl-3">
              <div>
                <label class="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">น้ำหนัก (กิโลกรัม) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.weight_kg" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07] focus:border-blue-500 transition-all font-medium outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">ความกว้าง (ซม.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.width_cm" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07] focus:border-blue-500 transition-all font-medium outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">ความยาว (ซม.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.length_cm" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07] focus:border-blue-500 transition-all font-medium outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">ความสูง (ซม.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.height_cm" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.07] focus:border-blue-500 transition-all font-medium outline-none">
              </div>
            </div>
          </div>
        </div>

        <!-- Review & Short Description -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
          <div class="group">
            <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-1.5">
              คะแนนรีวิว
              <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            </label>
            <input v-model.number="form.rating" type="number" step="0.1" min="0" max="5" placeholder="เช่น 4.8" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100">
          </div>
          <div class="group">
            <label class="block text-[13px] font-black text-slate-700 mb-2">จำนวนผู้รีวิว</label>
            <input v-model.number="form.review_count" type="number" step="1" min="0" placeholder="เช่น 43" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100">
          </div>
        </div>

        <div class="mb-8">
          <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center justify-between">
            <span>รายละเอียดย่อยสรุป <span class="text-[11px] text-slate-400 font-medium ml-1">(แสดงตอนพรีวิวสินค้า)</span></span>
            <span class="text-[11px] font-bold text-slate-400 font-mono">{{ form.short_description?.length || 0 }}/500</span>
          </label>
          <textarea v-model="form.short_description" rows="3" maxlength="500" placeholder="อธิบายจุดเด่นสั้นๆ 1-2 บรรทัดให้ลูกค้าสนใจ..." class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium resize-none outline-none shadow-sm shadow-slate-100 leading-relaxed"></textarea>
        </div>

        <div class="mb-10">
          <label class="block text-[13px] font-black text-slate-700 mb-2 flex items-center justify-between">
            <span>หมายเหตุพิเศษ</span>
            <span class="text-[11px] font-bold text-slate-400 font-mono">{{ form.remarks?.length || 0 }}/500</span>
          </label>
          <textarea v-model="form.remarks" rows="2" maxlength="500" placeholder="* ไม่รวมค่าจัดส่ง, สีอาจเพี้ยนจากหน้าจอเล็กน้อย..." class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3.5 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/[0.07] focus:border-emerald-500 transition-all placeholder:text-slate-300 font-medium resize-none outline-none shadow-sm shadow-slate-100 leading-relaxed"></textarea>
        </div>

        <!-- Toggle Controls -->
        <div class="space-y-3 max-w-2xl mb-10">
          <div @click="form.requires_foundation = !form.requires_foundation" class="flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
            <div :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shrink-0', form.requires_foundation ? 'bg-blue-500 shadow-inner shadow-blue-600/30' : 'bg-slate-200']">
              <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300', form.requires_foundation ? 'translate-x-6' : 'translate-x-1']"/>
            </div>
            <div>
              <span class="block text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">ต้องปูพื้นซีเมนต์หรือแผ่นพื้นสำเร็จ</span>
              <span class="block text-xs text-slate-400 mt-0.5">ระบบจะคำนวณค่าแผ่นพื้นให้ หากติดตั้งบนดิน/หญ้า ถ้าปิดไว้จะถือว่าไม่ต้องปูพื้น</span>
            </div>
          </div>
          <div @click="form.limit_one_per_order = !form.limit_one_per_order" class="flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
            <div :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-500/20 shrink-0', form.limit_one_per_order ? 'bg-rose-500 shadow-inner shadow-rose-600/30' : 'bg-slate-200']">
              <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300', form.limit_one_per_order ? 'translate-x-6' : 'translate-x-1']"/>
            </div>
            <div>
              <span class="block text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">จำกัด 1 ชิ้นต่อคำสั่งซื้อ</span>
              <span class="block text-xs text-slate-400 mt-0.5">ระบบจะบังคับให้ลูกค้าซื้อได้แค่ชิ้นเดียว เหมาะกับสินค้าขนาดใหญ่</span>
            </div>
          </div>

          <div @click="form.compare_enabled = !form.compare_enabled" class="flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
            <div :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shrink-0', form.compare_enabled ? 'bg-indigo-500 shadow-inner shadow-indigo-600/30' : 'bg-slate-200']">
              <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300', form.compare_enabled ? 'translate-x-6' : 'translate-x-1']"/>
            </div>
            <div>
              <span class="block text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">อนุญาตให้นำไปเปรียบเทียบ</span>
              <span class="block text-xs text-slate-400 mt-0.5">เปิดให้ลูกค้าสามารถเลือกสินค้านี้เพื่อเปรียบเทียบสเปกแบบ side-by-side ได้</span>
            </div>
          </div>

          <div @click="form.is_active = !form.is_active" class="flex items-center gap-4 cursor-pointer p-4 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md" :class="form.is_active ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-200/80 hover:border-slate-300'">
            <div :class="['relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner shrink-0', form.is_active ? 'bg-emerald-500 shadow-emerald-600/30' : 'bg-slate-300']">
              <span :class="['inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300', form.is_active ? 'translate-x-6' : 'translate-x-1']"></span>
            </div>
            <div>
              <span class="block text-base font-bold transition-colors duration-300" :class="form.is_active ? 'text-emerald-800' : 'text-slate-500'">สถานะการจำหน่าย (เปิดให้เห็นบนหน้าเว็บ)</span>
              <span class="block text-xs text-slate-400 mt-1">ปิดเมื่อต้องการซ่อนสินค้าไม่ให้ใครเห็นเลย (Draft)</span>
            </div>
          </div>

          <div @click="form.is_out_of_stock = !form.is_out_of_stock" class="flex items-center gap-4 cursor-pointer p-4 rounded-2xl border transition-all duration-300 relative shadow-sm hover:shadow-md" :class="form.is_out_of_stock ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300' : 'bg-white border-slate-200/80 hover:border-slate-300'">
            <div v-if="form.is_out_of_stock" class="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r rounded-l-2xl"></div>
            <div :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shrink-0', form.is_out_of_stock ? 'bg-amber-500 shadow-inner shadow-amber-600/30 ring-4 ring-amber-500/10' : 'bg-slate-200']">
              <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300', form.is_out_of_stock ? 'translate-x-6' : 'translate-x-1']"></span>
            </div>
            <div>
              <span class="block text-sm font-bold transition-colors duration-300" :class="form.is_out_of_stock ? 'text-amber-800' : 'text-slate-600'">ติดป้าย "สินค้าหมดชั่วคราว" <InfoTooltip title="สินค้าหมดชั่วคราว" description="เมื่อเปิดฟีเจอร์นี้:<ul><li>ปุ่ม <strong>เพิ่มลงตะกร้า</strong> จะถูกปิด ลูกค้าสั่งซื้อไม่ได้</li><li>หน้าสินค้ายังแสดงอยู่บนเว็บ เพื่อ <strong>ไม่เสียอันดับ SEO</strong></li><li>แสดงป้าย <strong>สินค้าหมด</strong> สีส้มบนรูปสินค้า</li><li>เมื่อสินค้ากลับมา แค่ปิดสวิตช์นี้ ทุกอย่างกลับปกติ</li></ul>" /></span>
              <span class="block text-xs mt-0.5 transition-colors duration-300" :class="form.is_out_of_stock ? 'text-amber-600/80' : 'text-slate-400'">ลูกค้าจะไม่สามารถกดสั่งซื้อได้ แต่หน้าเว็บยังแสดงผลเพื่อประโยชน์ทาง SEO</span>
            </div>
          </div>
        </div>

        <!-- Product Feature Badges (Dynamic) -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-400 to-purple-500 rounded-r"></div>
          <div class="flex items-center justify-between mb-5 pl-3">
            <h3 class="text-base font-black text-slate-800 flex items-center gap-2.5">
              <div class="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"></path></svg>
              </div>
              ป้ายสินค้าและจุดขาย (Badges)
            </h3>
            <button type="button" @click="openCreateBadge" class="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 rounded-xl transition-all border border-violet-200 shadow-sm hover:shadow active:scale-95">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มป้ายใหม่
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-3">
            <div v-for="badge in allBadges" :key="badge.id" class="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all group/badge">
              <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0" @click.prevent="toggleBadge(badge.id)">
                <div :class="['relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', form.badges.includes(badge.id) ? `bg-${badge.color}-500` : 'bg-slate-200']">
                  <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform', form.badges.includes(badge.id) ? 'translate-x-4' : 'translate-x-0.5']"></span>
                </div>
                <div class="flex items-center gap-2 min-w-0">
                  <svg :class="`w-4 h-4 shrink-0 text-${badge.color}-500`" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getBadgeIconPath(badge.icon)"></path></svg>
                  <span class="text-sm font-semibold text-slate-700 truncate">{{ badge.name }}</span>
                  <svg v-if="badge.is_system" class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="ป้ายเริ่มต้น"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
              </label>
              <div v-if="!badge.is_system" class="flex items-center gap-1 shrink-0 opacity-0 group-hover/badge:opacity-100 transition-opacity">
                <button type="button" @click="openEditBadge(badge)" class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors rounded-lg" title="แก้ไข">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button type="button" @click="deleteBadge(badge)" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors rounded-lg" title="ลบ">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- TAB: Details & Specs -->
      <div v-show="activeTab === 'details'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-100/50">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> 
              </div>
              รายละเอียดแบบเต็ม
            </h2>
            <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">อธิบายรายละเอียดสินค้าอย่างครบถ้วนเพื่อผลดีต่อ SEO และการตัดสินใจซื้อ</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button 
              type="button" 
              @click="openAiGenerateModal" 
              class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 group border border-transparent"
            >
              <svg class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-white/90" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span>เขียนเนื้อหาใหม่ด้วย AI</span>
            </button>
            <button 
              type="button" 
              @click="formatDescriptionSEO" 
              :disabled="aiFormatting || !form.description"
              class="inline-flex items-center px-4 py-2 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold text-sm rounded-lg transition-all disabled:opacity-50 border border-indigo-200/60 shadow-sm active:scale-95 group"
            >
              <span v-if="aiFormatting" class="mr-2">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <svg v-else class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-indigo-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              <span>AI จัดรูปแบบเนื้อหา & SEO</span>
            </button>
          </div>
        </div>
        
        <div class="mb-4 ckeditor-container border border-gray-200/80 rounded-[1.2rem] overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all pb-1">
          <Ckeditor
            :editor="editor"
            v-model="form.description"
            :config="editorConfig"
          />
        </div>
      </div>

      <!-- TAB: Attributes (Specs) -->
      <div v-show="activeTab === 'attributes'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-100/50">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              </div>
              ตารางสเปกสินค้า (Attributes)
            </h2>
            <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">ข้อมูลจำเพาะที่ช่วยในการจัดหมวดหมู่และระบบเปรียบเทียบสินค้า</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button 
              type="button" 
              @click="generateAttributes" 
              :disabled="aiGeneratingAttributes || !form.name"
              class="inline-flex items-center justify-center text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border border-transparent active:scale-95 group"
            >
              <span v-if="aiGeneratingAttributes" class="mr-1.5">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <svg v-else class="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI ดึงข้อมูลมาเติมสเปก
            </button>
            <button type="button" @click="addAttribute" class="inline-flex items-center justify-center text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-all border border-slate-200 shadow-sm active:scale-95">
              <svg class="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มสเปก (Custom)
            </button>
          </div>
        </div>

        <div class="space-y-3.5 relative z-10">
          <div v-for="(attr, index) in form.attributes" :key="'attr-'+index" class="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 sm:p-2 sm:pl-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-all hover:border-emerald-300 group">
            <!-- Template Attributes -->
            <template v-if="attr.isTemplate">
              <div class="w-full sm:w-1/3 py-1 text-sm font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                {{ attr.label }}
                <span v-if="attr.required" class="text-rose-500">*</span>
              </div>
              <!-- Input Based on Type -->
              <template v-if="attr.type === 'select'">
                <select v-model="attr.value" class="flex-1 w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium outline-none">
                  <option value="">-- ไม่ระบุ --</option>
                  <option v-for="opt in attr.options" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>
              <template v-else-if="attr.type === 'number'">
                <input v-model="attr.value" type="number" step="any" placeholder="ระบุตัวเลข (เช่น 2.5)" class="flex-1 w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium outline-none placeholder:text-slate-400">
              </template>
              <template v-else>
                <input v-model="attr.value" type="text" placeholder="ระบุรายละเอียด (เว้นว่างได้)" class="flex-1 w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 hover:bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium outline-none placeholder:text-slate-400">
              </template>
              <div class="w-[42px] shrink-0 hidden sm:block"></div> <!-- Placeholder for alignment with delete button -->
            </template>
            
            <!-- Custom Attributes -->
            <template v-else>
              <div class="w-full sm:w-1/3 shrink-0 flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-slate-200 ml-1"></div>
                <input v-model="attr.key" type="text" placeholder="หัวข้อสเปก (เช่น วัสดุโครง)" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium outline-none placeholder:text-slate-400">
              </div>
              <input v-model="attr.value" type="text" placeholder="รายละเอียด (เช่น เหล็กกัลวาไนซ์)" class="flex-1 w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium outline-none placeholder:text-slate-400">
              <button type="button" @click="removeAttribute(index)" class="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 bg-white border border-slate-200 rounded-xl transition-colors shrink-0 outline-none flex items-center justify-center focus:ring-2 focus:ring-rose-500/20 w-fit self-end sm:self-auto shadow-sm active:scale-95">
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </template>
          </div>
          
          <div v-if="!form.attributes || form.attributes.length === 0" class="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-300">
            <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <p class="text-sm font-bold text-slate-500">กรุณาเลือกหมวดหมู่หน้าแรกสุด เพื่อโหลดตารางสเปกแนะนำ</p>
          </div>
        </div>
      </div>

      <!-- TAB: Media (Images) -->
      <div v-show="activeTab === 'media'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-100/50">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> 
              </div>
              รูปภาพและสื่อ
            </h2>
            <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">จัดการรูปภาพสินค้า (รูปลำดับแรกจะถูกใช้เป็นภาพปกหลัก)</p>
          </div>
        </div>
        
        <div class="mb-10 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl p-6 border border-amber-200/80 shadow-sm relative overflow-hidden">
          <div class="absolute right-0 top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <label class="block text-sm font-black text-amber-900 mb-2 relative z-10 flex items-center gap-2">
            คำอธิบายภาพปกสำหรับ SEO (Image Alt Text)
          </label>
          <input v-model="form.image_alt" type="text" placeholder="เช่น รูปโรงเรือนอเนกประสงค์ขนาด L สีเขียว" class="w-full border border-amber-200/80 rounded-xl px-4 py-3 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm bg-white font-medium relative z-10 shadow-sm placeholder:text-amber-700/40 outline-none">
          <p class="text-xs text-amber-900/60 mt-2 font-medium relative z-10">* ช่วยให้ค้นหารูปภาพเจอใน Google Images และช่วยบอก AI ว่าภาพนี้คืออะไร</p>
        </div>

        <!-- Unified Gallery & Uploader Grid -->
        <div class="mt-8 bg-[#F8FAFC] rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <label class="block text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            แกลเลอรีรูปภาพสินค้า (อัปโหลดและลากเพื่อสลับตำแหน่ง)
          </label>
          
          <draggable 
            v-model="allImages" 
            class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" 
            item-key="index"
            :animation="300"
            ghost-class="opacity-50"
            drag-class="scale-105"
          >
            <!-- Upload Button (First spot) -->
            <template #header>
              <div 
                class="relative group rounded-2xl border-2 border-dashed transition-all duration-300 aspect-square flex flex-col items-center justify-center p-4 text-center cursor-pointer bg-white border-slate-300 hover:bg-emerald-50/50 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1"
                @dragover.prevent
                @drop.prevent="handleImagesDrop"
              >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  @change="handleImagesUpload" 
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  :disabled="uploadingImages"
                >
                <template v-if="uploadingImages">
                  <svg class="animate-spin h-8 w-8 text-emerald-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 py-1 px-3 rounded-full">กำลังอัปโหลด</span>
                </template>
                <template v-else>
                  <div class="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300 shadow-sm">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  <div class="text-emerald-700 font-black text-xs uppercase tracking-wider group-hover:text-emerald-800 transition-colors">เพิ่มรูปภาพ</div>
                  <div class="text-[10px] text-slate-400 font-medium mt-1 group-hover:text-emerald-600/70">ลากวางที่นี่</div>
                </template>
              </div>
            </template>

            <!-- Draggable Images -->
            <template #item="{ element, index }">
              <div class="relative group rounded-2xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all duration-300 bg-white aspect-square shadow-sm hover:shadow-lg hover:-translate-y-1" :class="index === 0 ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'">
                
                <img :src="element" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                
                <!-- Cover Badge -->
                <div v-if="index === 0" class="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm z-10 pointer-events-none border border-emerald-400/50 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                  ภาพปก
                </div>
                <!-- Number Badge -->
                <div v-else class="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm z-10 pointer-events-none border border-white/20">
                  {{ index + 1 }}
                </div>

                <!-- Overlay Background -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>

                <!-- Delete Action -->
                <button type="button" @click.stop="removeImage(index)" class="absolute top-2 right-2 bg-white/90 hover:bg-rose-500 text-slate-700 hover:text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 shadow-sm hover:shadow-md transform hover:scale-110 backdrop-blur-sm border border-slate-200 hover:border-rose-500">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <!-- TAB: Sales & Related -->
      <div v-show="activeTab === 'sales'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div>
          <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-100/50">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg> 
                </div>
                สินค้าเกี่ยวเนื่องและอะไหล่ (Related Products)
              </h2>
              <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">เพิ่มโอกาสในการขายด้วยการจับคู่สินค้าหรืออะไหล่แนะนำที่เกี่ยวข้องกัน</p>
            </div>
          </div>
          
          <div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <label class="text-sm font-black text-slate-800 flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                เลือกสินค้าที่เกี่ยวข้อง / อะไหล่แนะนำ
              </label>
              
              <!-- Filter Select -->
              <div class="w-full sm:w-72">
                <AdminCategoryDropdown v-model="relatedFilterCategory" :categories="[{id: 'all', name: 'ดูทุกหมวดหมู่ (All)'}, ...categories]" value-key="name" placeholder="กรองตามหมวดหมู่" />
              </div>
            </div>

            <div class="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 shadow-inner">
              <div v-if="filteredRelatedProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                <label v-for="prod in filteredRelatedProducts" :key="prod.id" 
                  class="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer border-2 transition-all shadow-sm group relative overflow-hidden"
                  :class="isRelatedSelected(prod.id) ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-indigo-500/20' : 'border-transparent hover:border-indigo-200 hover:shadow-md'">
                  
                  <div class="absolute inset-0 bg-indigo-50/50 opacity-0 transition-opacity" :class="{'opacity-100': isRelatedSelected(prod.id)}"></div>
                  
                  <div class="relative flex items-center gap-3 w-full z-10">
                    <div class="flex items-center justify-center shrink-0">
                      <div class="w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm" :class="isRelatedSelected(prod.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-indigo-400'">
                        <svg v-if="isRelatedSelected(prod.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <input type="checkbox" :value="prod.id" v-model="form.related_products" class="hidden">
                    </div>
                    
                    <div class="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 shadow-sm relative group-hover:shadow">
                      <img v-if="prod.image_url" :src="prod.image_url" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      <div v-else class="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                      <div class="text-[13px] font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors" :title="prod.name">{{ prod.name }}</div>
                      <div class="text-[10px] font-medium mt-0.5 text-slate-400 truncate">{{ prod.category || 'ไม่มีหมวดหมู่' }}</div>
                    </div>
                  </div>
                </label>
              </div>
              <div v-else class="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                <div class="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <p class="text-sm font-bold text-slate-500">{{ relatedFilterCategory !== 'all' ? 'ไม่พบสินค้าในหมวดหมู่นี้' : 'ยังไม่มีสินค้าอื่นๆ ในระบบ' }}</p>
                <p class="text-[11px] text-slate-400 mt-1 font-medium">{{ relatedFilterCategory !== 'all' ? 'ลองเปลี่ยนตัวกรองเพื่อดูสินค้าในหมวดหมู่อื่น' : 'เพิ่มสินค้าชิ้นอื่นก่อนถึงจะจับคู่ได้' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: FAQ -->
      <div v-show="activeTab === 'faq'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
              <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-100/50">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              คำถามที่พบบ่อย (FAQ)
            </h2>
            <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">ตั้งกลุ่มคำถาม-ตอบเพื่อช่วยลูกค้าตัดสินใจซื้อได้เร็วขึ้น และลดภาระแอดมิน</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button type="button" @click.prevent="generateFaq" :disabled="aiGeneratingFaq || !form.name" class="flex flex-row items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-sm rounded-xl transition-all disabled:opacity-50 border border-indigo-200/60 shadow-sm active:scale-95 group whitespace-nowrap">
              <svg v-if="aiGeneratingFaq" class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span>{{ aiGeneratingFaq ? 'กำลังประมวลผล...' : 'ให้ AI ช่วยคิด FAQ' }}</span>
            </button>
            <button type="button" @click.prevent="addFaq" class="flex flex-row items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap">
              <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
              <span>เพิ่มด้วยตัวเอง</span>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!form.faq || form.faq.length === 0" class="bg-slate-50/50 rounded-2xl p-10 text-center border-2 border-dashed border-slate-200">
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-indigo-300">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p class="text-base font-black text-slate-600 mb-1">ยังไม่มีคำถามที่พบบ่อย</p>
          <p class="text-sm font-medium text-slate-400">เพิ่มคำถามที่ลูกค้ามักจะถามบ่อยๆ เพิ่มเติมด้วยตัวเอง หรือใช้ AI ช่วยคิดจากรายละเอียดสินค้า</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-5">
          <div v-for="(item, idx) in form.faq" :key="'faq-item-'+idx" class="relative group bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-300 transition-all hover:shadow-md">
            <div class="absolute -top-3.5 left-6 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-indigo-100 shadow-sm">คำถามที่ {{ idx + 1 }}</div>
            
            <button type="button" @click.prevent="removeFaq(idx)" class="absolute top-4 right-4 p-2.5 text-white bg-rose-400 hover:bg-rose-500 rounded-xl transition-all shadow-sm hover:shadow-md border border-rose-400/50 hover:scale-105 z-10" title="ลบคำถามนี้">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            
            <div class="space-y-5 mt-2 pr-10">
              <div class="relative">
                <div class="absolute left-0 top-1/2 -translate-y-1/2 text-indigo-300 font-serif font-black text-xl italic opacity-50">Q</div>
                <input v-model="item.question" placeholder="คำถามที่เป็นประโยชน์กับลูกค้า (เช่น รับประกันกี่ปี?)" class="w-full pl-6 border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 py-2 text-base font-black text-slate-800 focus:outline-none transition-colors bg-transparent placeholder:text-slate-300">
              </div>
              <div class="relative">
                <div class="absolute left-0 top-3 text-emerald-300 font-serif font-black text-xl italic opacity-50">A</div>
                <textarea v-model="item.answer" placeholder="คำตอบที่กระชับและให้ข้อมูลครบถ้วน..." rows="2" class="w-full pl-6 border-none rounded-xl px-0 py-2.5 text-sm font-medium text-slate-600 focus:ring-0 focus:outline-none transition-colors resize-none placeholder:text-slate-400 bg-transparent custom-scrollbar leading-relaxed"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: Card UI -->
      <div v-show="activeTab === 'card_ui'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5 space-y-10">
        <div>
          <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <div class="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-xl shadow-[0_2px_10px_rgba(192,38,211,0.2)] border border-fuchsia-100/50">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> 
                </div>
                ปรับแต่งการแสดงผลการ์ดสินค้า (หน้าแรก)
              </h2>
              <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">ข้อมูลป้ายกำกับและจุดเด่นที่จะแสดงอยู่บนรูปสินค้าในหมวดหมู่หน้าแรก</p>
            </div>
            <!-- Master Toggle -->
            <label class="relative inline-flex items-center cursor-pointer gap-3 select-none">
              <input type="checkbox" v-model="form.card_features.enabled" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-fuchsia-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
              <span class="text-sm font-bold" :class="form.card_features.enabled ? 'text-fuchsia-600' : 'text-slate-400'">{{ form.card_features.enabled ? 'เปิดแสดงผลทั้งหมด' : 'ปิดแสดงผลทั้งหมด' }}</span>
            </label>
          </div>

          <div v-if="!form.card_features.enabled" class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
            <p class="text-sm font-bold text-slate-400">การแสดงผลการ์ดสินค้าถูกปิดอยู่</p>
            <p class="text-xs text-slate-400 mt-1">เปิดสวิตช์ด้านบนเพื่อแสดงฟีเจอร์บนการ์ดสินค้า</p>
          </div>

          <template v-if="form.card_features.enabled">
          <!-- Left Stack -->
          <div class="mb-10">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="form.card_features.show_stack" class="sr-only peer">
                  <div class="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-fuchsia-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500"></div>
                </label>
                <label class="text-sm font-black" :class="form.card_features.show_stack ? 'text-slate-800' : 'text-slate-400'">ฟีเจอร์ด้านข้าง (Left Stack) สูงสุด 3 รายการ</label>
              </div>
              <button @click.prevent="addCardFeatureStack" :disabled="form.card_features?.stack?.length >= 3 || !form.card_features.show_stack" class="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-600 text-xs font-bold rounded-lg hover:bg-fuchsia-100 transition-colors disabled:opacity-50">+ เพิ่มฟีเจอร์</button>
            </div>
            <div class="space-y-3" :class="{ 'opacity-50 pointer-events-none': !form.card_features.show_stack }">
              <div v-for="(feat, idx) in form.card_features?.stack" :key="'stack'+idx" class="flex gap-3 items-start bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div class="w-2/5">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ไอคอน</label>
                  <IconSelect v-model="feat.icon" :options="cardIconOptions" />
                </div>
                <div class="flex-1">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ข้อความ</label>
                  <input v-model="feat.text" type="text" placeholder="เช่น กันแดด" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-fuchsia-500">
                </div>
                <button @click.prevent="removeCardFeatureStack(idx)" class="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-5">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div v-if="!form.card_features?.stack?.length" class="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีข้อมูลฟีเจอร์ด้านข้าง</div>
            </div>
          </div>

          <!-- Right Badge -->
          <div class="mb-10 pt-6 border-t border-slate-100">
            <div class="flex items-center gap-3 mb-4">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.card_features.show_badge" class="sr-only peer">
                <div class="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-fuchsia-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500"></div>
              </label>
              <label class="text-sm font-black" :class="form.card_features.show_badge ? 'text-slate-800' : 'text-slate-400'">ป้ายไฮไลท์ขวาล่าง (Right Badge)</label>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" :class="{ 'opacity-50 pointer-events-none': !form.card_features.show_badge }">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-2">ไอคอน</label>
                <IconSelect v-model="form.card_features.badge.icon" :options="[{ value: '', label: 'ไม่มีไอคอน' }, ...cardIconOptions]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-2">ข้อความบรรทัด 1</label>
                <input v-model="form.card_features.badge.text1" type="text" placeholder="เช่น แข็งแรง" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-fuchsia-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-2">ข้อความบรรทัด 2</label>
                <input v-model="form.card_features.badge.text2" type="text" placeholder="เช่น ไม่เป็นสนิม" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-fuchsia-500">
              </div>
            </div>
          </div>

          <!-- Bottom Bar -->
          <div class="pt-6 border-t border-slate-100">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="form.card_features.show_bottom_bar" class="sr-only peer">
                  <div class="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-fuchsia-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500"></div>
                </label>
                <label class="text-sm font-black" :class="form.card_features.show_bottom_bar ? 'text-slate-800' : 'text-slate-400'">แถบคุณสมบัติด้านล่าง (Bottom Bar) สูงสุด 3 คอลัมน์</label>
              </div>
              <button @click.prevent="addCardFeatureBottom" :disabled="form.card_features?.bottom_bar?.length >= 3 || !form.card_features.show_bottom_bar" class="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-600 text-xs font-bold rounded-lg hover:bg-fuchsia-100 transition-colors disabled:opacity-50">+ เพิ่มคุณสมบัติ</button>
            </div>
            <div class="space-y-3" :class="{ 'opacity-50 pointer-events-none': !form.card_features.show_bottom_bar }">
              <div v-for="(bar, idx) in form.card_features?.bottom_bar" :key="'bottom'+idx" class="flex gap-3 items-start bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div class="w-1/3">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ไอคอน</label>
                  <IconSelect v-model="bar.icon" :options="cardIconOptions" />
                </div>
                <div class="flex-1 space-y-2">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">หัวข้อ</label>
                    <input v-model="bar.title" type="text" placeholder="เช่น HDPE" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-fuchsia-500">
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">คำบรรยาย</label>
                    <input v-model="bar.subtitle" type="text" placeholder="เช่น เกรดพรีเมียม" class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-fuchsia-500">
                  </div>
                </div>
                <button @click.prevent="removeCardFeatureBottom(idx)" class="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-5">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div v-if="!form.card_features?.bottom_bar?.length" class="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีข้อมูลแถบคุณสมบัติ</div>
            </div>
          </div>

          </template>

        </div>
      </div>

      <!-- TAB: Marketplaces -->
      <div v-show="activeTab === 'marketplaces'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div class="mb-10 pb-6 border-b border-slate-100/80">
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
            <div class="p-2.5 bg-orange-50 text-orange-600 rounded-xl shadow-[0_2px_10px_rgba(249,115,22,0.2)] border border-orange-100/50">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            ลิงก์ร้านค้าภายนอก (Marketplaces)
          </h2>
          <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">ใส่ลิงก์สินค้าจากแพลตฟอร์มมาร์เก็ตเพลสภายนอก เช่น Shopee, Lazada, และ TikTok Shop เพื่อให้ลูกค้าเลือกสั่งซื้อตามช่องทางที่สะดวก</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-gradient-to-br from-orange-50/50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
            <div class="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -mr-5 -mt-5 pointer-events-none group-hover:bg-orange-500/10 transition-colors"></div>
            <label class="block text-sm font-black text-[#EE4D2D] mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M16.32,15.772c-0.27,0.73-1.077,1.066-1.846,1.066  c-0.627,0-1.229-0.218-1.691-0.623l-1.041-0.906l-1.037,0.908c-0.457,0.401-1.06,0.621-1.69,0.621  c-0.78,0-1.58-0.344-1.848-1.068l-0.896-2.428l2.482-1.39l0.981,2.656c0.048,0.129,0.165,0.207,0.297,0.207  c0.125,0,0.231-0.081,0.297-0.197L11.516,13h0.963l0.893,1.616c0.065,0.117,0.174,0.198,0.298,0.198  c0.133,0,0.252-0.077,0.301-0.205l0.985-2.671l2.48,1.394L16.32,15.772z M12.569,8.711V8.222c0-1.082,0.881-1.963,1.963-1.963  c1.08,0,1.961,0.881,1.961,1.963v0.489h0.982V10.74h-6.872V8.711H12.569z M13.551,8.711h1.961V8.222  c0-0.54-0.44-0.981-0.98-0.981c-0.542,0-0.981,0.441-0.981,0.981V8.711z"/></svg>
              ลิงก์ร้านค้า Shopee
              <span class="ml-auto text-xs font-bold text-orange-900/40 font-mono">{{ form.shopee_link?.length || 0 }}/1000</span>
            </label>
            <input v-model="form.shopee_link" type="url" maxlength="1000" placeholder="https://shopee.co.th/..." class="w-full border border-orange-200/80 rounded-xl px-4 py-3 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-medium text-sm bg-white outline-none relative z-10 placeholder:text-orange-900/30">
          </div>
          <div class="bg-gradient-to-br from-blue-50/50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
            <div class="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-5 -mt-5 pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
            <label class="block text-sm font-black text-[#0F136D] mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M16.425,13.67c0,1.523-1.631,2.378-2.914,2.378  c-1.373,0-2.887-0.87-2.887-2.433c0-0.076,0.004-0.155,0.013-0.233h-1.229c0,0.011,0.001,0.021,0.001,0.033  c0,2.155,1.93,3.435,3.951,3.435c2.31,0,4.194-1.423,4.194-3.551c0-2.919-4.103-2.919-4.103-4.22c0-0.457,0.487-0.783,1.155-0.783  c0.812,0,1.298,0.463,1.401,1.139h1.306V9.418h-1.312C15.897,8.601,14.795,8.19,13.438,8.19c-1.635,0-2.584,0.91-2.584,1.88  C10.854,12.338,16.425,12.019,16.425,13.67z M8.07,16.7h1.41V8.344H8.07V16.7z"/></svg> 
              ลิงก์ร้านค้า Lazada
              <span class="ml-auto text-xs font-bold text-blue-900/40 font-mono">{{ form.lazada_link?.length || 0 }}/1000</span>
            </label>
            <input v-model="form.lazada_link" type="url" maxlength="1000" placeholder="https://www.lazada.co.th/..." class="w-full border border-blue-200/80 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-700 transition-all font-medium text-sm bg-white outline-none relative z-10 placeholder:text-blue-900/30">
          </div>
          <div class="bg-gradient-to-br from-slate-50/50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
            <div class="absolute right-0 top-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -mr-5 -mt-5 pointer-events-none group-hover:bg-slate-500/10 transition-colors"></div>
            <label class="block text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.34 2.88 2.88 0 012.31-4.53 2.66 2.66 0 011.61.53v-3.46a6.18 6.18 0 00-1.61-.22 6.33 6.33 0 106.33 6.33V8.16a8.4 8.4 0 004.78 1.49V6.21a4.91 4.91 0 01-1-0.52z"/></svg>
              ลิงก์ร้านค้า Tiktok
              <span class="ml-auto text-xs font-bold text-slate-400 font-mono">{{ form.tiktok_link?.length || 0 }}/1000</span>
            </label>
            <input v-model="form.tiktok_link" type="url" maxlength="1000" placeholder="https://www.tiktok.com/..." class="w-full border border-slate-200/80 rounded-xl px-4 py-3 focus:ring-4 focus:ring-slate-500/10 focus:border-slate-700 transition-all font-medium text-sm bg-white outline-none relative z-10 placeholder:text-slate-400">
          </div>
        </div>
      </div>

      <!-- TAB: SEO & Advanced -->
      <div v-show="activeTab === 'seo'" class="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 p-7 sm:p-10 animate-[fadeIn_0.3s_ease-out] ring-1 ring-slate-900/5">
        <div>
          <div class="mb-10 pb-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-[0_2px_10px_rgba(59,130,246,0.2)] border border-blue-100/50">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> 
                </div>
                ตั้งค่าเนื้อหาพิเศษและ SEO
              </h2>
              <p class="text-[13px] text-slate-500 mt-2 sm:ml-14 font-bold">ตั้งค่าระบบการค้นหาบน Google (Search Engine Optimization) และ LLM Context</p>
            </div>
          </div>

          <!-- SEO Config -->
          <div class="border border-indigo-100/80 rounded-[1.5rem] overflow-hidden bg-white shadow-[0_4px_15px_rgb(0,0,0,0.02)] mb-8">
            <div class="bg-indigo-50/50 px-6 py-5 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="p-2.5 bg-white text-indigo-600 rounded-xl shadow-[0_2px_8px_rgba(79,70,229,0.15)] ring-1 ring-indigo-100">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 class="font-black text-indigo-950 text-base">การตั้งค่าให้บอตหาเจอ (Google Search / AI Chats)</h3>
                  <p class="text-xs text-indigo-600/70 font-medium mt-0.5">ส่วนสำคัญสำหรับการทำ SEO เพื่อเพิ่มจำนวนคนเข้าเว็บแบบ Organic</p>
                </div>
              </div>
              <button @click.prevent="generateSEO" :disabled="aiGenerating" class="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 group active:scale-95 shrink-0 border border-transparent">
                <svg v-if="aiGenerating" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>{{ aiGenerating ? 'กำลังวิเคราะห์...' : 'AI คิด SEO' }}</span>
              </button>
            </div>
            
            <div class="p-6 sm:p-8 space-y-8 bg-gradient-to-br from-[#F8FAFC]/50 to-white">
              <!-- LLM Context -->
              <div>
                <label class="block text-sm font-black text-slate-800 mb-3 flex items-center justify-between">
                  <span>LLM Context (ข้อความอ้างอิงให้ AI Bot ตัวอื่นเอาไปอ้างอิง)</span>
                  <span class="text-xs font-bold text-indigo-400 font-mono">{{ form.llm_context?.length || 0 }}/5000</span>
                </label>
                <textarea v-model="form.llm_context" placeholder="ระบุโปรโมชันพิเศษสั้นๆ เผื่อให้เบราว์เซอร์หรือแชทบอทสรุปข้อมูลสินค้าให้ลูกค้า..." rows="3" class="w-full border border-slate-200 bg-white hover:border-indigo-300 rounded-xl px-5 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium custom-scrollbar leading-relaxed placeholder:text-slate-400"></textarea>
                <p class="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  ข้อมูลนี้แสดงเป็น JSON-LD โครงสร้าง Metadata ให้ AI อย่าง <a href="#" class="text-indigo-500 font-bold hover:underline mx-1">ChatGPT / Perplexity / Google Search</a> โดนดึงไปตอบลูกค้าแบบอัตโนมัติ
                </p>
              </div>

              <div class="pt-8 border-t border-slate-100/80">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-sm font-black text-slate-800">SEO Title (หัวเรื่องการค้นหา)</label>
                      <span class="text-[10px] font-bold" :class="(form.seo_title?.length || 0) > 60 ? 'text-rose-500' : 'text-slate-400'">{{ form.seo_title?.length || 0 }} / 60</span>
                    </div>
                    <input v-model="form.seo_title" placeholder="ใส่หัวข้อที่ดึงดูด น่าคลิก" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 outline-none" :class="{'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500': (form.seo_title?.length || 0) > 60}">
                    <p v-if="(form.seo_title?.length || 0) > 60" class="text-xs text-rose-500 mt-1.5 font-bold animate-pulse">ยาวเกินไป อาจถูก Google ตัดคำได้</p>
                  </div>

                  <div>
                    <label class="block text-sm font-black text-slate-800 mb-2">SEO Keywords</label>
                    <input v-model="form.seo_keywords" placeholder="เช่น บ้านเก็บของ, สวนหน้าบ้าน (คั่นด้วยคอมม่า)" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 outline-none placeholder:text-slate-300">
                  </div>
                </div>

                <div class="mb-6">
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-black text-slate-800">SEO Description (คำบรรยายสรุปเนื้อหาเวลาค้นหาเจอ)</label>
                    <span class="text-[10px] font-bold" :class="(form.seo_description?.length || 0) > 160 ? 'text-rose-500' : 'text-slate-400'">{{ form.seo_description?.length || 0 }} / 160</span>
                  </div>
                  <textarea v-model="form.seo_description" placeholder="สรุปเนื้อหาสั้นๆ กระชับ เป็นประโยคให้น่าติดตาม มีคีย์เวิร์ดสำคัญ..." rows="2" class="w-full border border-slate-200 rounded-xl px-5 py-4 text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 resize-none outline-none custom-scrollbar" :class="{'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500': (form.seo_description?.length || 0) > 160}"></textarea>
                  <p v-if="(form.seo_description?.length || 0) > 160" class="text-xs text-rose-500 mt-1.5 font-bold animate-pulse">คำบรรยายยาวเกินกว่ามาตรฐาน 160 ตัวอักษร</p>
                </div>

                <!-- Google Search Preview snippet -->
                <div v-if="form.seo_title || form.seo_description" class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div class="absolute inset-0 bg-blue-50/10 pointer-events-none group-hover:bg-blue-50/30 transition-colors"></div>
                  <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.000 0.000 A 12.000 12.000 0 1 0 24.000 12.000 A 12.000 12.000 0 0 0 12.000 0.000 Z M 12.000 22.105 A 10.105 10.105 0 1 1 22.105 12.000 A 10.105 10.105 0 0 1 12.000 22.105 Z M 16.591 8.875 L 12.000 13.466 L 7.409 8.875 L 6.000 10.284 L 12.000 16.284 L 18.000 10.284 Z" opacity="0.5"/><path d="M12.000 3.000 A 9.000 9.000 0 1 0 21.000 12.000 A 9.000 9.000 0 0 0 12.000 3.000 Z" fill="#4285F4"/></svg>
                    ตัวอย่างผลลัพธ์บน Google
                  </div>
                  <div class="text-[#006621] text-xs font-bold truncate mb-1.5 opacity-90 flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px]"><svg class="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg></span>
                    yoursite.com > product > {{ form.slug || 'slug' }}
                  </div>
                  <div class="text-[#1a0dab] text-lg font-bold hover:underline cursor-pointer truncate mb-1">
                    {{ form.seo_title || form.name || 'ชื่อสินค้าที่จะแสดงบน Google Search' }}
                  </div>
                  <div class="text-[#4d5156] text-[13px] line-clamp-2 leading-relaxed">
                    {{ form.seo_description || form.short_description || 'คำบรรยายการค้นหาที่จะช่วยให้ผู้คนสนใจและคลิกเข้ามายังหน้าสินค้านี้ ควรใช้ภาษากระชับและมีคีย์เวิร์ดที่สำคัญ' }}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Stack Floating -->
      <div class="sticky bottom-4 bg-white/80 backdrop-blur-xl py-4 px-6 flex items-center xl:w-[60%] justify-between sm:justify-end gap-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06),0_10px_20px_rgba(0,0,0,0.04)] mt-12 rounded-[2rem] mx-auto border border-slate-200/80 transition-all group hover:border-emerald-200">
        <div class="hidden sm:block mr-auto">
          <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 py-1.5 px-3 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">มีข้อมูลที่ยังไม่ได้บันทึก</p>
        </div>
        <router-link to="/admin/products" class="w-full sm:w-auto text-center px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all focus:ring-4 focus:ring-slate-100 outline-none active:scale-95 text-sm">
          ยกเลิก
        </router-link>
        <button type="submit" :disabled="saving" class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-4 focus:ring-emerald-500/20 active:scale-95 outline-none text-sm group/btn border border-emerald-400">
          <svg v-if="saving" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <svg v-else class="h-5 w-5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
          <span>{{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}</span>
        </button>
      </div>

    </form>
  </div>
  <!-- Badge Management Modal -->
  <Teleport to="body">
    <div v-if="showBadgeModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showBadgeModal = false"></div>
      <div class="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-8 animate-[fadeIn_0.2s_ease-out] border border-white/50 ring-1 ring-slate-900/5">
        <button @click="showBadgeModal = false" class="absolute top-5 right-5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors outline-none focus:ring-2 focus:ring-rose-200">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-emerald-500/10 pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
            <svg class="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"></path></svg>
          </div>
          {{ editingBadgeId ? 'แก้ไขป้ายกำกับสินค้า' : 'พิ่มป้ายกำกับสินค้าใหม่' }}
        </h3>

        <div class="space-y-7">
          <div>
            <label class="block text-sm font-black text-slate-800 mb-2.5">ชื่อป้ายกำกับ</label>
            <input v-model="badgeForm.name" type="text" maxlength="100" placeholder="เช่น สินค้าลดพิเศษ" class="w-full border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm placeholder:text-slate-300">
          </div>

          <div>
            <label class="block text-sm font-black text-slate-800 mb-2.5">เลือกไอคอนสัญลักษณ์</label>
            <div class="grid grid-cols-6 gap-2">
              <button v-for="ic in badgeIconOptions" :key="ic" type="button" @click="badgeForm.icon = ic"
                :class="['p-3 rounded-2xl border-2 transition-all flex items-center justify-center outline-none', badgeForm.icon === ic ? `border-${badgeForm.color}-500 bg-${badgeForm.color}-50 shadow-sm scale-110 relative z-10` : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white']">
                <svg :class="`w-5 h-5 transition-colors ${badgeForm.icon === ic ? 'text-'+badgeForm.color+'-600' : 'text-slate-400'}`" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getBadgeIconPath(ic)"></path></svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-black text-slate-800 mb-2.5">เลือกสี</label>
            <div class="flex flex-wrap gap-2.5">
              <button v-for="c in badgeColorOptions" :key="c" type="button" @click="badgeForm.color = c"
                :class="['w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shrink-0 outline-none shadow-sm hover:shadow-md hover:-translate-y-0.5', `bg-${c}-500`, badgeForm.color === c ? 'border-white scale-110 ring-4 ring-'+c+'-200 shadow-md relative z-10' : 'border-white/50 ring-1 ring-slate-200']">
                <svg v-if="badgeForm.color === c" class="w-5 h-5 text-white shrink-0 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-inner">
            <p class="text-[10px] text-slate-400 mb-3 font-black uppercase tracking-widest flex items-center gap-2">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/></svg>
              ตัวอย่างการแสดงผล
            </p>
            <div class="flex justify-center py-2">
              <div :class="`inline-flex items-center gap-2 text-[13px] font-black tracking-wider px-4 py-2 rounded-xl border-2 text-${badgeForm.color}-600 bg-${badgeForm.color}-50 border-${badgeForm.color}-200 shadow-sm transition-all`">
                <svg :class="`w-4 h-4`" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="getBadgeIconPath(badgeForm.icon)"></path></svg>
                {{ badgeForm.name || 'ชื่อป้ายกำกับ' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
          <button type="button" @click="showBadgeModal = false" class="px-5 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-slate-200">ยกเลิก</button>
          <button type="button" @click="saveBadge" :disabled="badgeSaving" class="px-6 py-3 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:scale-95 flex items-center gap-2 outline-none border border-emerald-400 group focus:ring-4 focus:ring-emerald-500/20">
            <svg v-if="badgeSaving" class="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4.5 h-4.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            {{ badgeSaving ? 'กำลังบันทึก...' : (editingBadgeId ? 'บันทึกการแก้ไข' : 'เพิ่มป้ายกำกับ') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- AI Import Modal -->
  <Teleport to="body">
    <div v-if="showAiImportModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style="background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);">
      <div 
        class="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col"
        style="max-height: calc(100vh - 40px);"
      >
        <div class="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-white rounded-xl shadow-sm text-indigo-600 border border-indigo-100/50">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-800 tracking-wide">นำเข้าข้อมูลด้วย AI</h3>
              <p class="text-xs text-slate-500 font-medium">วางเนื้อหาดิบ แล้วปล่อยให้ AI กรอกข้อมูลในฟอร์ม</p>
            </div>
          </div>
          <button type="button" @click="showAiImportModal = false" class="p-2 hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 rounded-xl transition-colors shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto bg-slate-50/30 flex-1">
          <div class="space-y-4">
             <label class="block text-[13px] font-black text-slate-700">วางข้อมูลดิบที่นี่ <span class="text-red-500">*</span></label>
             <textarea 
               v-model="rawAiInput" 
               rows="10" 
               class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl p-4 hover:border-slate-300 focus:ring-4 focus:ring-indigo-500/[0.07] focus:border-indigo-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100"
               placeholder="วางข้อความ รายละเอียด สเปกสินค้า ที่ก็อปปี้มาหน้าเว็บอื่นได้เลย..."
             ></textarea>
          </div>
        </div>

        <div class="px-6 py-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button type="button" @click="showAiImportModal = false" class="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-slate-200">ยกเลิก</button>
          <button type="button" @click="extractFromRaw" :disabled="extractingAiAll || !rawAiInput.trim()" class="px-5 py-2.5 text-sm font-black text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:scale-95 flex items-center gap-2 outline-none whitespace-nowrap">
            <svg v-if="extractingAiAll" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            {{ extractingAiAll ? 'กำลังให้ AI จัดการให้...' : 'เริ่มสกัดข้อมูลอัตโนมัติ' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- AI Content Generator Modal -->
  <Teleport to="body">
    <div v-if="showAiGenerateModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style="background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px);">
      <div 
        class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-800 flex flex-col transition-all duration-300"
        style="max-height: calc(100vh - 40px);"
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-md text-white">
              <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456" />
              </svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-wide">เขียนเนื้อหาใหม่แบบมืออาชีพด้วย AI</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">สร้างสรรค์คำบรรยายตามโครงสร้าง SEO On-Page และกรอก Meta Tags อัตโนมัติ</p>
            </div>
          </div>
          <button type="button" @click="showAiGenerateModal = false" class="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors shrink-0 outline-none">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 flex-1 space-y-6 custom-scrollbar">
          <!-- Product Context (Read-only badge info) -->
          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm shrink-0">
            <div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">สินค้าเป้าหมาย</span>
              <span class="text-sm font-black text-slate-800 dark:text-white">{{ form.name || 'ยังไม่มีชื่อสินค้า' }}</span>
            </div>
            <span class="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black border border-emerald-100/50 dark:border-emerald-900/50 whitespace-nowrap">
              {{ form.category || 'หมวดหมู่ทั่วไป' }}
            </span>
          </div>

          <!-- SEO Keywords -->
          <div class="space-y-2">
            <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>คีย์เวิร์ด SEO ที่ต้องการเน้น (Target Keywords)</span>
              <span class="text-xs font-medium text-slate-400">คั่นระหว่างคำด้วยเครื่องหมายจุลภาค (,)</span>
            </label>
            <input 
              v-model="aiModelParams.keywords" 
              type="text"
              class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all font-medium outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="เช่น บ้านเก็บของ, โรงเก็บของกันฝน, ตู้เก็บของพลาสติก"
            >
          </div>

          <!-- Product Highlights -->
          <div class="space-y-2">
            <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300">
              จุดขาย ข้อมูลสินค้า หรือสเปกเด่น (Product Highlights) <span class="text-red-500">*</span>
            </label>
            <textarea 
              v-model="aiModelParams.highlights" 
              rows="6"
              class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium outline-none resize-none custom-scrollbar"
              placeholder="ระบุจุดเด่นสั้นๆ ทีละบรรทัด เช่น:
- ทนต่อทุกสภาพอากาศ ทนแดด ทนฝน 100%
- ผลิตจากพลาสติก HDPE หนาเป็นพิเศษ แข็งแรงทนทาน
- มีระบบล็อกความปลอดภัยแน่นหนา"
            ></textarea>
          </div>

          <!-- Tone & Length Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300">โทนเสียงภาษา (Tone of Voice)</label>
              <select 
                v-model="aiModelParams.tone"
                class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all font-medium outline-none"
              >
                <option value="luxury">Luxury & Premium (หรูหรา น่าเชื่อถือ)</option>
                <option value="friendly">Friendly & Informative (เป็นมิตร สุภาพ ให้ข้อมูล)</option>
                <option value="persuasive">Sales-Driven & Persuasive (เน้นความคุ้มค่า/ปิดการขาย)</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300">ระดับความยาวเนื้อหา (Length)</label>
              <select 
                v-model="aiModelParams.length"
                class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all font-medium outline-none"
              >
                <option value="short">สั้นและกระชับ (~300 คำ)</option>
                <option value="standard">มาตรฐานสากล (~600 คำ - แนะนำสำหรับ SEO)</option>
                <option value="comprehensive">วิเคราะห์เชิงลึกอย่างสมบูรณ์ (~1000 คำ)</option>
              </select>
            </div>
          </div>

          <!-- Checkbox Include SEO Meta Tags -->
          <div class="pt-2">
            <label class="flex items-center gap-3 cursor-pointer group select-none">
              <div class="relative">
                <input 
                  type="checkbox" 
                  v-model="aiModelParams.includeSEO" 
                  class="sr-only peer"
                >
                <div class="w-10 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-500 peer-checked:to-indigo-500"></div>
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">กรอกข้อมูล SEO Meta Tags ค้นหาบน Google ไปพร้อมกัน</span>
                <span class="text-xs text-slate-400 font-bold">เขียน SEO Title และ Meta Description เพื่อกรอกลงในแท็บ SEO & SERP อัตโนมัติ</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button 
            type="button" 
            @click="showAiGenerateModal = false" 
            class="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95 outline-none"
          >
            ยกเลิก
          </button>
          
          <button 
            type="button" 
            @click="generateDescriptionWithAI" 
            :disabled="aiGeneratingDescription || !aiModelParams.highlights.trim()" 
            class="px-5 py-2.5 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:scale-95 flex items-center gap-2 outline-none whitespace-nowrap"
          >
            <span v-if="aiGeneratingDescription" class="mr-1">
              <svg class="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <svg v-else class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span>{{ aiGeneratingDescription ? 'AI กำลังวิเคราะห์และเรียบเรียง...' : 'เริ่มเขียนเนื้อหาด้วย AI' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Adjust CKEditor to fit current UI vibe */
.ckeditor-container :deep(.ck-editor__editable_inline) {
  min-height: 250px;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
}
.ckeditor-container :deep(.ck-toolbar) {
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  background-color: #f9fafb;
}

/* Draggable classes */
.image-ghost {
  opacity: 0.3;
  transform: scale(0.95);
}
.image-drag {
  opacity: 1 !important;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  transform: scale(1.05);
  z-index: 50;
}
</style>
