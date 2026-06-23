<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import { useAuthStore } from '../../stores/authStore'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const authStore = useAuthStore()
const { showToast } = useToast()

const coupons = ref([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  code: '', description: '', type: 'percent', value: '', min_order_amount: 0,
  max_discount_amount: '', usage_limit: '', expires_at: '', is_active: 1
})
const form = ref(emptyForm())

const fetchCoupons = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/coupons/admin', { headers: { Authorization: `Bearer ${authStore.token}` } })
    const data = await res.json()
    if (data.success) coupons.value = data.data
  } catch (e) { showToast('โหลดข้อมูลไม่สำเร็จ', 'error') }
  finally { loading.value = false }
}

const openCreate = () => { form.value = emptyForm(); editingId.value = null; showForm.value = true }
const openEdit = (c) => {
  form.value = {
    code: c.code, description: c.description || '', type: c.type, value: c.value,
    min_order_amount: c.min_order_amount || 0,
    max_discount_amount: c.max_discount_amount || '',
    usage_limit: c.usage_limit || '',
    expires_at: c.expires_at ? c.expires_at.substring(0, 16) : '',
    is_active: c.is_active
  }
  editingId.value = c.id; showForm.value = true
}

const saveForm = async () => {
  if (!form.value.code || !form.value.value) { showToast('กรุณากรอก Code และ Value', 'error'); return }
  const url = editingId.value ? `/api/coupons/admin/${editingId.value}` : '/api/coupons/admin'
  const method = editingId.value ? 'PUT' : 'POST'
  try {
    const res = await apiFetch(url, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` },
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (data.success) { showToast(data.message, 'success'); showForm.value = false; fetchCoupons() }
    else showToast(data.error, 'error')
  } catch (e) { showToast('บันทึกไม่สำเร็จ', 'error') }
}

const deleteCoupon = async (id, code) => {
  if (!confirm(`ลบโค้ด "${code}" ใช่หรือไม่?`)) return
  try {
    const res = await apiFetch(`/api/coupons/admin/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const data = await res.json()
    if (data.success) { showToast(data.message, 'success'); fetchCoupons() }
    else showToast(data.error, 'error')
  } catch (e) { showToast('ลบไม่สำเร็จ', 'error') }
}

const toggleActive = async (c) => {
  try {
    const res = await apiFetch(`/api/coupons/admin/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` },
      body: JSON.stringify({ ...c, is_active: c.is_active ? 0 : 1 })
    })
    const data = await res.json()
    if (data.success) { fetchCoupons() }
  } catch (e) {}
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const isExpired = (d) => d && new Date(d) < new Date()
const usagePercent = (c) => c.usage_limit ? Math.min(100, Math.round((c.used_count / c.usage_limit) * 100)) : null

