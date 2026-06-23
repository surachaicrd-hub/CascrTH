<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  order: Object,
  company: Object
})

const printSize = ref('thermal') // 'thermal', 'a5', 'a4'

const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : '-'
const getCustomerName = (o) => { if (o?.user_first_name) return `${o.user_first_name} ${o.user_last_name || ''}`.trim(); const a = o?.shipping_address_parsed || {}; return a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : 'Guest' }
const getCustomerPhone = (o) => o?.user_phone || (o?.shipping_address_parsed || {}).phone || '-'

// Change scale and width constraints based on selected size
const containerClasses = computed(() => {
  if (printSize.value === 'thermal') return 'w-[100mm] min-h-[150mm] text-sm p-4'
  if (printSize.value === 'a5') return 'w-[148mm] min-h-[210mm] text-base p-6'
  if (printSize.value === 'a4') return 'w-[210mm] min-h-[297mm] text-lg p-10'
  return 'w-[100mm] min-h-[150mm] text-sm p-4'
})

// Dynamic inner paddings and font bounds mapping to make components scale harmoniously
const spacing = computed(() => {
  if (printSize.value === 'thermal') return { gap: 'mb-2', headTitle: 'text-sm', title: 'text-lg', text: 'text-xs', large: 'text-2xl', label: 'text-[10px]' }
  if (printSize.value === 'a5') return { gap: 'mb-4', headTitle: 'text-base', title: 'text-2xl', text: 'text-sm', large: 'text-4xl', label: 'text-xs' }
  if (printSize.value === 'a4') return { gap: 'mb-6', headTitle: 'text-lg', title: 'text-3xl', text: 'text-lg', large: 'text-6xl', label: 'text-sm' }
})
</script>

<template>
  <div class="flex flex-col items-center pb-10 w-full min-h-screen relative bg-gray-100 print:bg-white pt-8 print:pt-0">
    
    <!-- Size Selector (Hidden in Print) -->
    <div class="print:hidden w-full max-w-[800px] mb-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm z-10 sticky top-4">
      <div class="flex items-center gap-2 mb-3 sm:mb-0">
        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
        </div>
        <div>
          <h3 class="text-sm font-black text-gray-900">เลือกขนาดกระดาษ</h3>
          <p class="text-xs text-gray-500">เลือกให้ตรงกับการตั้งค่าเครื่องพิมพ์ของคุณ</p>
        </div>
      </div>
      <div class="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
        <button @click="printSize = 'thermal'" :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', printSize === 'thermal' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm']">สติ๊กเกอร์ (100x150)</button>
        <button @click="printSize = 'a5'" :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', printSize === 'a5' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm']">A5</button>
        <button @click="printSize = 'a4'" :class="['px-4 py-2 rounded-lg text-sm font-bold transition-all', printSize === 'a4' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm']">A4</button>
      </div>
    </div>

    <!-- The actual Label -->
    <div :class="['print-page bg-white text-gray-900 overflow-hidden shadow-2xl print:shadow-none border-2 border-black flex flex-col', containerClasses]">
      
      <!-- Sender Box -->
      <div :class="['border-2 border-black rounded-xl relative', spacing.gap]" style="padding: 1rem;">
        <div :class="['absolute -top-3 left-4 bg-white px-2 font-black uppercase text-gray-700', spacing.headTitle]">ผู้จัดส่ง (Sender)</div>
        <h1 :class="['font-black text-gray-900 uppercase mt-2', spacing.title]">{{ company?.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }}</h1>
        <p :class="['text-gray-800 mt-1 leading-relaxed', spacing.text]">{{ company?.contact_address || '' }}</p>
        <p :class="['text-gray-900 font-bold mt-1', spacing.text]">โทร: {{ company?.contact_phone || '-' }}</p>
      </div>

      <!-- Receiver Box -->
      <div :class="['border-2 border-black rounded-xl flex-1 relative mb-0', spacing.gap]" style="padding: 1.25rem;">
        <div :class="['absolute -top-3 left-4 bg-white px-2 font-black uppercase text-gray-700', spacing.headTitle]">ผู้รับ (Receiver)</div>
        <h1 :class="['font-black text-gray-900 mt-3 mb-1 leading-tight', spacing.large]">{{ getCustomerName(order) }}</h1>
        <p :class="['font-bold text-gray-800 mb-4', spacing.title]">{{ getCustomerPhone(order) }}</p>
        
        <div v-if="order?.shipping_address_parsed" :class="['font-medium text-gray-800 leading-relaxed', spacing.text]">
          <p>{{ order.shipping_address_parsed.address_line || '' }}</p>
          <p>
            <span v-if="order.shipping_address_parsed.subdistrict">ต.{{ order.shipping_address_parsed.subdistrict }} </span>
            <span v-if="order.shipping_address_parsed.district">อ.{{ order.shipping_address_parsed.district }}</span>
          </p>
          <p :class="['font-black mt-3', spacing.title]" v-if="order.shipping_address_parsed.province">
            จ.{{ order.shipping_address_parsed.province }} <span class="tracking-widest ml-3">{{ order.shipping_address_parsed.postal_code || '' }}</span>
          </p>
        </div>
        <div v-else :class="['font-medium text-gray-400 italic mt-4', spacing.text]">
          ไม่มีข้อมูลที่อยู่จัดส่ง
        </div>
      </div>

      <!-- Footer / Tracking Info -->
      <div class="border-2 border-black rounded-xl flex items-center bg-gray-50" style="padding: 1rem;">
        <div class="w-1/3 border-r-2 border-black pr-4">
          <p :class="['font-bold text-gray-500 mb-1', spacing.label]">ORDER NO.</p>
          <p :class="['font-black text-gray-900 truncate', spacing.title]">#{{ shortId(order?.id) }}</p>
        </div>
        <div class="w-2/3 text-right pl-4" v-if="order?.tracking_number">
          <p :class="['font-bold text-gray-500 mb-1 uppercase', spacing.label]">TRACKING: {{ order?.shipping_provider || 'Courier' }}</p>
          <p :class="['font-black text-gray-900 tracking-wider break-all', spacing.large]">{{ order.tracking_number }}</p>
        </div>
        <div class="w-2/3 text-right pl-4" v-else>
          <p :class="['font-bold text-gray-500 mb-1 uppercase', spacing.label]">PROVIDER</p>
          <p :class="['font-black text-gray-900', spacing.title]">{{ order?.shipping_provider || 'รอจัดส่ง' }}</p>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
@media print {
  @page { margin: 0; }
  .print-page { 
    margin: 0 !important; 
    border: none !important; 
    box-shadow: none !important; 
  }
}
</style>
