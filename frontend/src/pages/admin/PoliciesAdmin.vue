<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const activeTab = ref('privacy')
const isLoading = ref(true)
const isSaving = ref(false)
const isGeneratingAI = ref(false)

const privacyPolicyContent = ref('')
const termsOfServiceContent = ref('')
const cookiePolicyContent = ref('')
const warrantyPolicyContent = ref('')

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
  simpleUpload: {
    uploadUrl: '/api/upload/ckeditor',
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
  },
  image: {
    toolbar: [
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
      '|',
      'toggleImageCaption',
      'imageTextAlternative'
    ]
  }
})

const loadPolicies = async () => {
  isLoading.value = true
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      privacyPolicyContent.value = data.data.privacy_policy || ''
      termsOfServiceContent.value = data.data.terms_of_service || ''
      cookiePolicyContent.value = data.data.cookie_policy || ''
      warrantyPolicyContent.value = data.data.warranty_policy || ''
    }
  } catch (error) {
    console.error('Failed to load policies:', error)
    showToast('ไม่สามารถโหลดข้อมูลนโยบายได้', 'error')
  } finally {
    isLoading.value = false
  }
}

const savePolicies = async () => {
  isSaving.value = true
  try {
    const settingsPayload = [
      { key: 'privacy_policy', value: privacyPolicyContent.value },
      { key: 'terms_of_service', value: termsOfServiceContent.value },
      { key: 'cookie_policy', value: cookiePolicyContent.value },
      { key: 'warranty_policy', value: warrantyPolicyContent.value }
    ]

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: settingsPayload })
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลเรียบร้อย', 'success')
    } else {
      showToast('บันทึกไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    isSaving.value = false
  }
}

const generateWithAI = async (type) => {
  let contentRef = null
  let typeLabel = ''
  let promptText = ''

  if (type === 'privacy') {
    contentRef = privacyPolicyContent
    typeLabel = 'นโยบายความเป็นส่วนตัว'
    promptText = 'เขียนนโยบายความเป็นส่วนตัว (Privacy Policy) สำหรับ บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ตัวแทนจำหน่ายเครื่องตัดปอกสายไฟ KODERA และอุปกรณ์ Wire Harness ที่เก็บข้อมูลชื่อ เบอร์โทร อีเมล เพื่อติดต่อกลับและเสนอราคา โดยจัดหน้าเป็น HTML ให้อ่านง่าย เน้นความน่าเชื่อถือตามมาตรฐาน PDPA'
  } else if (type === 'terms') {
    contentRef = termsOfServiceContent
    typeLabel = 'เงื่อนไขการให้บริการ'
    promptText = 'เขียนเงื่อนไขการให้บริการ (Terms of Service) สำหรับ บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด จำหน่ายเครื่องจักรและบริการตัดปอกสายไฟ โดยจัดหน้าเป็น HTML ให้อ่านง่าย เน้นความน่าเชื่อถือและการส่งมอบงาน'
  } else if (type === 'cookie') {
    contentRef = cookiePolicyContent
    typeLabel = 'นโยบายคุกกี้'
    promptText = 'เขียนนโยบายการใช้คุกกี้ (Cookie Policy) แนะนำประเภทคุกกี้ (จำเป็น, สถิติ, วิเคราะห์) และการจัดการคุกกี้ เพื่อปฏิบัติตาม PDPA สำหรับเว็บไซต์องค์กร โดยจัดหน้าเป็น HTML ให้อ่านง่าย'
  } else if (type === 'warranty') {
    contentRef = warrantyPolicyContent
    typeLabel = 'นโยบายการรับประกัน'
    promptText = 'เขียนนโยบายและเงื่อนไขการรับประกันเครื่องจักร KODERA (Machine Warranty Policy) ระบุระยะเวลารับประกัน 1 ปีสำหรับเครื่องจักรและระบบอิเล็กทรอนิกส์ พร้อมเงื่อนไขการ On-site Service และข้อยกเว้น โดยจัดหน้าเป็น HTML ให้อ่านง่าย น่าเชื่อถือ'
  }

  if (contentRef.value) {
    const isConfirmed = await showConfirm({
      title: 'ต้องการสร้างเนื้อหาใหม่หรือไม่?',
      message: `คุณมีเนื้อหา${typeLabel}อยู่แล้ว การให้ AI สร้างใหม่จะเขียนทับเนื้อหาเดิม ยืนยันหรือไม่?`,
      confirmText: 'ยืนยันสร้างใหม่',
      cancelText: 'ยกเลิก',
      type: 'warning'
    })
    if (!isConfirmed) return
  }

  isGeneratingAI.value = true

  try {
    const res = await apiFetch('/api/ai/generate-policy', {
      method: 'POST',
      body: JSON.stringify({ 
        type, 
        prompt: promptText 
      })
    })
    const data = await res.json()
    
    if (data.success && data.data) {
      contentRef.value = typeof data.data === 'string' ? data.data : (data.data.content || data.data.html || JSON.stringify(data.data))
      showToast('สร้างเนื้อหาด้วย AI สำเร็จ', 'success')
    } else {
      showToast('เกิดข้อผิดพลาดจาก AI: ' + (data.error || 'ไม่สามารถสร้างเนื้อหาได้'), 'error')
    }
  } catch (error) {
    console.error('AI Generation error:', error)
    showToast('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถเชื่อมต่อระบบ AI ได้'), 'error')
  } finally {
    isGeneratingAI.value = false
  }
}