onMounted(fetchCoupons)
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
          จัดการโค้ดส่วนลด
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">สร้างและจัดการ Coupon Codes สำหรับลูกค้า
          <InfoTooltip title="ระบบโค้ดส่วนลด" description="<strong>ประเภทโค้ดส่วนลด:</strong><ul><li><strong>เปอร์เซ็นต์ (%):</strong> ลดราคาตาม % เช่น 10% สามารถกำหนดเพดานส่วนลดสูงสุดได้</li><li><strong>คงที่ (฿):</strong> ลดราคาตามจำนวนเงิน เช่น ลด 500฿</li></ul><strong>เงื่อนไขเพิ่มเติม:</strong><ul><li><strong>ยอดขั้นต่ำ:</strong> ต้องซื้อขั้นต่ำเท่าไรจึงใช้ได้</li><li><strong>จำนวนสูงสุด:</strong> ใช้ได้กี่ครั้งทั้งหมด</li><li><strong>วันหมดอายุ:</strong> หลังพ้นกำหนดโค้ดจะใช้ไม่ได้อัตโนมัติ</li></ul>" />
        </p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        สร้างโค้ดใหม่
      </button>
    </div>

    <!-- Form Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-[200] flex items-center justify-center p-4" @click.self="showForm = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-white dark:bg-[#111827] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-black text-gray-900 dark:text-white">{{ editingId ? 'แก้ไขโค้ดส่วนลด' : 'สร้างโค้ดส่วนลดใหม่' }}</h2>
              <button @click="showForm = false" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">โค้ด (CODE) *</label>
                  <input v-model="form.code" type="text" :disabled="!!editingId" placeholder="SAVE10" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm uppercase dark:bg-gray-800 dark:text-white disabled:opacity-50">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ประเภท *</label>
                  <select v-model="form.type" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
                    <option value="percent">เปอร์เซ็นต์ (%)</option>
                    <option value="fixed">คงที่ (฿)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">รายละเอียด</label>
                <input v-model="form.description" type="text" placeholder="คำอธิบายโค้ด" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ค่าส่วนลด * <span class="text-gray-400">({{ form.type === 'percent' ? '%' : '฿' }})</span></label>
                  <input v-model="form.value" type="number" min="0" step="0.01" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ยอดขั้นต่ำ (฿)</label>
                  <input v-model="form.min_order_amount" type="number" min="0" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div v-if="form.type === 'percent'">
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ส่วนลดสูงสุด (฿) <span class="text-gray-400">ไม่บังคับ</span></label>
                  <input v-model="form.max_discount_amount" type="number" min="0" placeholder="ไม่จำกัด" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">จำนวนสูงสุด <span class="text-gray-400">ไม่บังคับ</span></label>
                  <input v-model="form.usage_limit" type="number" min="0" placeholder="ไม่จำกัด" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">วันหมดอายุ <span class="text-gray-400">ไม่บังคับ</span></label>
                <input v-model="form.expires_at" type="datetime-local" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:bg-gray-800 dark:text-white">
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" :checked="form.is_active === 1" @change="form.is_active = $event.target.checked ? 1 : 0" class="rounded text-emerald-600 focus:ring-emerald-500">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">เปิดใช้งาน</span>
              </label>
            </div>

            <div class="flex gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <button @click="showForm = false" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">ยกเลิก</button>
              <button @click="saveForm" class="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20">บันทึก</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Table -->
    <div class="bg-white dark:bg-[#111827] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>

      <div v-else-if="coupons.length === 0" class="text-center py-20 text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
        <p class="font-medium">ยังไม่มีโค้ดส่วนลด</p>
        <button @click="openCreate" class="mt-4 text-sm text-emerald-600 hover:underline">สร้างโค้ดแรก →</button>
      </div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">โค้ด</th>
            <th class="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ส่วนลด</th>
            <th class="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">เงื่อนไข</th>
            <th class="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">การใช้งาน</th>
            <th class="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">หมดอายุ</th>
            <th class="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">สถานะ</th>
            <th class="px-4 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="c in coupons" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <td class="px-6 py-4">
              <div class="font-black text-gray-900 dark:text-white font-mono tracking-wide">{{ c.code }}</div>
              <div v-if="c.description" class="text-xs text-gray-400 mt-0.5">{{ c.description }}</div>
            </td>
            <td class="px-4 py-4">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">
                {{ c.type === 'percent' ? `${c.value}%` : `฿${Number(c.value).toLocaleString()}` }}
              </span>
              <span v-if="c.type === 'percent' && c.max_discount_amount" class="text-xs text-gray-400 block">สูงสุด ฿{{ Number(c.max_discount_amount).toLocaleString() }}</span>
            </td>
            <td class="px-4 py-4 text-gray-500 dark:text-gray-400">
              <span v-if="c.min_order_amount > 0">ขั้นต่ำ ฿{{ Number(c.min_order_amount).toLocaleString() }}</span>
              <span v-else class="text-gray-300 dark:text-gray-600">ไม่มี</span>
            </td>
            <td class="px-4 py-4">
              <div class="text-gray-900 dark:text-white font-medium">
                {{ c.used_count }} <span class="text-gray-400 font-normal">/ {{ c.usage_limit || '∞' }}</span>
              </div>
              <div v-if="c.usage_limit" class="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5">
                <div class="h-1.5 rounded-full transition-all" :class="usagePercent(c) >= 90 ? 'bg-red-500' : 'bg-emerald-500'" :style="{ width: usagePercent(c) + '%' }"></div>
              </div>
            </td>
            <td class="px-4 py-4">
              <span v-if="c.expires_at" :class="isExpired(c.expires_at) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'" class="text-xs">{{ formatDate(c.expires_at) }}</span>
              <span v-else class="text-gray-300 dark:text-gray-600 text-xs">ไม่มีวันหมดอายุ</span>
            </td>
            <td class="px-4 py-4">
              <button @click="toggleActive(c)" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="c.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="c.is_active ? 'translate-x-6' : 'translate-x-1'"></span>
              </button>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-2">
                <button @click="openEdit(c)" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button @click="deleteCoupon(c.id, c.code)" class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
