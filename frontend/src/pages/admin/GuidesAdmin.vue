<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

// ckeditor5
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import {
    ClassicEditor,
    Essentials,
    Bold, Italic, Underline, Strikethrough,
    Paragraph, Heading, List,
    Link, BlockQuote,
    Alignment,
    Font,
    Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter,
    MediaEmbed,
    Table, TableToolbar,
    Indent, IndentBlock, Undo
} from 'ckeditor5'

import 'ckeditor5/ckeditor5.css'

const router = useRouter()

// Handle both standard or alias
const toastMsg = useToast()
const showToast = toastMsg.showToast || toastMsg.addToast

const { showConfirm } = useConfirm()

const activeTab = ref('installation_guide')

const editor = ClassicEditor
const editorConfig = ref({
    licenseKey: 'GPL',
    plugins: [
        Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo,
        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed,
        Underline, Strikethrough, BlockQuote, Alignment, Font, Indent, IndentBlock
    ],
    toolbar: {
        items: [
            'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
            'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', '|',
            'alignment', 'bulletedList', 'numberedList', 'outdent', 'indent'
        ],
        shouldNotGroupWhenFull: true
    },
    simpleUpload: {
        uploadUrl: '/api/upload/ckeditor',
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
    },
    table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
    },
    htmlSupport: {
        allow: [
            {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true
            }
        ]
    }
})

// Single reactive object to hold both forms
const forms = ref({
    installation_guide: '',
    payment_guide: ''
})

const isLoading = ref(true)
const isSaving = ref(false)
const isGeneratingAI = ref(false)

const loadData = async () => {
    isLoading.value = true
    try {
        const res = await apiFetch('/api/settings')
        const data = await res.json()
        if (data.success && data.data) {
            forms.value.installation_guide = data.data.installation_guide || ''
            forms.value.payment_guide = data.data.payment_guide || ''
        }
    } catch (error) {
        console.error('Failed to load settings:', error)
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
        router.push('/admin/login')
        return
    }
    loadData()
})

const savePolicies = async () => {
    isSaving.value = true
    try {
        const settingsPayload = [
            { key: 'installation_guide', value: forms.value.installation_guide },
            { key: 'payment_guide', value: forms.value.payment_guide }
        ]

        const res = await apiFetch('/api/settings/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: settingsPayload })
        })

        const data = await res.json()
        if (data.success) {
            showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success')
        } else {
            showToast(data.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error')
        }
    } catch (error) {
        console.error('Failed to save settings:', error)
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error')
    } finally {
        isSaving.value = false
    }
}

const generateWithAI = async (type) => {
    let promptTitle = ''
    let prompt = ''
    
    if (type === 'installation') {
        promptTitle = 'คู่มือการเตรียมพื้นที่และติดตั้ง (Installation Guide)'
        prompt = `เขียน "คู่มือการเตรียมพื้นที่และติดตั้ง (Installation Guide)" สำหรับบริษัท Morespace เป็นภาษาไทยมืออาชีพ
        ที่มีความเป็นทางการ น่าเชื่อถือ และอ่านง่าย มีรายละเอียดเช่น 
        1. การเตรียมพื้นฐาน (โครงสร้างคอนกรีตเสริมเหล็ก ต้องเรียบได้ระนาบ 100%)
        2. การเตรียมระบบไฟและน้ำสำหรับบ้านเก็บของ
        3. ระยะเวลาการติดตั้ง (ใช้เวลาเพียง 1-2 วัน)
        4. การสำรวจหน้างานฟรีโดยวิศวกรก่อนวันติดตั้งจริง
        เขียนเป็น HTML format โดยใช้ tag พื้นฐาน (h2, h3, p, ul, li) ให้ข้อความมีความสละสลวย ห้ามใส่กรอบหน้าต่างหรือ <html><body> ใส่เฉพาะเนื้อหา HTML เปล่าๆ เพียวๆ เท่านั้น`
    } else if (type === 'payment') {
        promptTitle = 'ช่องทางการสั่งซื้อ/ชำระเงิน'
        prompt = `เขียน "ข้อตกลงและเงื่อนไขการสั่งซื้อและชำระเงิน (Ordering and Payment Methods)" สำหรับบริษัท Morespace เป็นภาษาไทยมืออาชีพ
        โดยมีหัวข้อดังนี้
        1. ขั้นตอนการประเมินราคาและสำรวจพื้นที่
        2. การมัดจำเงินงวดที่ 1 (เซ็นสัญญาและสั่งผลิต 50%)
        3. การชำระเงินงวดที่ 2 (ชำระหน้างานก่อนวันส่งมอบชิ้นงาน 50%)
        4. ช่องทางการชำระเงิน (โอนเงินผ่านบัญชีธนาคารบริษัท, บัตรเครดิต) ให้เว้นเลขบัญชีไว้เป็น 'xxx-x-xxxxx-x'
        5. การยกเลิกและคืนเงิน (กรณีสั่งผลิตแล้วสงวนสิทธิ์ไม่คืนเงิน)
        เขียนเป็น HTML format โดยใช้ tag พื้นฐาน (h2, h3, p, ul, li) ให้ข้อความมีความสละสลวย น่าเชื่อถือ ห้ามใส่กรอบหน้าต่างหรือ <html><body> ใส่เฉพาะเนื้อหา HTML เปล่าๆ เพียวๆ เท่านั้น`
    }

    const currentContent = type === 'installation' ? forms.value.installation_guide : forms.value.payment_guide

    if (currentContent && currentContent.length > 50) {
        const isConfirmed = await showConfirm({
            title: 'ต้องการสร้างเนื้อหาใหม่หรือไม่?',
            message: `ระบบจะเขียนเนื้อหา <b>${promptTitle}</b> ใหม่ทั้งหมดด้วย AI ซึ่งจะลบและทับเนื้อหาเดิมของคุณ คุณต้องการดำเนินการต่อหรือไม่?`,
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        })

        const data = await res.json()
        if (data.success) {
            if (type === 'installation') forms.value.installation_guide = data.data
            if (type === 'payment') forms.value.payment_guide = data.data
            
            showToast('AI สร้างเนื้อหาสำเร็จ กรุณาตรวจสอบละปรับแต่งเพิ่มเติม', 'success')
        } else {
            showToast(data.message || 'ไม่สามารถสร้างเนื้อหาได้', 'error')
        }
    } catch (error) {
        console.error('AI Generation error:', error)
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI', 'error')
    } finally {
        isGeneratingAI.value = false
    }
}
</script>