onMounted(() => {
  loadPolicies()
})
</script>

<template>
  <div class="h-full flex flex-col max-w-7xl mx-auto w-full pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">Policies & Terms</h1>
        <p class="text-sm text-gray-500 mt-2 flex items-center gap-1">จัดการนโยบายเว็บไซต์ เงื่อนไขบริการ การรับประกัน และคุกกี้
          <InfoTooltip title="ตั้งค่านโยบายของเว็บไซต์" description="ตั้งค่าข้อมูลทางกฎหมายต่างๆ เพื่อความโปร่งใสและน่าเชื่อถือ<ul><li><strong>หมวดหมู่นโยบาย:</strong> สามารถกดเปลี่ยนแท็บเพื่อตั้งค่าได้ 4 หมวด (ความเป็นส่วนตัว, เงื่อนไขบริการ, คุกกี้, การรับประกัน)</li><li><strong>ผู้ช่วย AI:</strong> หากไม่มีเอกสารเตรียมไว้ ให้คลิกที่ 'สร้างเนื้อหาด้วย AI' ระบบจะร่างเนื้อหาพื้นฐานตามมาตรฐานกฎหมายเพื่อนำไปปรับแก้ต่อได้ทันที</li></ul>" />
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="savePolicies" 
          :disabled="isSaving"
          class="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          <span class="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
          <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          <span class="relative">{{ isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col gap-6">
      <!-- Tabs -->
      <div class="inline-flex overflow-x-auto p-1 space-x-1 bg-gray-100/80 rounded-2xl w-full sm:w-max border border-gray-200/60 backdrop-blur-sm self-start whitespace-nowrap hide-scrollbar">
        <button 
          @click="activeTab = 'privacy'"
          :class="[
            'px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out',
            activeTab === 'privacy' 
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-emerald-500/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          ]"
        >
          นโยบายความเป็นส่วนตัว
        </button>
        <button 
          @click="activeTab = 'terms'"
          :class="[
            'px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out',
            activeTab === 'terms' 
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-indigo-500/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          ]"
        >
          เงื่อนไขการให้บริการ
        </button>
        <button 
          @click="activeTab = 'cookie'"
          :class="[
            'px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out',
            activeTab === 'cookie' 
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-amber-500/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          ]"
        >
          นโยบายคุกกี้ (Cookie)
        </button>
        <button 
          @click="activeTab = 'warranty'"
          :class="[
            'px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out',
            activeTab === 'warranty' 
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-blue-500/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          ]"
        >
          นโยบายการรับประกัน
        </button>
      </div>

      <div v-if="isLoading" class="flex-1 flex flex-col justify-center items-center py-20">
        <div class="relative w-12 h-12">
          <div class="absolute inset-0 rounded-full border-t-2 border-gray-900 animate-spin"></div>
          <div class="absolute inset-2 rounded-full border-t-2 border-gray-400 animate-spin opacity-50" style="animation-direction: reverse; animation-duration: 1s;"></div>
        </div>
        <p class="mt-4 text-sm font-medium text-gray-500">กำลังโหลด...</p>
      </div>

      <div v-else class="flex-1 relative">
        <div class="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-gray-900/5 z-10"></div>
        <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full bg-clip-padding">
          
          <!-- AI Assistant Banner -->
          <div class="p-5 border-b border-gray-100 transition-colors duration-300" 
            :class="{
              'bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50': activeTab === 'privacy',
              'bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50': activeTab === 'terms',
              'bg-gradient-to-r from-amber-50/50 via-white to-orange-50/50': activeTab === 'cookie',
              'bg-gradient-to-r from-blue-50/50 via-white to-cyan-50/50': activeTab === 'warranty'
            }">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-xl shadow-sm" 
                  :class="{
                    'bg-gradient-to-br from-emerald-500 to-teal-600': activeTab === 'privacy',
                    'bg-gradient-to-br from-indigo-500 to-purple-600': activeTab === 'terms',
                    'bg-gradient-to-br from-amber-500 to-orange-600': activeTab === 'cookie',
                    'bg-gradient-to-br from-blue-500 to-cyan-600': activeTab === 'warranty'
                  }">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-base font-bold text-gray-900">
                    ผู้ช่วย AI ร่าง
                    <span v-if="activeTab === 'privacy'">นโยบายความเป็นส่วนตัว</span>
                    <span v-else-if="activeTab === 'terms'">เงื่อนไขการให้บริการ</span>
                    <span v-else-if="activeTab === 'cookie'">นโยบายการใช้คุกกี้</span>
                    <span v-else-if="activeTab === 'warranty'">นโยบายการรับประกันสินค้า</span>
                  </h3>
                  <p class="text-sm text-gray-500 mt-0.5">
                    <span v-if="activeTab === 'privacy'">ร่างนโยบายครอบคลุม PDPA และข้อมูลติดต่อลูกค้าโดยอัตโนมัติ</span>
                    <span v-else-if="activeTab === 'terms'">ร่างข้อกำหนดลิขสิทธิ์ การรับประกัน และกติกาการใช้งานเว็บไซต์</span>
                    <span v-else-if="activeTab === 'cookie'">สร้างคำอธิบายการใช้คุกกี้ ประเภทคุกกี้ และคำแนะนำการจัดการ</span>
                    <span v-else-if="activeTab === 'warranty'">ร่างข้อตกลงและข้อยกเว้นการรับประกันโครงสร้างและผลงาน 10 ปี</span>
                  </p>
                </div>
              </div>
              
              <button 
                @click="generateWithAI(activeTab)" 
                :disabled="isGeneratingAI"
                :class="[
                  'group relative inline-flex items-center justify-center px-4 py-2 text-sm font-bold transition-all duration-200 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
                  activeTab === 'privacy' ? 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 focus:ring-emerald-500' : '',
                  activeTab === 'terms' ? 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 focus:ring-indigo-500' : '',
                  activeTab === 'cookie' ? 'text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100 focus:ring-amber-500' : '',
                  activeTab === 'warranty' ? 'text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100 focus:ring-blue-500' : ''
                ]"
              >
                <svg v-if="isGeneratingAI" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" 
                  :class="{
                    'text-emerald-600': activeTab === 'privacy',
                    'text-indigo-600': activeTab === 'terms',
                    'text-amber-600': activeTab === 'cookie',
                    'text-blue-600': activeTab === 'warranty'
                  }"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                {{ isGeneratingAI ? 'กำลังประมวลผล...' : 'สร้างเนื้อหา' }}
              </button>
            </div>
          </div>

          <!-- Editor Area -->
          <div class="flex-1 bg-white relative pb-8 relative z-0">
            <!-- Separate CKEditors mapped to activeTab to prevent DOM mismatch -->
            <div v-if="activeTab === 'privacy'" class="ckeditor-wrapper h-full">
              <Ckeditor :editor="editor" v-model="privacyPolicyContent" :config="editorConfig" />
            </div>
            
            <div v-else-if="activeTab === 'terms'" class="ckeditor-wrapper h-full">
              <Ckeditor :editor="editor" v-model="termsOfServiceContent" :config="editorConfig" />
            </div>

            <div v-else-if="activeTab === 'cookie'" class="ckeditor-wrapper h-full">
              <Ckeditor :editor="editor" v-model="cookiePolicyContent" :config="editorConfig" />
            </div>

            <div v-else-if="activeTab === 'warranty'" class="ckeditor-wrapper h-full">
              <Ckeditor :editor="editor" v-model="warrantyPolicyContent" :config="editorConfig" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ไซเดอร์บาร์ให้ซ่อน Scrollbar สำหรับอุปกรณ์เล็ก */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.ckeditor-wrapper {
  display: flex;
  flex-direction: column;
}

