<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)

const form = ref({
  footer_newsletter_title: 'ไม่พลาดโปรโมชั่นและไอเดียแต่งบ้าน',
  footer_newsletter_subtitle: 'สมัครฟรี รับสิทธิ์ก่อนใคร',
  footer_newsletter_privacy: 'ข้อมูลปลอดภัย ยกเลิกได้ทุกเมื่อ',
  footer_distributor_label: 'ตัวแทนจำหน่าย',
  footer_distributor_url: '/about',
  footer_sitemap_label: 'แผนผังเว็บไซต์',
  footer_sitemap_url: '/contact'
})

// Dynamic list of 4 trust badges
const badges = ref([
  { title: 'เชื่อถือได้', desc: 'บริการด้วยความโปร่งใส ตรวจสอบได้', icon: 'shield' },
  { title: 'คัดสรรคุณภาพ', desc: 'คัดเลือกบ้านและบริการที่ได้มาตรฐาน', icon: 'crown' },
  { title: 'ดูแลครบวงจร', desc: 'ทีมงานมืออาชีพพร้อมดูแลคุณทุกขั้นตอน', icon: 'support' },
  { title: 'ใส่ใจลูกค้า', desc: 'เราดูแลลูกค้าทุกท่านเหมือนคนในครอบครัว', icon: 'heart' }
])

const availableIcons = [
  { value: 'shield', name: 'โล่ป้องกัน (Shield)' },
  { value: 'crown', name: 'มงกุฎ (Crown)' },
  { value: 'support', name: 'หูฟังบริการ (Support)' },
  { value: 'heart', name: 'หัวใจ (Heart)' }
]

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
      
      // Parse Trust Badges
      if (data.data.footer_trust_badges) {
        try {
          const parsed = JSON.parse(data.data.footer_trust_badges)
          if (Array.isArray(parsed) && parsed.length === 4) {
            badges.value = parsed
          }
        } catch (e) {
          console.error('Failed to parse footer_trust_badges JSON:', e)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load footer settings:', error)
    showToast('ไม่สามารถโหลดข้อมูลการตั้งค่า Footer ได้', 'error')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const allSettings = Object.entries(form.value).map(([key, value]) => ({ key, value }))

    // Add Badges as JSON
    allSettings.push({
      key: 'footer_trust_badges',
      value: JSON.stringify(badges.value)
    })

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: allSettings })
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูล Footer สำเร็จแล้ว', 'success')
    } else {
      showToast('ไม่สามารถบันทึกข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error')
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
      <h1 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">จัดการข้อมูล Footer</h1>
      <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
        ตั้งค่าข้อความ รูปแบบ และลิงก์ต่าง ๆ ในพื้นที่ส่วนล่างสุดของหน้าเว็บไซต์ (Footer)
        <InfoTooltip title="การจัดการ Footer" description="ข้อมูลเหล่านี้จะถูกนำไปแทนที่ข้อความเดิมที่เป็น Hardcode ในส่วนท้ายเว็บไซต์ทั้งหมด เพื่อให้ผู้ดูแลระบบสามารถปรับแต่งแคมเปญ ข้อความการันตีความปลอดภัย ลิงก์ที่จำเป็น และรายละเอียดรับประกันได้เองแบบเรียลไทม์" />
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      กำลังดึงข้อมูล...
    </div>

    <div v-else class="w-full">
      <form @submit.prevent="saveSettings" class="space-y-6">

        <!-- Newsletter Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              ส่วนสมัครรับข่าวสาร (Newsletter Section)
            </h2>
          </div>
          <div class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">หัวข้อสมัครข่าวสาร (Title)</label>
                <input v-model="form.footer_newsletter_title" type="text" placeholder="เช่น ไม่พลาดโปรโมชั่นและไอเดียแต่งบ้าน" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ข้อความย่อย/คำโปรย (Subtitle)</label>
                <input v-model="form.footer_newsletter_subtitle" type="text" placeholder="เช่น สมัครฟรี รับสิทธิ์ก่อนใคร" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors">
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">นโยบายความเป็นส่วนตัว / การแจ้งเตือน (Privacy Note)</label>
              <input v-model="form.footer_newsletter_privacy" type="text" placeholder="เช่น ข้อมูลปลอดภัย ยกเลิกได้ทุกเมื่อ" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors">
            </div>
          </div>
        </div>

        <!-- Trust Badges Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ป้ายความมั่นใจและการการันตี (Trust Badges - 4 ป้าย)
            </h2>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div v-for="(badge, i) in badges" :key="'badge-'+i" class="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/40 dark:bg-gray-900/30 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 rounded-full uppercase tracking-wider">ป้ายที่ {{ i + 1 }}</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-bold text-gray-500 mb-1">หัวข้อป้าย</label>
                    <input v-model="badge.title" type="text" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500" placeholder="เช่น เชื่อถือได้">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">สัญลักษณ์ (Icon)</label>
                    <select v-model="badge.icon" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-emerald-500">
                      <option v-for="icon in availableIcons" :key="icon.value" :value="icon.value">
                        {{ icon.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">รายละเอียดใต้หัวข้อ</label>
                  <input v-model="badge.desc" type="text" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500" placeholder="เช่น บริการด้วยความโปร่งใส ตรวจสอบได้">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Links Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              ลิงก์เพิ่มเติม (Footer Quick Links)
            </h2>
          </div>
          <div class="p-6 space-y-5">
            <!-- Link 1: Distributor / AI advisor -->
            <div class="border-b border-gray-100 dark:border-gray-700 pb-5 space-y-4">
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">ลิงก์ตัวแทนจำหน่าย</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">ชื่อป้ายเมนู (Label)</label>
                  <input v-model="form.footer_distributor_label" type="text" placeholder="เช่น ตัวแทนจำหน่าย" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">URL ปลายทาง (Path)</label>
                  <input v-model="form.footer_distributor_url" type="text" placeholder="เช่น /about" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Link 2: Sitemap -->
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200">ลิงก์แผนผังเว็บไซต์ (Sitemap Link)</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">ชื่อป้ายเมนู (Label)</label>
                  <input v-model="form.footer_sitemap_label" type="text" placeholder="เช่น แผนผังเว็บไซต์" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">URL ปลายทาง (Path)</label>
                  <input v-model="form.footer_sitemap_url" type="text" placeholder="เช่น /contact" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-3">
          <button type="submit" :disabled="saving" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50">
            <svg v-if="saving" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล Footer' }}</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>
