<script setup>
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed, BlockQuote } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()

// CKEditor Setup
const editor = ClassicEditor
const editorConfig = ref({
    licenseKey: 'GPL',
    plugins: [
        Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo,
        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed, BlockQuote
    ],
    toolbar: [
        'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|',
        'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', 'bulletedList', 'numberedList'
    ],
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
    image: {
        toolbar: ['imageTextAlternative', 'toggleImageCaption', '|', 'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|', 'resizeImage']
    },
    simpleUpload: {
        uploadUrl: `${import.meta.env.VITE_API_URL || ''}/api/upload/ckeditor`,
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }
})

// State Management
const articles = ref([])
const loading = ref(true)
const showEditor = ref(false)
const saving = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const totalPages = ref(1)
const totalArticles = ref(0)
let searchTimer = null

const allImages = ref([])
const uploadingImages = ref(false)
const deletingId = ref(null)
const siteDomain = computed(() => typeof window !== 'undefined' ? window.location.origin : '')

// AI Generation State
const productsList = ref([])
const aiProductId = ref('')
const aiStyle = ref('educational')
const aiPrompt = ref('')
const generating = ref(false)
const generatingPrompt = ref(false)
const generatingAll = ref(false)
const generatingFaq = ref(false)

const showProductDropdown = ref(false)
const showFormProductDropdown = ref(false)

const aiStyles = [
    { id: 'educational', name: 'ให้ความรู้เชิงลึก', desc: 'ข้อมูลเป็นกลาง อธิบายละเอียด', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', svg: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
    { id: 'sales', name: 'แนะนำจุดเด่น & CTA', desc: 'เน้นคุณสมบัติ และกระตุ้นการซื้อ', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', svg: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>' },
    { id: 'howto', name: 'คู่มือ & How-to', desc: 'ขั้นตอน Checklist อ่านง่าย', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', svg: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>' },
    { id: 'comparison', name: 'วิเคราะห์เปรียบเทียบ', desc: 'ใส่ตาราง Pros/Cons ช่วยตัดสินใจ', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', svg: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>' },
    { id: 'review', name: 'รีวิวกรณีศึกษา', desc: 'เล่าจากการใช้งานจริง น่าเชื่อถือ', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200', svg: '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>' }
]

const categories = ['ทั่วไป', 'เทคโนโลยีตัดปอกสายไฟ', 'คู่มือและเทคนิค', 'การบำรุงรักษา', 'ข่าวสารอุตสาหกรรม', 'โปรโมชั่น']

const form = ref({
    title: '', excerpt: '', content: '', cover_image: '',
    category: 'ทั่วไป', tags: '', seo_title: '', seo_description: '', seo_keywords: '',
    is_published: false, published_at: '', is_featured: false, author: 'Admin',
    product_id: null, gallery_images: [], faq: [], llm_context: '', image_prompt: ''
})

const filteredArticles = computed(() => articles.value || [])

// Statistics Overview
const stats = computed(() => {
    const list = articles.value || []
    const now = new Date()
    let published = 0
    let scheduled = 0
    let draft = 0
    
    list.forEach(item => {
        const pubDate = item.published_at ? new Date(item.published_at) : null
        if (pubDate && pubDate > now) {
            scheduled++
        } else if (item.is_published) {
            published++
        } else {
            draft++
        }
    })
    
    return {
        total: totalArticles.value || list.length,
        published,
        scheduled,
        draft
    }
})

const getArticleStatus = (article) => {
    if (!article) return { key: 'draft', label: 'ฉบับร่าง', subtext: '', bg: 'bg-gray-100 text-gray-600 border-gray-200' }
    const now = new Date()
    const pubDate = article.published_at ? new Date(article.published_at) : null
    if (pubDate && pubDate > now) {
        return {
            key: 'scheduled',
            label: '⏰ ตั้งเวลาเผยแพร่',
            subtext: new Date(article.published_at).toLocaleString('th-TH', { month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
            bg: 'bg-amber-50 text-amber-700 border-amber-200'
        }
    } else if (article.is_published) {
        return {
            key: 'published',
            label: 'เผยแพร่แล้ว',
            subtext: '',
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
    } else {
        return {
            key: 'draft',
            label: 'ฉบับร่าง',
            subtext: '',
            bg: 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }
}

const applySchedulePreset = (daysOffset, hour = 9) => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysOffset)
    const pad = (n) => String(n).padStart(2, '0')
    const dateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(hour)}:00`
    form.value.published_at = dateStr
    form.value.is_published = true
    showToast(`ตั้งเวลาเผยแพร่วันที่ ${targetDate.toLocaleDateString('th-TH')} เวลา ${pad(hour)}:00 น.`, 'info')
}

const onPublishedNowChange = () => {
    if (form.value.is_published) {
        form.value.published_at = ''
    }
}

const onScheduledAtChange = () => {
    if (form.value.published_at) {
        form.value.is_published = true
    }
}

const loadArticles = async () => {
    loading.value = true
    try {
        const params = new URLSearchParams({ page: currentPage.value, limit: 20 })
        if (searchQuery.value) params.append('search', searchQuery.value)
        if (filterStatus.value !== 'all') params.append('status', filterStatus.value)
        
        const res = await apiFetch(`/api/articles?${params}`)
        const data = await res.json()
        if (data.success) {
            articles.value = data.data
            if (data.pagination) {
                totalPages.value = data.pagination.totalPages
                totalArticles.value = data.pagination.total
            }
        }
    } catch (e) { console.error(e) } finally { loading.value = false }
}

const loadProducts = async () => {
    try {
        const res = await apiFetch('/api/products')
        const data = await res.json()
        if (data.success) productsList.value = (data.data || []).filter(p => p.is_active)
    } catch (e) { /* */ }
}

const changePage = (p) => {
    currentPage.value = p
    loadArticles()
}

const onSearchInput = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        currentPage.value = 1
        loadArticles()
    }, 350)
}

const clearSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
    loadArticles()
}

const onFilterChange = () => {
    currentPage.value = 1
    loadArticles()
}

const paginationRange = computed(() => {
    const range = []
    const total = totalPages.value
    const current = currentPage.value
    const delta = 2
    let left = Math.max(2, current - delta)
    let right = Math.min(total - 1, current + delta)
    
    range.push(1)
    if (left > 2) range.push('...')
    for (let i = left; i <= right; i++) range.push(i)
    if (right < total - 1) range.push('...')
    if (total > 1) range.push(total)
    return range
})

const openNew = () => {
    editingId.value = null
    form.value = { title: '', excerpt: '', content: '', cover_image: '', category: 'ทั่วไป', tags: '', seo_title: '', seo_description: '', seo_keywords: '', is_published: false, published_at: '', is_featured: false, author: 'Admin', product_id: null, gallery_images: [], faq: [], llm_context: '', image_prompt: '' }
    allImages.value = []
    showEditor.value = true
}

const openEdit = (article) => {
    editingId.value = article.id
    let publishedAtFormatted = ''
    if (article.published_at) {
        try {
            const d = new Date(article.published_at)
            const pad = (n) => String(n).padStart(2, '0')
            publishedAtFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        } catch (e) {}
    }
    form.value = { 
        ...article, 
        published_at: publishedAtFormatted,
        image_prompt: article.image_prompt || '',
        tags: typeof article.tags === 'string' ? article.tags : JSON.stringify(article.tags || []),
        gallery_images: typeof article.gallery_images === 'string' ? JSON.parse(article.gallery_images || '[]') : (article.gallery_images || []),
        faq: typeof article.faq === 'string' ? JSON.parse(article.faq || '[]') : (article.faq || [])
    }
    
    const arr = []
    if (form.value.cover_image) arr.push(form.value.cover_image)
    if (Array.isArray(form.value.gallery_images)) arr.push(...form.value.gallery_images)
    allImages.value = arr.filter(Boolean)
    
    showEditor.value = true
}

const save = async () => {
    if (!form.value.title) { showToast('กรุณาใส่หัวข้อบทความ', 'warning'); return }
    
    if (allImages.value.length > 0) {
        form.value.cover_image = allImages.value[0]
        form.value.gallery_images = allImages.value.slice(1)
    } else {
        form.value.cover_image = ''
        form.value.gallery_images = []
    }
    
    saving.value = true
    try {
        const url = editingId.value ? `/api/articles/${editingId.value}` : '/api/articles'
        const method = editingId.value ? 'PUT' : 'POST'
        const res = await apiFetch(url, { method, body: JSON.stringify(form.value) })
        const data = await res.json()
        if (data.success) {
            showToast(editingId.value ? 'อัปเดตบทความเรียบร้อย' : 'สร้างบทความเรียบร้อย', 'success')
            if (!editingId.value && data.id) {
                editingId.value = data.id
            }
            loadArticles()
        } else { showToast(data.error || 'เกิดข้อผิดพลาด', 'error') }
    } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') } finally { saving.value = false }
}

const deleteArticle = async (article) => {
    if (deletingId.value) return
    const confirmed = await showConfirm(`ลบบทความ "${article.title}" ?`, 'ยืนยันการลบ')
    if (!confirmed) return
    
    deletingId.value = article.id
    try {
        const res = await apiFetch(`/api/articles/${article.id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) { showToast('ลบบทความเรียบร้อย', 'success'); loadArticles() }
    } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') } finally {
        deletingId.value = null
    }
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
      callback(data.imageUrl || data.url)
    } else {
      showToast('อัพโหลดไม่สำเร็จ: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
  }
}

const handleImagesUpload = async (event) => {
    const files = Array.from(event.target.files || event.dataTransfer?.files || [])
    if (files.length === 0) return

    uploadingImages.value = true
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        await uploadFile(file, (url) => { allImages.value.push(url) })
    }
    uploadingImages.value = false
    if (event.target.value) event.target.value = ''
}