.ckeditor-wrapper :deep(.ck-editor) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ckeditor-wrapper :deep(.ck-editor__main) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ckeditor-wrapper :deep(.ck-editor__editable_inline) {
  flex: 1;
  min-height: 500px;
  padding: 2.5rem 3rem !important;
  font-family: inherit;
  border: none !important;
  box-shadow: none !important;
  color: #1f2937;
  font-size: 1rem;
}

.ckeditor-wrapper :deep(.ck-editor__editable_inline.ck-focused) {
  outline: none !important;
  border: none !important;
  box-shadow: inset 0 0 0 2px rgba(99, 102, 241, 0.05) !important;
}

/* Typography styles for inside the editor */
.ckeditor-wrapper :deep(.ck-editor__editable_inline h2) {
  font-size: 1.75rem;
  font-weight: 800;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #111827;
  letter-spacing: -0.025em;
}
.ckeditor-wrapper :deep(.ck-editor__editable_inline h3) {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #374151;
  letter-spacing: -0.01em;
}
.ckeditor-wrapper :deep(.ck-editor__editable_inline p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
  color: #4b5563;
}
.ckeditor-wrapper :deep(.ck-editor__editable_inline ul),
.ckeditor-wrapper :deep(.ck-editor__editable_inline ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
  color: #4b5563;
}
.ckeditor-wrapper :deep(.ck-editor__editable_inline li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
}

.ckeditor-wrapper :deep(.ck-toolbar) {
  background-color: #f8fafc !important;
  border-bottom: 1px solid #f1f5f9 !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 0 !important;
}

.ckeditor-wrapper :deep(.ck-toolbar__items) {
  gap: 0.25rem;
}

.ckeditor-wrapper :deep(.ck-button) {
  border-radius: 0.5rem !important;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ckeditor-wrapper :deep(.ck-button:hover) {
  background-color: #e2e8f0 !important;
}

.ckeditor-wrapper :deep(.ck-button.ck-on) {
  background-color: #e0e7ff !important;
  color: #4f46e5 !important;
}
</style>
