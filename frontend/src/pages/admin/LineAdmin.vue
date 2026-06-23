<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
const { showToast } = useToast()
const API = import.meta.env.VITE_API_BASE || ''
const tab = ref('settings')
const loading = ref(false)
const saving = ref(false)
const creds = ref({ channel_id:'', channel_secret:'', channel_access_token:'' })
const autoConfig = ref({ enabled:false, frequency_days:15, time:'10:00' })
const lineUsers = ref([])
const userStats = ref({ total:0, active:0, inactive:0, this_week:0 })
const quota = ref(null)
const testing = ref(false)
const webhookUrl = ref(window.location.origin + '/api/line/webhook')
const showSecret = ref(false)
const showToken = ref(false)

async function fetchCreds() {
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/credentials`)).json()
    if (r.success) creds.value = r.credentials
  } catch(e) { console.error(e) }
}
async function saveCreds() {
  saving.value = true
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds.value)
    })).json()
    showToast(r.success ? 'บันทึกสำเร็จ' : 'เกิดข้อผิดพลาด', r.success ? 'success' : 'error')
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}
async function fetchAuto() {
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/automation`)).json()
    if (r.success) autoConfig.value = r.config
  } catch(e) { console.error(e) }
}
async function saveAuto() {
  saving.value = true
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(autoConfig.value)
    })).json()
    showToast(r.success ? 'บันทึกสำเร็จ' : 'เกิดข้อผิดพลาด', r.success ? 'success' : 'error')
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}
async function testBroadcast() {
  testing.value = true
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/automation/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })).json()
    if (r.success) showToast('ทดสอบสำเร็จ: ' + (r.product || ''), 'success')
    else showToast('ข้อผิดพลาด: ' + (r.error || ''), 'error')
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { testing.value = false }
}
async function fetchUsers() {
  loading.value = true
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/users?limit=50`)).json()
    if (r.success) { lineUsers.value = r.data; if (r.stats) userStats.value = r.stats }
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}
async function fetchQuota() {
  try {
    const r = await (await apiFetch(`${API}/api/line/admin/quota`)).json()
    if (r.success) quota.value = r
  } catch(e) { console.error(e) }
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' }) : '-'
}
onMounted(() => { fetchCreds(); fetchAuto(); fetchUsers(); fetchQuota() })
</script>

<template>
<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
        <svg class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
      </div>
      <div>
        <h1 class="text-2xl font-black text-gray-900">Line Official</h1>
        <p class="text-sm text-gray-500">จัดการการเชื่อมต่อ LINE OA และระบบบรอดแคสต์อัตโนมัติด้วย AI</p>
      </div>
    </div>
    <!-- Tabs -->
    <div class="flex border-b border-gray-200 gap-6">
      <button @click="tab='settings'" class="pb-3 text-sm font-bold border-b-2 transition-all" :class="tab==='settings' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'">ตั้งค่าการเชื่อมต่อ</button>
      <button @click="tab='users'" class="pb-3 text-sm font-bold border-b-2 transition-all" :class="tab==='users' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'">รายชื่อลูกค้า LINE</button>
      <button @click="tab='automation'" class="pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2" :class="tab==='automation' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        บรอดแคสต์อัตโนมัติ (AI)
      </button>
    </div>
  </div>

  <!-- TAB: SETTINGS -->
  <template v-if="tab==='settings'">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-1">ข้อมูลการเชื่อมต่อ LINE Messaging API</h3>
        <p class="text-sm text-gray-500 mb-6">กรอกข้อมูลจาก <a href="https://developers.line.biz" target="_blank" class="text-green-600 underline">LINE Developers Console</a></p>
        <div class="space-y-4">
          <div><label class="block text-sm font-bold text-gray-700 mb-1">Channel ID</label>
            <input v-model="creds.channel_id" type="text" placeholder="1234567890" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"></div>
          <div><label class="block text-sm font-bold text-gray-700 mb-1">Channel Secret</label>
            <div class="relative">
              <input v-model="creds.channel_secret" :type="showSecret ? 'text' : 'password'" placeholder="กรอก Channel Secret" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10">
              <button type="button" @click="showSecret = !showSecret" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                <svg v-if="!showSecret" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </button>
            </div>
          </div>
          <div><label class="block text-sm font-bold text-gray-700 mb-1">Channel Access Token</label>
            <div class="relative">
              <input v-model="creds.channel_access_token" :type="showToken ? 'text' : 'password'" placeholder="กรอก Channel Access Token" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10">
              <button type="button" @click="showToken = !showToken" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                <svg v-if="!showToken" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </button>
            </div>
          </div>
        </div>
        <button @click="saveCreds" :disabled="saving" class="mt-6 flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
          <svg v-if="saving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
        </button>
      </div>
      <div class="flex flex-col gap-4">
        <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
          <h4 class="text-sm font-bold text-gray-900 mb-3">Webhook URL</h4>
          <p class="text-xs text-gray-500 mb-3">คัดลอก URL นี้ไปใส่ใน LINE Developers Console</p>
          <div class="flex items-center gap-2">
            <input type="text" :value="webhookUrl" readonly class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none">
            <button @click="navigator.clipboard.writeText(webhookUrl); showToast('คัดลอกแล้ว','success')" class="px-4 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap border border-green-200">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              คัดลอก
            </button>
          </div>
        </div>
        <div v-if="quota" class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
          <h4 class="text-sm font-bold text-gray-900 mb-3">โควต้าข้อความ</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">ผู้ติดตาม (ในระบบ)</span><span class="font-bold text-gray-900">{{ quota.followerCount || 0 }} คน</span></div>
            <div class="flex justify-between"><span class="text-gray-500">ใช้ไปแล้วเดือนนี้</span><span class="font-bold text-green-600">{{ quota.quota?.totalUsage || 0 }}</span></div>
            <div v-if="quota.quota?.value" class="flex justify-between"><span class="text-gray-500">โควต้ารวม</span><span class="font-bold">{{ quota.quota.value }}</span></div>
          </div>
        </div>
        <div class="bg-green-50 border border-green-100 rounded-2xl p-5">
          <h4 class="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            วิธีตั้งค่า
          </h4>
          <ol class="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
            <li>ไปที่ <a href="https://developers.line.biz" target="_blank" class="text-green-600 underline">LINE Developers Console</a></li>
            <li>สร้าง Provider แล้วสร้าง Channel (Messaging API)</li>
            <li>คัดลอก Channel ID, Secret, Access Token มาใส่ในช่องด้านซ้าย</li>
            <li>นำ Webhook URL ด้านบนไปใส่ในหน้า Messaging API Settings</li>
            <li>เปิดใช้งาน "Use webhook" ให้เรียบร้อย</li>
          </ol>
        </div>
      </div>
    </div>
  </template>

  <!-- TAB: USERS -->
  <template v-if="tab==='users'">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><p class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">ทั้งหมด</p><p class="text-2xl font-black text-gray-900 mt-1">{{ userStats.total || 0 }}</p></div>
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><p class="text-[11px] text-emerald-500 font-bold uppercase tracking-wider">ติดตามอยู่</p><p class="text-2xl font-black text-emerald-600 mt-1">{{ userStats.active || 0 }}</p></div>
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><p class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">ยกเลิกติดตาม</p><p class="text-2xl font-black text-gray-400 mt-1">{{ userStats.inactive || 0 }}</p></div>
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"><p class="text-[11px] text-green-500 font-bold uppercase tracking-wider">สัปดาห์นี้</p><p class="text-2xl font-black text-green-600 mt-1">{{ userStats.this_week || 0 }}</p></div>
    </div>
    <div v-if="loading" class="flex items-center justify-center py-20"><div class="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div></div>
    <div v-else-if="lineUsers.length===0" class="text-center py-20">
      <svg class="h-12 w-12 mx-auto text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      <p class="text-gray-400 font-medium">ยังไม่มีข้อมูลลูกค้า LINE</p>
      <p class="text-gray-400 text-sm mt-1">เมื่อมีคนแอดไลน์หรือทักมา ระบบจะบันทึกข้อมูลไว้ที่นี่อัตโนมัติ</p>
    </div>
    <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="bg-gray-50 border-b border-gray-100">
          <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase">#</th>
          <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase">ผู้ใช้</th>
          <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase">สถานะ</th>
          <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase">วันที่เพิ่ม</th>
        </tr></thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="(u, idx) in lineUsers" :key="u.id" class="hover:bg-green-50/30 transition-colors">
            <td class="px-5 py-3 text-gray-400 text-xs">{{ idx + 1 }}</td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <img v-if="u.picture_url" :src="u.picture_url" class="w-8 h-8 rounded-full object-cover border border-gray-200">
                <div v-else class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">{{ (u.display_name || '?').charAt(0) }}</div>
                <div><p class="font-semibold text-gray-800">{{ u.display_name || 'ไม่ทราบชื่อ' }}</p><p class="text-xs text-gray-400 font-mono">{{ u.line_user_id ? u.line_user_id.substring(0, 14) + '...' : '' }}</p></div>
              </div>
            </td>
            <td class="px-5 py-3">
              <span v-if="u.is_active" class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-100"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>ติดตาม</span>
              <span v-else class="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full"><span class="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>ยกเลิก</span>
            </td>
            <td class="px-5 py-3 text-gray-500 text-xs">{{ fmtDate(u.created_at) }}</td>
          </tr>
        </tbody>
      </table></div>
    </div>
  </template>

  <!-- TAB: AUTOMATION -->
  <template v-if="tab==='automation'">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-gray-900">ตั้งค่าบรอดแคสต์อัตโนมัติ</h3>
            <p class="text-sm text-gray-500 mt-1">ระบบจะสุ่มสินค้า 1 ชิ้น แล้วให้ AI เขียนข้อความส่งผ่าน LINE ทุกๆ {{ autoConfig.frequency_days || 15 }} วัน</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="autoConfig.enabled" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            <span class="ml-3 text-sm font-bold" :class="autoConfig.enabled ? 'text-green-600' : 'text-gray-400'">{{ autoConfig.enabled ? 'เปิดใช้งาน' : 'ปิด' }}</span>
          </label>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">ความถี่การส่ง</label>
            <select v-model.number="autoConfig.frequency_days" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 font-medium text-gray-900">
              <option :value="7">ทุก 7 วัน</option>
              <option :value="15">ทุก 15 วัน</option>
              <option :value="30">ทุก 30 วัน</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">เวลาที่ส่ง</label>
            <input type="time" v-model="autoConfig.time" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 font-medium text-gray-900">
          </div>
        </div>
        <button @click="saveAuto" :disabled="saving" class="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
          <svg v-if="saving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
        </button>
      </div>
      <div class="flex flex-col gap-4">
        <div class="bg-green-50 border border-green-100 rounded-2xl p-6">
          <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-green-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">ทดสอบบรอดแคสต์</h3>
          <p class="text-sm text-gray-600 mb-4">ระบบจะสุ่มสินค้า 1 ชิ้น ให้ AI เขียนข้อความ แล้วสร้าง Flex Message</p>
          <button @click="testBroadcast" :disabled="testing" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
            <svg v-if="testing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ testing ? 'กำลังสร้างและส่ง...' : 'ทดสอบส่ง Broadcast' }}
          </button>
        </div>
        <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
          <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            คำแนะนำ
          </h4>
          <ul class="text-xs text-gray-500 space-y-2 list-disc pl-4">
            <li>ระบบจะส่ง Flex Message สวยงามพร้อมรูปสินค้าและปุ่มลิงก์</li>
            <li>AI จะเขียนข้อความแนะนำสินค้าให้โดยอัตโนมัติ</li>
            <li>Broadcast จะส่งถึงผู้ติดตามทุกคน (กินโควต้าตามจำนวนคน)</li>
            <li>แนะนำให้ตั้งความถี่ทุก 15 วัน เพื่อไม่ให้เปลืองโควต้า</li>
          </ul>
        </div>
      </div>
    </div>
  </template>
</div>
</template>
