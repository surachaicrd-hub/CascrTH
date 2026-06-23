<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: Object,
  company: Object
})

const formatPrice = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (d) => d ? new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : '-'
const getCustomerName = (o) => { if (o?.user_first_name) return `${o.user_first_name} ${o.user_last_name || ''}`.trim(); const a = o?.shipping_address_parsed || {}; return a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : 'Guest' }
const getCustomerPhone = (o) => o?.user_phone || (o?.shipping_address_parsed || {}).phone || '-'

const itemsTotal = computed(() => (props.order?.items || []).reduce((s, i) => s + i.price_at_purchase * i.quantity, 0))
</script>

<template>
  <div class="print-page receipt-layout bg-white text-gray-900 mx-auto w-[210mm] min-h-[297mm] p-12 shadow-sm border border-gray-100 print:shadow-none print:border-none relative">
    <!-- Header Section -->
    <div class="flex justify-between items-start mb-8 border-b-2 border-gray-900 pb-6">
      <div class="flex flex-col">
        <h1 class="text-3xl font-black text-gray-900 mb-2">ใบเสร็จรับเงิน</h1>
        <h2 class="text-lg font-bold text-gray-800 tracking-wide">RECEIPT</h2>
      </div>
      <div class="text-right max-w-[400px]">
        <h3 class="text-xl font-bold text-gray-900 mb-1">{{ company?.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }}</h3>
        <p class="text-xs text-gray-600 leading-relaxed">{{ company?.contact_address || 'ที่อยู่บริษัท' }}</p>
        <p class="text-xs text-gray-600 mt-1">โทร: {{ company?.contact_phone || '-' }} <span v-if="company?.contact_email">| อีเมล: {{ company.contact_email }}</span></p>
        <p class="text-xs text-gray-600 mt-1" v-if="company?.tax_id">เลขประจำตัวผู้เสียภาษี: {{ company.tax_id }}</p>
      </div>
    </div>

    <!-- Info Section -->
    <div class="flex justify-between mb-8">
      <div class="w-1/2 pr-4">
        <p class="text-xs font-bold text-gray-500 uppercase mb-1">ชื่อลูกค้า / Customer</p>
        <p class="text-sm font-bold text-gray-900 mb-1">{{ getCustomerName(order) }}</p>
        <p class="text-sm text-gray-600">เบอร์โทร: {{ getCustomerPhone(order) }}</p>
        <!-- Address logic -->
        <p v-if="order?.shipping_address_parsed" class="text-sm text-gray-600 mt-1">
          {{ order.shipping_address_parsed.address_line || '' }}
          {{ order.shipping_address_parsed.subdistrict ? `ต.${order.shipping_address_parsed.subdistrict}` : '' }}
          {{ order.shipping_address_parsed.district ? `อ.${order.shipping_address_parsed.district}` : '' }}
          {{ order.shipping_address_parsed.province ? `จ.${order.shipping_address_parsed.province}` : '' }}
          {{ order.shipping_address_parsed.postal_code || '' }}
        </p>
      </div>
      <div class="w-1/3 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 font-bold">เลขที่ใบเสร็จ / No:</span>
          <span class="font-bold text-gray-900">REC-{{ shortId(order?.id) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500 font-bold">วันที่ / Date:</span>
          <span class="text-gray-900 font-medium">{{ formatDate(order?.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <table class="w-full text-left border-collapse mb-8">
      <thead>
        <tr class="border-y-2 border-gray-900 bg-gray-50">
          <th class="py-3 px-4 text-xs font-bold text-gray-700 uppercase w-12 text-center">ลำดับ</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-700 uppercase">รายละเอียดสินค้า (Description)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-700 uppercase text-center w-24">จำนวน<br>(Qty)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-700 uppercase text-right w-32">ราคา/หน่วย<br>(Unit Price)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-700 uppercase text-right w-32">จำนวนเงิน<br>(Amount)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in order?.items" :key="item.id" class="border-b border-gray-200">
          <td class="py-4 px-4 text-sm text-gray-600 text-center">{{ index + 1 }}</td>
          <td class="py-4 px-4 text-sm font-medium text-gray-900">{{ item.product_name }}</td>
          <td class="py-4 px-4 text-sm text-gray-600 text-center">{{ item.quantity }}</td>
          <td class="py-4 px-4 text-sm text-gray-600 text-right">฿{{ formatPrice(item.price_at_purchase) }}</td>
          <td class="py-4 px-4 text-sm font-bold text-gray-900 text-right">฿{{ formatPrice(item.price_at_purchase * item.quantity) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="flex justify-end mb-12">
      <div class="w-1/2 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">รวมเป็นเงิน (Subtotal)</span>
          <span class="font-bold text-gray-900">฿{{ formatPrice(itemsTotal) }}</span>
        </div>
        <div v-if="order?.shipping_cost > 0" class="flex justify-between text-sm">
          <span class="text-gray-600">ค่าจัดส่ง (Shipping)</span>
          <span class="font-bold text-gray-900">฿{{ formatPrice(order.shipping_cost) }}</span>
        </div>
        <div class="flex justify-between text-lg border-t-2 border-gray-900 pt-3">
          <span class="font-black text-gray-900">ยอดรวมทั้งสิ้น (Grand Total)</span>
          <span class="font-black text-gray-900">฿{{ formatPrice(order?.total_amount) }}</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="grid grid-cols-2 gap-10 mt-20 pt-10 border-t border-dashed border-gray-300">
      <div class="text-center">
        <div class="border-b border-gray-400 w-48 mx-auto mb-2"></div>
        <p class="text-sm font-bold text-gray-700">ผู้จ่ายเงิน / Payer</p>
        <p class="text-xs text-gray-500 mt-1">วันที่ (Date) _____/_____/_____</p>
      </div>
      <div class="text-center">
        <div class="border-b border-gray-400 w-48 mx-auto mb-2"></div>
        <p class="text-sm font-bold text-gray-700">ผู้รับเงิน / Receiver</p>
        <p class="text-xs text-gray-500 mt-1">วันที่ (Date) _____/_____/_____</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  @page { size: A4; margin: 0; }
  .print-page { width: 100%; min-height: 100vh; margin: 0; padding: 15mm; }
}
</style>