const handleImagesDrop = (e) => { handleImagesUpload(e) }

const removeImage = (index) => {
    allImages.value.splice(index, 1)
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

const generateArticle = async () => {
    if (!aiStyle.value) { showToast('กรุณาเลือกสไตล์บทความ', 'warning'); return }
    generating.value = true
    try {
        const res = await apiFetch('/api/articles/generate', {
            method: 'POST',
            body: JSON.stringify({ productId: aiProductId.value || null, style: aiStyle.value, additionalPrompt: aiPrompt.value })
        })
        const data = await res.json()
        if (data.success && data.data) {
            form.value.title = data.data.title || form.value.title
            form.value.excerpt = data.data.excerpt || form.value.excerpt
            form.value.content = data.data.content || form.value.content
            form.value.seo_title = data.data.seo_title || form.value.seo_title
            form.value.seo_description = data.data.seo_description || form.value.seo_description
            form.value.seo_keywords = data.data.seo_keywords || form.value.seo_keywords
            form.value.tags = data.data.tags || form.value.tags
            form.value.llm_context = data.data.llm_context || form.value.llm_context
            if (data.data.image_prompt) {
                form.value.image_prompt = data.data.image_prompt
            }
            if (Array.isArray(data.data.faq) && data.data.faq.length > 0) {
                if (form.value.faq.length === 0) {
                    form.value.faq = data.data.faq
                } else {
                    form.value.faq = [...form.value.faq, ...data.data.faq]
                }
            }
            if (data.data.category) form.value.category = data.data.category
            if (aiProductId.value) form.value.product_id = aiProductId.value
            showToast('สร้างบทความและข้อมูล AI ทั้งหมดเรียบร้อยแล้ว!', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้างบทความ ลองใหม่', 'error')
        }
    } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') } finally { generating.value = false }
}

const copyPrompt = () => {
    navigator.clipboard.writeText(form.value.image_prompt)
    showToast('คัดลอก Prompt แล้ว', 'success')
}

const generateImagePrompt = async () => {
    if (!form.value.title && !form.value.content) {
        showToast('กรุณากรอกหัวข้อเนื้อหา หรือรายละเอียดก่อนสร้าง Prompt ด้วย AI', 'warning')
        return
    }
    generatingPrompt.value = true
    try {
        const res = await apiFetch('/api/articles/generate-prompt', {
            method: 'POST',
            body: JSON.stringify({ 
                title: form.value.title,
                prompt: form.value.excerpt || form.value.content || aiPrompt.value
            })
        })
        const data = await res.json()
        
        if (data.success && data.prompt) {
            form.value.image_prompt = data.prompt
            showToast('สร้าง Prompt สำหรับวาดรูปปกด้วย AI สำเร็จ!', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้าง Prompt ได้ ลองใหม่อีกครั้ง', 'error')
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI', 'error')
        console.error(e)
    } finally {
        generatingPrompt.value = false
    }
}

const currentAiProduct = computed(() => {
    return productsList.value.find(p => p.id === aiProductId.value) || null
})

const currentFormProduct = computed(() => {
    return productsList.value.find(p => p.id === form.value.product_id) || null
})

const generateAllAiData = async () => {
    if (!form.value.title && !form.value.content) {
        showToast('กรุณากรอกหัวข้อหรือเนื้อหาบทความก่อนวิเคราะห์ SEO', 'warning')
        return
    }
    generatingAll.value = true
    try {
        const res = await apiFetch('/api/articles/generate-all-seo', {
            method: 'POST',
            body: JSON.stringify({ 
                title: form.value.title,
                excerpt: form.value.excerpt,
                content: form.value.content,
                tags: form.value.tags
            })
        })
        const data = await res.json()
        if (data.success && data.data) {
            form.value.seo_title = data.data.seo_title || form.value.seo_title
            form.value.seo_description = data.data.seo_description || form.value.seo_description
            form.value.seo_keywords = data.data.seo_keywords || form.value.seo_keywords
            form.value.llm_context = data.data.llm_context || form.value.llm_context
            
            if (Array.isArray(data.data.faq) && data.data.faq.length > 0) {
                form.value.faq = data.data.faq
            }
            showToast('วิเคราะห์และสร้าง SEO + AI Data เรียบร้อย', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้างข้อมูลได้ ลองใหม่อีกครั้ง', 'error')
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
        console.error(e)
    } finally {
        generatingAll.value = false
    }
}

const generateFaq = async () => {
    if (!form.value.title && !form.value.content) {
        showToast('กรุณากรอกหัวข้อหรือรายละเอียดก่อนสร้าง FAQ ด้วย AI', 'warning')
        return
    }
    generatingFaq.value = true
    try {
        const res = await apiFetch('/api/ai/generate-faq', {
            method: 'POST',
            body: JSON.stringify({ 
                name: form.value.title,
                description: form.value.content,
                type: 'article'
            })
        })
        const data = await res.json()
        if (data.success && data.data && Array.isArray(data.data)) {
            if (form.value.faq.length === 0) {
                form.value.faq = data.data
            } else {
                form.value.faq = [...form.value.faq, ...data.data]
            }
            showToast('ดึงคำถามที่พบบ่อย (FAQ) ด้วย AI สำเร็จ', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้าง FAQ ได้ ลองใหม่อีกครั้ง', 'error')
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
        console.error(e)
    } finally {
        generatingFaq.value = false
    }
}

const addFaq = () => {
    form.value.faq.push({ question: '', answer: '' })
}
const removeFaq = async (index) => {
    form.value.faq.splice(index, 1)
    if (editingId.value) {
        await save()
    }
}

// Article Automation State
const activeMainTab = ref('list')
const autoArticleConfig = ref({ enabled: false, time: '08:00', style: 'educational', product_ids: [], last_generated_date: null })
const loadingAutoArticle = ref(false)
const savingAutoArticle = ref(false)
const testingAutoArticle = ref(false)
const autoProductSearch = ref('')

const filteredAutoProducts = computed(() => {
  if (!autoProductSearch.value) return productsList.value
  const s = autoProductSearch.value.toLowerCase()
  return productsList.value.filter(p => p.name.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s))
})

async function fetchAutoArticleConfig() {
  loadingAutoArticle.value = true
  try {
    const r = await (await apiFetch('/api/articles/admin/article-automation')).json()
    if (r.success && r.config) autoArticleConfig.value = r.config
  } catch(e) { console.error(e) }
  finally { loadingAutoArticle.value = false }
}

async function saveAutoArticleConfig() {
  savingAutoArticle.value = true
  try {
    const r = await (await apiFetch('/api/articles/admin/article-automation', {
      method: 'POST',
      body: JSON.stringify(autoArticleConfig.value)
    })).json()
    showToast(r.success ? 'บันทึกการตั้งค่าแล้ว' : (r.error || 'เกิดข้อผิดพลาด'), r.success ? 'success' : 'error')
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { savingAutoArticle.value = false }
}

async function testAutoArticle() {
  testingAutoArticle.value = true
  try {
    const r = await (await apiFetch('/api/articles/admin/article-automation/test', {
      method: 'POST',
      body: JSON.stringify({})
    })).json()
    if (r.success) {
      showToast(`สร้างบทความสำเร็จ: "${r.title}"`, 'success')
      loadArticles()
    } else {
      showToast('ข้อผิดพลาด: ' + (r.error || ''), 'error')
    }
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { testingAutoArticle.value = false }
}

function toggleAutoProduct(id) {
  if (!autoArticleConfig.value.product_ids) autoArticleConfig.value.product_ids = []
  const idx = autoArticleConfig.value.product_ids.indexOf(id)
  if (idx > -1) autoArticleConfig.value.product_ids.splice(idx, 1)
  else autoArticleConfig.value.product_ids.push(id)
}

onMounted(() => { loadArticles(); loadProducts(); fetchAutoArticleConfig() })
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- Top Header & Actions -->
      <div v-show="!showEditor" class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            </div>
            <div>
              <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                จัดการบทความ & SEO Studio
              </h1>
              <p class="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                สร้างบทความด้วย AI ยกระดับการค้นหาบน Google & GEO Search Engine
                <InfoTooltip title="คำแนะนำระบบจัดการบทความ" description="บทความช่วยเพิ่ม SEO และดึงดูดลูกค้าบน Google &amp; AI Search Engine&lt;ul class='mt-2 space-y-1 text-xs'&gt;&lt;li&gt;⚡ &lt;strong&gt;สร้างบทความด้วย AI:&lt;/strong&gt; วิเคราะห์สินค้า + สเปกบทความอัตโนมัติ&lt;/li&gt;&lt;li&gt;⏰ &lt;strong&gt;ตั้งเวลาเผยแพร่:&lt;/strong&gt; สร้างบทความล่วงหน้าและทยอยเผยแพร่&lt;/li&gt;&lt;li&gt;🤖 &lt;strong&gt;AI Auto-Pilot:&lt;/strong&gt; ตั้งเวลาให้ AI สร้างบทความวันละ 1 บทความอัตโนมัติ&lt;/li&gt;&lt;/ul&gt;" />
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 relative z-10">
          <button @click="openNew" class="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all flex items-center gap-2 transform active:scale-95">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            เขียนบทความใหม่
          </button>
        </div>
      </div>

      <!-- Quick Stats Cards Grid -->
      <div v-show="!showEditor" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-all">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400">บทความทั้งหมด</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5">{{ stats.total }}</div>
          </div>
        </div>

        <!-- Published -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400">เผยแพร่แล้ว</div>
            <div class="text-2xl font-black text-emerald-600 mt-0.5">{{ stats.published }}</div>
          </div>
        </div>

        <!-- Scheduled -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-amber-200 transition-all">
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400">ตั้งเวลาเผยแพร่</div>
            <div class="text-2xl font-black text-amber-600 mt-0.5">{{ stats.scheduled }}</div>
          </div>
        </div>

        <!-- Drafts -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
          <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400">ฉบับร่าง</div>
            <div class="text-2xl font-black text-slate-700 mt-0.5">{{ stats.draft }}</div>
          </div>
        </div>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div v-show="!showEditor" class="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div class="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
          <button @click="activeMainTab='list'" class="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2" :class="activeMainTab==='list'?'bg-white text-indigo-700 shadow-sm':'text-slate-500 hover:text-slate-700'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            รายการบทความทั้งหมด
          </button>
          <button @click="activeMainTab='automation'" class="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2" :class="activeMainTab==='automation'?'bg-white text-indigo-700 shadow-sm':'text-slate-500 hover:text-slate-700'">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            สร้างอัตโนมัติ (AI Auto-Pilot)
            <span v-if="autoArticleConfig.enabled" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div v-show="!showEditor && activeMainTab==='list'" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative flex-1">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="ค้นหาตามชื่อบทความ หมวดหมู่ หรือคำสำคัญ..." class="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
          <button v-if="searchQuery" @click="clearSearch" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Filter Pills & Selectors -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button v-for="status in [
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'published', label: '🚀 เผยแพร่แล้ว' },
            { id: 'scheduled', label: '⏰ ตั้งเวลาเผยแพร่' },
            { id: 'draft', label: '📁 ฉบับร่าง' }
          ]" :key="status.id" @click="filterStatus = status.id; onFilterChange()"
          class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border"
          :class="filterStatus === status.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'">
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- TAB: AUTOMATION -->
      <template v-if="activeMainTab==='automation' && !showEditor">
        <div v-if="loadingAutoArticle" class="flex items-center justify-center py-20 bg-white rounded-3xl border border-slate-200"><div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 flex flex-col gap-6">
            <!-- Config Card -->
            <div class="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-6 relative overflow-hidden">
              <div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    ตั้งค่าการสร้างบทความอัตโนมัติ (AI Auto-Pilot)
                  </h3>
                  <p class="text-xs text-slate-500 mt-1 font-medium">ระบบจะสุ่มสร้างบทความพร้อมรูปภาพปกโดยอัตโนมัติจากรายการสินค้าที่เลือกวันละ 1 ครั้ง</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="autoArticleConfig.enabled" class="sr-only peer">
                  <div class="w-12 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span class="ml-3 text-xs font-bold" :class="autoArticleConfig.enabled?'text-indigo-600':'text-slate-400'">{{ autoArticleConfig.enabled?'เปิดใช้งาน':'ปิดใช้งาน' }}</span>
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-2">เวลาที่รันระบบ (ทุกวัน)</label>
                  <input type="time" v-model="autoArticleConfig.time" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 bg-slate-50">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-2">สไตล์การเขียน</label>
                  <select v-model="autoArticleConfig.style" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 bg-slate-50">
                    <option value="educational">ให้ความรู้เชิงลึก (Educational)</option>
                    <option value="sales">แนะนำความคุ้มค่า (Sales Proposition)</option>
                    <option value="howto">คู่มือและขั้นตอน (How-To)</option>
                    <option value="review">รีวิวการใช้งาน (Review)</option>
                  </select>
                </div>
              </div>

              <p v-if="autoArticleConfig.last_generated_date" class="text-xs text-slate-400 mb-4 font-mono">สร้างล่าสุดเมื่อ: {{ autoArticleConfig.last_generated_date }}</p>

              <button @click="saveAutoArticleConfig" :disabled="savingAutoArticle" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-100 flex items-center gap-2">
                <svg v-if="savingAutoArticle" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ savingAutoArticle ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบ' }}
              </button>
            </div>

            <!-- Product Selector -->
            <div class="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-6 flex-1 flex flex-col min-h-[400px]">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-base font-bold text-slate-900">สินค้าสำหรับให้ AI นำไปสุ่มสร้าง (เลือกไว้ {{ (autoArticleConfig.product_ids||[]).length }} รายการ)</h3>
                  <p class="text-xs text-slate-500 mt-0.5">คลิกสินค้าที่ต้องการเลือกหรือยกเลิก</p>
                </div>
                <button @click="saveAutoArticleConfig" :disabled="savingAutoArticle" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
                  บันทึกสินค้า
                </button>
              </div>

              <div class="relative mb-4">
                <input v-model="autoProductSearch" type="text" placeholder="ค้นหาสินค้าเพื่อเลือก..." class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>

              <div class="flex-1 overflow-y-auto border border-slate-200 rounded-2xl p-2 max-h-[360px] space-y-1">
                <div v-if="filteredAutoProducts.length===0" class="text-center py-12 text-slate-400 text-xs">ไม่พบข้อมูลสินค้า</div>
                <div v-for="p in filteredAutoProducts" :key="p.id" @click="toggleAutoProduct(p.id)" class="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center border rounded-md transition-colors" :class="(autoArticleConfig.product_ids||[]).includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent'">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  </div>
                  <div class="w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-100">
                    <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-cover">
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-900 truncate">{{ p.name }}</p>
                    <p class="text-[11px] text-slate-500 truncate">{{ p.category }} · ฿{{ Number(p.price).toLocaleString() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Test -->
          <div class="flex flex-col gap-4">
            <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 class="text-lg font-black mb-1">ทดสอบระบบสร้างทันที 1 บทความ</h3>
              <p class="text-xs text-indigo-100 mb-5 leading-relaxed">ระบบจะสุ่มสินค้า 1 รายการ ให้ AI เขียนบทความและวาดรูปปกแล้วบันทึกเข้าสู่ระบบทันที</p>
              <button @click="testAutoArticle" :disabled="testingAutoArticle" class="w-full py-3 bg-white text-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
                <svg v-if="testingAutoArticle" class="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ testingAutoArticle ? 'กำลังสุ่มสร้างบทความ... (30-60 วินาที)' : '🚀 ทดสอบสร้าง 1 บทความเลย' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="loading && activeMainTab==='list'" class="bg-white rounded-3xl border border-slate-200/80 p-20 text-center text-slate-400 font-medium flex flex-col items-center justify-center">
        <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        กำลังโหลดข้อมูลบทความ...
      </div>

      <!-- Articles List Grid -->
      <div v-else-if="!showEditor && activeMainTab==='list'" class="space-y-3">
        <div v-if="filteredArticles.length === 0" class="bg-white rounded-3xl border border-slate-200/80 py-20 text-center text-slate-400">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
          <p class="font-bold text-slate-700 text-base">ไม่พบข้อมูลบทความ</p>
          <p class="text-xs text-slate-400 mt-1">กดปุ่ม "เขียนบทความใหม่" หรือปรับเปลี่ยนคำค้นหา</p>
        </div>

        <div v-for="article in filteredArticles" :key="article.id" class="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col sm:flex-row gap-4 items-start group">
          <!-- Cover Thumbnail -->
          <div class="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0 relative">
            <img v-if="article.cover_image" :src="article.cover_image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span v-if="article.cover_image" class="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/70 backdrop-blur-md text-white text-[9px] font-bold rounded-md">รูปปก</span>
          </div>

          <!-- Info & Meta -->
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Status Badge -->
              <span :class="[getArticleStatus(article).bg, 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1']">
                {{ getArticleStatus(article).label }}
                <span v-if="getArticleStatus(article).subtext" class="opacity-90 font-mono text-[9px]">({{ getArticleStatus(article).subtext }})</span>
              </span>

              <!-- Featured Star Badge -->
              <span v-if="article.is_featured" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1 border border-amber-200">
                ⭐ บทความแนะนำ
              </span>

              <!-- Category Badge -->
              <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{{ article.category }}</span>
            </div>

            <h3 class="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer" @click="openEdit(article)">
              {{ article.title }}
            </h3>

            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {{ article.excerpt || 'ไม่มีเนื้อหาย่อ...' }}
            </p>

            <div class="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
              <span>โดย {{ article.author || 'Admin' }}</span>
              <span>·</span>
              <span>{{ formatDate(article.created_at) }}</span>
              <span>·</span>
              <span class="flex items-center gap-1 font-mono">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                {{ article.view_count || 0 }} อ่าน
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 sm:self-center flex-shrink-0">
            <button @click="openEdit(article)" class="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-100 hover:border-indigo-100" title="แก้ไขบทความ">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="deleteArticle(article)" :disabled="deletingId === article.id" class="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-100 hover:border-red-100 disabled:opacity-50" title="ลบบทความ">
              <svg v-if="deletingId === article.id" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <!-- Pagination Bar -->
        <div v-if="totalPages > 1" class="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <p class="text-xs text-slate-500 font-medium">ทั้งหมด {{ totalArticles }} บทความ · หน้า {{ currentPage }}/{{ totalPages }}</p>
          <div class="flex gap-1.5">
            <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1" class="px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors" :class="currentPage <= 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">← ก่อนหน้า</button>
            <template v-for="p in paginationRange" :key="p">
              <span v-if="p === '...'" class="px-2 py-1.5 text-slate-400 text-xs">…</span>
              <button v-else @click="changePage(p)" :class="currentPage === p ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'" class="w-8 h-8 text-xs font-bold rounded-lg border transition-colors">
                {{ p }}
              </button>
            </template>
            <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages" class="px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors" :class="currentPage >= totalPages ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">ถัดไป →</button>
          </div>
        </div>
      </div>

      <!-- REDESIGNED ARTICLE EDITOR DRAWER -->
      <div v-if="showEditor" class="space-y-6">
        <!-- Editor Header Navigation Bar -->
        <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md bg-white/95">
          <div class="flex items-center gap-3">
            <button @click="showEditor = false" class="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h2 class="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                {{ editingId ? 'แก้ไขบทความ' : 'เขียนบทความใหม่' }}
              </h2>
              <p class="text-xs text-slate-400 font-medium">กรอกรายละเอียด ข้อมูล AI และ SEO เพื่อเผยแพร่</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button @click="showEditor = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">ยกเลิก</button>
            <button @click="save" :disabled="saving" class="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-indigo-200 flex items-center gap-1.5">
              <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึกบทความ' : 'เผยแพร่บทความ') }}
            </button>
          </div>
        </div>

        <div class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-8">

          <!-- 1. AI CREATOR STUDIO SECTION -->
          <div class="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden space-y-6">
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                  <h3 class="font-black text-base tracking-tight">AI Content Studio</h3>
                  <p class="text-xs text-indigo-100">เลือกสไตล์ ใส่ข้อมูลอ้างอิง แล้วให้ AI สังเคราะห์บทความพร้อมรูปภาพปกอัตโนมัติ</p>
                </div>
              </div>
            </div>

            <!-- Product Selector -->
            <div class="relative">
              <label class="block text-xs font-bold text-indigo-100 mb-2">เลือกสินค้าอ้างอิง (ระบบจะดึงสเปกและราคาไปเขียนอัตโนมัติ)</label>
              <div @click="showProductDropdown = !showProductDropdown" class="w-full border border-white/20 rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md cursor-pointer flex items-center justify-between transition-all text-white text-xs font-bold shadow-inner">
                <div v-if="!currentAiProduct" class="text-indigo-200">— ไม่เลือก (เขียนเกี่ยวกับเครื่องตัดปอกสายไฟ/เทคโนโลยีทั่วไป) —</div>
                <div v-else class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-lg bg-white/20 overflow-hidden flex-shrink-0">
                    <img v-if="currentAiProduct.image_url" :src="currentAiProduct.image_url" class="w-full h-full object-cover">
                  </div>
                  <div>
                    <div class="text-xs font-bold text-white line-clamp-1">{{ currentAiProduct.name }}</div>
                    <div class="text-[10px] text-indigo-200">{{ currentAiProduct.category }} · ฿{{ Number(currentAiProduct.price).toLocaleString() }}</div>
                  </div>
                </div>
                <svg class="w-4 h-4 text-indigo-200" :class="{'rotate-180': showProductDropdown}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>

              <div v-if="showProductDropdown" @click="showProductDropdown = false" class="fixed inset-0 z-20"></div>

              <div v-if="showProductDropdown" class="absolute top-[100%] left-0 w-full mt-2 bg-slate-900/95 border border-slate-700 backdrop-blur-xl rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto p-1">
                <div @click="aiProductId = ''; showProductDropdown = false" class="px-4 py-2.5 hover:bg-slate-800 cursor-pointer rounded-xl text-xs text-slate-300 font-medium">
                  — ไม่เลือก (เขียนทั่วไป) —
                </div>
                <div v-for="p in productsList" :key="p.id" @click="aiProductId = p.id; showProductDropdown = false" class="px-4 py-2.5 hover:bg-indigo-600/30 cursor-pointer rounded-xl flex items-center gap-3 transition-colors text-xs text-slate-100">
                  <div class="w-7 h-7 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                    <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-cover">
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold truncate">{{ p.name }}</div>
                    <div class="text-[10px] text-slate-400">{{ p.category }} · ฿{{ Number(p.price).toLocaleString() }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Style Cards Grid -->
            <div>
              <label class="block text-xs font-bold text-indigo-100 mb-2">เลือกสไตล์การเขียนบทความ</label>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button v-for="s in aiStyles" :key="s.id" @click="aiStyle = s.id" :class="aiStyle === s.id ? 'bg-white text-indigo-950 ring-4 ring-white/30 shadow-xl scale-[1.02]' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'" class="rounded-2xl p-3 text-left transition-all relative group">
                  <div v-html="s.svg" class="mb-2" :class="aiStyle === s.id ? 'text-indigo-600' : 'text-indigo-200'"></div>
                  <div class="text-xs font-bold">{{ s.name }}</div>
                  <div class="text-[10px] opacity-80 mt-0.5 line-clamp-1">{{ s.desc }}</div>
                </button>
              </div>
            </div>

            <!-- Additional Context / Sample Reference Textarea -->
            <div>
              <label class="block text-xs font-bold text-indigo-100 mb-1.5 flex items-center justify-between">
                <span>คัดลอกบทความอ้างอิง / ข้อมูลตัวอย่าง / คำสั่งเพิ่มเติม</span>
                <span class="text-[10px] text-indigo-200">ใส่บทความตัวอย่างให้ AI วิเคราะห์สไตล์และข้อมูลได้</span>
              </label>
              <textarea v-model="aiPrompt" rows="4" placeholder="คัดลอกตัวอย่างบทความ เนื้อหาอ้างอิง สเปกสินค้า หรือหมายเหตุพิเศษ เพื่อให้ AI สังเคราะห์และเรียบเรียงเข้าในบทความนี้..." class="w-full border border-white/20 rounded-2xl p-4 text-xs bg-white/10 text-white placeholder-indigo-200/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all resize-y font-medium"></textarea>
            </div>

            <!-- Generate Button -->
            <button @click="generateArticle" :disabled="generating" class="w-full py-3.5 bg-white text-indigo-900 hover:bg-indigo-50 font-black text-sm rounded-2xl shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 transform active:scale-98">
              <template v-if="generating">
                <svg class="w-4 h-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                กำลังประมวลผลด้วย AI... (10-30 วินาที)
              </template>
              <template v-else>
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                สร้างบทความด้วย AI แบบมืออาชีพ
              </template>
            </button>
          </div>

          <!-- 2. ARTICLE BASIC INFORMATION -->
          <div class="space-y-4 pt-2">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
              ข้อมูลพื้นฐานบทความ
            </h3>

            <!-- Title -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">หัวข้อบทความ (Article Title) *</label>
              <input v-model="form.title" placeholder="เช่น เทคนิคการตัดปอกสายไฟให้ได้มาตรฐาน แม่นยำระดับไมครอนด้วยเครื่อง KODERA" class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            </div>

            <!-- Category & Author Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">หมวดหมู่บทความ</label>
                <select v-model="form.category" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">ผู้เขียน (Author)</label>
                <input v-model="form.author" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 bg-white" placeholder="ชื่อผู้เขียน">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">สินค้าอ้างอิงในบทความ</label>
                <select v-model="form.product_id" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 bg-white">
                  <option :value="null">— ไม่ระบุสินค้า —</option>
                  <option v-for="p in productsList" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. COVER IMAGE & GALLERY MANAGER -->
          <div class="space-y-4 pt-2 border-t border-slate-100">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                  แกลเลอรีรูปภาพผลงาน & รูปปก
                </h3>
                <p class="text-xs text-slate-400 font-medium mt-0.5">* รูปภาพแรกในแกลเลอรีจะถูกใช้เป็นรูปภาพหน้าปกโดยอัตโนมัติ (ลากสลับตำแหน่งได้)</p>
              </div>

              <button @click="generateImagePrompt" :disabled="generatingPrompt" type="button" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-100 flex items-center gap-1.5 disabled:opacity-50">
                <svg v-if="generatingPrompt" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {{ generatingPrompt ? 'กำลังคิด Prompt...' : 'สร้าง AI Cover Prompt' }}
              </button>
            </div>

            <!-- AI Image Prompt Textarea -->
            <div v-if="form.image_prompt || generatingPrompt" class="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 relative">
              <label class="block text-xs font-bold text-indigo-900 mb-1.5 flex items-center justify-between">
                <span>Prompt คำสั่งวาดภาพปกด้วย AI ( Midjourney / DALL-E )</span>
                <button v-if="form.image_prompt" @click="copyPrompt" type="button" class="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1">
                  คัดลอก Prompt
                </button>
              </label>
              <textarea v-model="form.image_prompt" rows="2" class="w-full text-xs text-slate-800 bg-white border border-indigo-200 rounded-xl p-3 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"></textarea>
            </div>

            <!-- Gallery Draggable Grid -->
            <draggable v-model="allImages" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3" item-key="index" :animation="200" ghost-class="opacity-40">
              <template #header>
                <div class="relative rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 transition-all aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer group">
                  <input type="file" multiple accept="image/*" @change="handleImagesUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :disabled="uploadingImages">
                  <template v-if="uploadingImages">
                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mb-1"></div>
                    <span class="text-[10px] font-bold text-slate-500">กำลังอัปโหลด</span>
                  </template>
                  <template v-else>
                    <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <span class="text-xs font-bold text-indigo-700">เพิ่มรูปภาพ</span>
                  </template>
                </div>
              </template>

              <template #item="{ element, index }">
                <div class="relative rounded-2xl overflow-hidden border-2 aspect-square cursor-grab active:cursor-grabbing bg-slate-100 group shadow-sm" :class="index === 0 ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-200'">
                  <img :src="element" class="w-full h-full object-cover">
                  <span v-if="index === 0" class="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-md shadow-sm">รูปปก</span>
                  <button type="button" @click="removeImage(index)" class="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </template>
            </draggable>
          </div>

          <!-- 4. PUBLISHING & SCHEDULING CONTROLS -->
          <div class="space-y-4 pt-2 border-t border-slate-100">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
              ตั้งค่าสถานะการเผยแพร่ & ตั้งเวลาเผยแพร่
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Publish Now Card -->
              <div @click="form.is_published = true; form.published_at = ''" class="p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3" :class="form.is_published && !form.published_at ? 'bg-emerald-50/70 border-emerald-300 shadow-md ring-2 ring-emerald-500/20' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50'">
                <div class="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0" :class="form.is_published && !form.published_at ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'">
                  <div v-if="form.is_published && !form.published_at" class="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900">🚀 เผยแพร่ทันที</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">แสดงผลต่อผู้ใช้งานบนหน้าเว็บไซต์ทันที</div>
                </div>
              </div>

              <!-- Schedule Card -->
              <div @click="!form.published_at ? applySchedulePreset(1, 9) : null" class="p-4 border rounded-2xl cursor-pointer transition-all space-y-2" :class="form.published_at ? 'bg-amber-50/70 border-amber-300 shadow-md ring-2 ring-amber-500/20' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50'">
                <div class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0" :class="form.published_at ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'">
                    <div v-if="form.published_at" class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">⏰ ตั้งเวลาเผยแพร่</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">เปิดอ่านได้เมื่อถึงเวลาที่กำหนด</div>
                  </div>
                </div>
                <input type="datetime-local" v-model="form.published_at" @change="onScheduledAtChange" class="w-full text-xs p-2 border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-slate-800">
              </div>

              <!-- Draft Card -->
              <div @click="form.is_published = false; form.published_at = ''" class="p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3" :class="!form.is_published && !form.published_at ? 'bg-slate-100 border-slate-400 shadow-md ring-2 ring-slate-400/20' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50'">
                <div class="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0" :class="!form.is_published && !form.published_at ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-300'">
                  <div v-if="!form.is_published && !form.published_at" class="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900">📁 บันทึกเป็นฉบับร่าง</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">ซ่อนบทความไว้เฉพาะแอดมิน</div>
                </div>
              </div>
            </div>

            <!-- Quick Schedule Presets Bar -->
            <div class="flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span class="font-bold text-slate-600 text-[11px]">ทางลัดตั้งเวลา (เผยแพร่วันละ 2-3 บทความ):</span>
              <button @click.prevent="applySchedulePreset(1, 9)" type="button" class="px-3 py-1 bg-amber-100/70 text-amber-800 hover:bg-amber-200 rounded-xl text-[11px] font-bold transition-colors border border-amber-200">+1 วัน (09:00)</button>
              <button @click.prevent="applySchedulePreset(1, 14)" type="button" class="px-3 py-1 bg-amber-100/70 text-amber-800 hover:bg-amber-200 rounded-xl text-[11px] font-bold transition-colors border border-amber-200">+1 วัน (14:00)</button>
              <button @click.prevent="applySchedulePreset(1, 18)" type="button" class="px-3 py-1 bg-amber-100/70 text-amber-800 hover:bg-amber-200 rounded-xl text-[11px] font-bold transition-colors border border-amber-200">+1 วัน (18:00)</button>
              <button @click.prevent="applySchedulePreset(2, 9)" type="button" class="px-3 py-1 bg-amber-100/70 text-amber-800 hover:bg-amber-200 rounded-xl text-[11px] font-bold transition-colors border border-amber-200">+2 วัน (09:00)</button>
              <button @click.prevent="applySchedulePreset(3, 9)" type="button" class="px-3 py-1 bg-amber-100/70 text-amber-800 hover:bg-amber-200 rounded-xl text-[11px] font-bold transition-colors border border-amber-200">+3 วัน (09:00)</button>
            </div>

            <!-- Featured Toggle -->
            <label class="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-2xl cursor-pointer w-fit">
              <input type="checkbox" v-model="form.is_featured" class="w-4 h-4 text-amber-600 rounded">
              <span class="text-xs font-bold text-amber-900">⭐ ปักหมุดเป็นบทความแนะนำ (Featured Article)</span>
            </label>
          </div>

          <!-- 5. EXCERPT & CONTENT (CKEDITOR) -->
          <div class="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">เนื้อหาย่อ (Excerpt)</label>
              <textarea v-model="form.excerpt" rows="2" placeholder="สรุปเนื้อหาบทความแบบย่อ 2-3 บรรทัดสำหรับแสดงในหน้ารายการบทความ..." class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">เนื้อหาบทความเต็ม (Content) *</label>
              <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <Ckeditor :editor="editor" v-model="form.content" :config="editorConfig" />
              </div>
            </div>
          </div>

          <!-- 6. SEO & GEO AI SEARCH OPTIMIZATION -->
          <div class="space-y-6 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                  SEO / GEO & AI Search Optimization
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">เพิ่มคีย์เวิร์ด และคำถาม FAQ เพื่อให้ติดอันดับ Google & ChatGPT Search</p>
              </div>

              <button @click.prevent="generateAllAiData" :disabled="generatingAll" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-100 disabled:opacity-50 flex items-center gap-1.5">
                <svg v-if="generatingAll" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {{ generatingAll ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ SEO & AI อัตโนมัติ' }}
              </button>
            </div>

            <!-- SEO Title & Description -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-bold text-slate-700">SEO Title (หัวข้อบน Google)</label>
                  <span class="text-[10px] font-mono" :class="form.seo_title.length > 60 ? 'text-red-500' : 'text-slate-400'">{{ form.seo_title.length }}/60 ตัวอักษร</span>
                </div>
                <input v-model="form.seo_title" placeholder="หัวข้อสำหรับแสดงผลบน Google (ความยาวไม่เกิน 60 ตัวอักษร)" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800">
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-bold text-slate-700">SEO Meta Description (คำบรรยายย่อบน Google)</label>
                  <span class="text-[10px] font-mono" :class="form.seo_description.length > 160 ? 'text-red-500' : 'text-slate-400'">{{ form.seo_description.length }}/160 ตัวอักษร</span>
                </div>
                <textarea v-model="form.seo_description" rows="2" placeholder="สรุปเนื้อหาสั้นๆ ให้น่าติดตาม ดึงดูดการคลิก..." class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 resize-none"></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">SEO Keywords</label>
                  <input v-model="form.seo_keywords" placeholder="เช่น เครื่องตัดปอกสายไฟ, KODERA, Wire Stripping Machine, เครื่องย้ำคอนเนคเตอร์" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Article Tags</label>
                  <input v-model="form.tags" placeholder="เช่น โปรโมชั่น, ความรู้, เคล็ดลับ" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800">
                </div>
              </div>

              <!-- Google SERP Live Preview Box -->
              <div v-if="form.seo_title || form.seo_description" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ตัวอย่างผลลัพธ์บน Google (Live Google Preview)</div>
                <div class="text-blue-700 text-sm font-bold truncate hover:underline cursor-pointer">{{ form.seo_title || form.title || 'ชื่อหัวข้อบทความ' }}</div>
                <div class="text-emerald-700 text-[11px] font-mono truncate">{{ siteDomain }}/blog/{{ form.slug || 'article-slug' }}</div>
                <div class="text-slate-600 text-xs line-clamp-2 leading-relaxed">{{ form.seo_description || form.excerpt || 'คำบรรยายสรุปเนื้อหาบทความ...' }}</div>
              </div>
            </div>

            <!-- LLM Context Box -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">LLM Context (ข้อความบริบทสำหรับ AI Search Engine)</label>
              <textarea v-model="form.llm_context" rows="3" placeholder="ข้อความบริบทสรุปย่อ ให้ AI Scraper (เช่น ChatGPT/Perplexity) อ่านทำความเข้าใจสเปกและบริการได้ง่าย..." class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs bg-slate-50 font-medium"></textarea>
            </div>

            <!-- FAQ Manager -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">FAQ คำถามที่พบบ่อย (ช่วยติดอันดับ Google Rich Snippets)</label>
                <div class="flex items-center gap-2">
                  <button type="button" @click.prevent="generateFaq" :disabled="generatingFaq" class="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1">
                    <svg v-if="generatingFaq" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    ให้ AI ช่วยคิด FAQ
                  </button>
                  <button type="button" @click.prevent="addFaq" class="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors">
                    + เพิ่มคำถาม
                  </button>
                </div>
              </div>

              <div v-for="(item, idx) in form.faq" :key="idx" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                <button type="button" @click="removeFaq(idx)" class="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 rounded-full">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>

                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">คำถาม {{ idx + 1 }}</label>
                  <input v-model="item.question" placeholder="คำถาม..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 bg-white">
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">คำตอบ</label>
                  <textarea v-model="item.answer" rows="2" placeholder="คำตอบ..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-white resize-y"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Floating Save Bar -->
        <div class="sticky bottom-4 z-30 bg-slate-900/90 backdrop-blur-xl text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-slate-700">
          <div class="text-xs font-medium text-slate-300">
            {{ editingId ? 'กำลังแก้ไขบทความ...' : 'กำลังสร้างบทความใหม่...' }}
          </div>
          <div class="flex items-center gap-3">
            <button @click="showEditor = false" class="px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">ยกเลิก</button>
            <button @click="save" :disabled="saving" class="px-7 py-2.5 text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-2">
              <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ saving ? 'กำลังบันทึก...' : (editingId ? 'อัปเดตบทความ' : 'เผยแพร่บทความ') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
