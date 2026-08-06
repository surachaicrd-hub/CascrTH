<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)

const form = ref({
  contact_company_name: '',
  contact_address: '',
  contact_facebook_url: '',
  contact_tiktok_url: '',
  contact_youtube_url: '',
  contact_map_embed: '',
  contact_working_hours: ''
})

// Dynamic lists for multi-entry contact info
const phones = ref([{ name: '', value: '' }])
const emails = ref([{ name: '', value: '' }])
const lines = ref([{ name: '', value: '', url: '' }])

const addPhone = () => phones.value.push({ name: '', value: '' })
const removePhone = (i) => { if (phones.value.length > 1) phones.value.splice(i, 1) }

const addEmail = () => emails.value.push({ name: '', value: '' })
const removeEmail = (i) => { if (emails.value.length > 1) emails.value.splice(i, 1) }

const addLine = () => lines.value.push({ name: '', value: '', url: '' })
const removeLine = (i) => { if (lines.value.length > 1) lines.value.splice(i, 1) }

const loadSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success) {
      for (const key of Object.keys(form.value)) {
        if (data.data[key] !== undefined) {
          form.value[key] = data.data[key]
        }
      }
      // Parse JSON arrays
      if (data.data.contact_phones) {
        try { phones.value = JSON.parse(data.data.contact_phones) } catch (e) { /* keep default */ }
      }
      if (data.data.contact_emails) {
        try { emails.value = JSON.parse(data.data.contact_emails) } catch (e) { /* keep default */ }
      }
      if (data.data.contact_lines) {
        try { lines.value = JSON.parse(data.data.contact_lines) } catch (e) { /* keep default */ }
      }
    }
  } catch (error) {
    console.error('Failed to load contact settings:', error)
    showToast('ไม่สามารถโหลดข้อมูลได้', 'error')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const allSettings = Object.entries(form.value).map(([key, value]) => ({ key, value }))

    // Add JSON arrays
    allSettings.push({ key: 'contact_phones', value: JSON.stringify(phones.value.filter(p => p.value)) })
    allSettings.push({ key: 'contact_emails', value: JSON.stringify(emails.value.filter(e => e.value)) })
    allSettings.push({ key: 'contact_lines', value: JSON.stringify(lines.value.filter(l => l.value)) })

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: allSettings })
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลติดต่อสำเร็จ', 'success')
    } else {
      showToast('บันทึกไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-gray-900 tracking-tight">จัดการข้อมูลติดต่อ</h1>
      <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">แก้ไขข้อมูลที่แสดงในหน้า "ติดต่อเรา" ของเว็บไซต์
        <InfoTooltip title="การจัดการข้อมูลติดต่อ" description="ข้อมูลนี้ถูกนำไปแสดงผลที่หน้าจอติดต่อเราของลูกค้า" />
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      กำลังดึงข้อมูล...
    </div>

    <div v-else class="w-full">
      <form @submit.prevent="saveSettings" class="space-y-6">

        <!-- Company Info -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              ข้อมูลบริษัท
            </h2>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">ชื่อบริษัท</label>
              <input v-model="form.contact_company_name" type="text" placeholder="เช่น บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">ที่อยู่สำนักงาน</label>
              <textarea v-model="form.contact_address" rows="2" placeholder="เช่น 75/110 หมู่ 11 ตำบลคลองหนึ่ง..." class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- Phone Numbers (Multi-Entry) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              เบอร์โทรศัพท์
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div v-for="(phone, i) in phones" :key="'phone-'+i" class="flex items-start gap-3">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">ชื่อพนักงาน</label>
                  <input v-model="phone.name" type="text" placeholder="เช่น คุณตั้ม" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">เบอร์โทรศัพท์</label>
                  <input v-model="phone.value" type="text" placeholder="เช่น 089-199-3873" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
              </div>
              <button type="button" @click="removePhone(i)" :disabled="phones.length <= 1" class="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="ลบรายการ">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <button type="button" @click="addPhone" class="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มเบอร์โทรศัพท์
            </button>
          </div>
        </div>

        <!-- Emails (Multi-Entry) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              อีเมล
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div v-for="(email, i) in emails" :key="'email-'+i" class="flex items-start gap-3">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">ชื่อพนักงาน</label>
                  <input v-model="email.name" type="text" placeholder="เช่น คุณตั้ม" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">อีเมล</label>
                  <input v-model="email.value" type="text" placeholder="เช่น sale@domain.com" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
              </div>
              <button type="button" @click="removeEmail(i)" :disabled="emails.length <= 1" class="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="ลบรายการ">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <button type="button" @click="addEmail" class="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มอีเมล
            </button>
          </div>
        </div>

        <!-- LINE Accounts (Multi-Entry) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
              LINE Official
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div v-for="(line, i) in lines" :key="'line-'+i" class="flex items-start gap-3">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">ชื่อ</label>
                  <input v-model="line.name" type="text" placeholder="เช่น บริษัท / แอดมิน" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">LINE ID</label>
                  <input v-model="line.value" type="text" placeholder="เช่น @yourlineid" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">URL เพิ่มเพื่อน</label>
                  <input v-model="line.url" type="text" placeholder="https://line.me/R/ti/p/..." class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
                </div>
              </div>
              <button type="button" @click="removeLine(i)" :disabled="lines.length <= 1" class="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="ลบรายการ">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <button type="button" @click="addLine" class="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่ม LINE
            </button>
          </div>
        </div>

        <!-- Social Media -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              โซเชียลมีเดีย
            </h2>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">Facebook Page URL</label>
              <input v-model="form.contact_facebook_url" type="text" placeholder="เช่น https://www.facebook.com/yourpage" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">TikTok URL</label>
              <input v-model="form.contact_tiktok_url" type="text" placeholder="เช่น https://www.tiktok.com/@youraccount" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">YouTube URL</label>
              <input v-model="form.contact_youtube_url" type="text" placeholder="เช่น https://www.youtube.com/@yourchannel" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm">
            </div>
          </div>
        </div>

        <!-- Map & Working Hours -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              แผนที่และเวลาทำการ
            </h2>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">เวลาทำการ</label>
              <input v-model="form.contact_working_hours" type="text" placeholder="เช่น จันทร์ - ศุกร์ 08:00 - 17:00 น." class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Google Maps Embed URL</label>
              <textarea v-model="form.contact_map_embed" rows="3" placeholder="วาง URL ของ Google Maps Embed ที่นี่..." class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none font-mono text-xs"></textarea>
              <p class="text-xs text-gray-500 mt-2 leading-relaxed">
                ไปที่ <a href="https://www.google.com/maps" target="_blank" class="text-indigo-600 hover:underline">Google Maps</a> → ค้นหาสถานที่ → กดแชร์ → ฝังแผนที่ → คัดลอกเฉพาะ URL (src="...")
              </p>
            </div>

            <!-- Map Preview -->
            <div v-if="form.contact_map_embed">
              <label class="block text-sm font-bold text-gray-700 mb-2">ตัวอย่างแผนที่</label>
              <div class="rounded-xl overflow-hidden border border-gray-200">
                <iframe :src="form.contact_map_embed" width="100%" height="250" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="sticky bottom-6 z-40 bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-gray-200 flex justify-between items-center transition-all">
          <div class="hidden sm:block text-sm font-medium text-gray-500">
            โปรดตรวจสอบความถูกต้องก่อนกดบันทึก
          </div>
          <button type="submit" :disabled="saving" class="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-base">{{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติดต่อ' }}</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>