<template>
  <div class="h-full flex flex-col max-w-7xl mx-auto w-full pb-10 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">Guides & Methods</h1>
        <p class="text-sm text-gray-500 mt-2 flex items-center gap-1">จัดการเนื้อหาคู่มือการเตรียมพื้นที่ และนโยบายการสั่งซื้อ/ชำระเงิน
          <InfoTooltip title="คู่มือและข้อกำหนด" description="ตั้งค่าวิธีการขั้นตอนการปฏิบัติงานเพื่อเพิ่มความเข้าใจให้กับลูกค้า<ul><li><strong>การแสดงผล:</strong> คอนเทนต์เหล่านี้จะถูกนำไปแสดงในหน้าสินค้ารายการต่างๆ</li><li><strong>แนบไฟล์เอกสาร:</strong> หากคุณมีไฟล์ PDF แบบละเอียดสามารถแนบทำเป็น Hyperlink ภายในกรอบข้อความนี้ได้</li></ul>" />
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
          <span class="relative">{{ isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col gap-6">
      <!-- Tabs -->
      <div class="inline-flex overflow-x-auto p-1 space-x-1 bg-gray-100/80 rounded-2xl w-full sm:w-max border border-gray-200/60 backdrop-blur-sm self-start whitespace-nowrap hide-scrollbar">
        <button 
          @click="activeTab = 'installation_guide'"
          :class="[
            'px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out',
            activeTab === 'installation_guide' 
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-emerald-500/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          ]"
        >
          คู่มือการเตรียมพื้นที่และติดตั้ง
        </button>
        <button 
          @click="activeTab = 'payment_guide'"
          :class="[
            'px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out',
            activeTab === 'payment_guide' 
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-sky-500/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          ]"
        >
          ช่องทางการสั่งซื้อ/ชำระเงิน
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
              'bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50': activeTab === 'installation_guide',
              'bg-gradient-to-r from-sky-50/50 via-white to-indigo-50/50': activeTab === 'payment_guide'
            }">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-xl shadow-sm" 
                  :class="{
                    'bg-gradient-to-br from-emerald-500 to-teal-600': activeTab === 'installation_guide',
                    'bg-gradient-to-br from-sky-500 to-indigo-600': activeTab === 'payment_guide'
                  }">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-base font-bold text-gray-900">
                    ผู้ช่วย AI เขียน
                    <span v-if="activeTab === 'installation_guide'">คู่มือการติดตั้ง</span>
                    <span v-else-if="activeTab === 'payment_guide'">วิธีการชำระเงิน</span>
                  </h3>
                  <p class="text-sm text-gray-500 mt-0.5">
                    <span v-if="activeTab === 'installation_guide'">ร่างคำแนะนำการเตรียมพื้นที่ ฐานราก และกระบวนการติดตั้งให้ลูกค้าอย่างมืออาชีพ</span>
                    <span v-else-if="activeTab === 'payment_guide'">ร่างขั้นตอนการสั่งซื้อ กฎการมัดจำ การจ่ายค่างวด และช่องทางรับเงิน</span>
                  </p>
                </div>
              </div>
              
              <button 
                @click="generateWithAI(activeTab === 'installation_guide' ? 'installation' : 'payment')" 
                :disabled="isGeneratingAI"
                :class="[
                  'group relative inline-flex items-center justify-center px-4 py-2 text-sm font-bold transition-all duration-200 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
                  activeTab === 'installation_guide' ? 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 focus:ring-emerald-500' : '',
                  activeTab === 'payment_guide' ? 'text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100 focus:ring-sky-500' : ''
                ]"
              >
                <svg v-if="isGeneratingAI" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" 
                  :class="{
                    'text-emerald-600': activeTab === 'installation_guide',
                    'text-sky-600': activeTab === 'payment_guide'
                  }"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                {{ isGeneratingAI ? 'กำลังประมวลผล...' : 'ร่างเนื้อหาด้วย AI' }}
              </button>
            </div>
          </div>

          <!-- Editor Area -->
          <div class="flex-1 bg-white relative pb-8 relative z-0">
            <!-- Separate CKEditors mapped to activeTab to prevent DOM mismatch -->
            <div v-if="activeTab === 'installation_guide'" class="ckeditor-wrapper h-full">
              <Ckeditor :editor="editor" v-model="forms.installation_guide" :config="editorConfig" />
            </div>
            
            <div v-else-if="activeTab === 'payment_guide'" class="ckeditor-wrapper h-full">
              <Ckeditor :editor="editor" v-model="forms.payment_guide" :config="editorConfig" />
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

.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
