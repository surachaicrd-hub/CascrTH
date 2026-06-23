<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: Object,
  company: Object
})

const formatPrice = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (d) => d ? new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : '-'

const itemsTotal = computed(() => (props.order?.items || []).reduce((s, i) => s + i.price_at_purchase * i.quantity, 0))
// Calculate VAT from total amount (assume 7% VAT included in total)
const vatRate = 0.07
const amountBeforeVat = computed(() => {
  if (!props.order?.total_amount) return 0
  return props.order.total_amount / (1 + vatRate)
})
const vatAmount = computed(() => {
  if (!props.order?.total_amount) return 0
  return props.order.total_amount - (props.order.total_amount / (1 + vatRate))
})

const getCustomerName = (o) => { if (o?.user_first_name) return `${o.user_first_name} ${o.user_last_name || ''}`.trim(); const a = o?.shipping_address_parsed || {}; return a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : 'Guest' }
</script>

<template>
  <div class="print-page tax-layout bg-white text-gray-900 mx-auto w-[210mm] min-h-[297mm] p-12 shadow-sm border border-gray-100 print:shadow-none print:border-none relative">
    <!-- Header Section -->
    <div class="flex justify-between items-start mb-8 border-b-2 border-gray-900 pb-6">
      <div class="flex flex-col">
        <h1 class="text-3xl font-black text-gray-900 mb-2">ใบกำกับภาษี</h1>
        <h2 class="text-lg font-bold text-gray-800 tracking-wide">TAX INVOICE</h2>
      </div>
      <div class="text-right max-w-[400px]">
        <h3 class="text-xl font-bold text-gray-900 mb-1">{{ company?.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }}</h3>
        <p class="text-xs text-gray-600 leading-relaxed">{{ company?.contact_address || 'ที่อยู่บริษัท' }}</p>
        <p class="text-xs text-gray-600 mt-1">โทร: {{ company?.contact_phone || '-' }} <span v-if="company?.contact_email">| อีเมล: {{ company.contact_email }}</span></p>
        <p class="text-xs text-gray-900 font-bold mt-1" v-if="company?.tax_id">เลขประจำตัวผู้เสียภาษี: {{ company.tax_id }}</p>
      </div>
    </div>

    <!-- Info Section -->
    <div class="flex justify-between mb-8">
      <div class="w-[60%] border border-gray-200 p-4 rounded-xl space-y-2">
        <p class="text-sm font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">ข้อมูลลูกค้าผู้ซื้อ (Customer Info)</p>
        <template v-if="order?.tax_invoice_parsed">
          <p class="text-sm font-bold text-gray-900">{{ order.tax_invoice_parsed.company_name || getCustomerName(order) }}</p>
          <div class="flex gap-4 text-xs text-gray-700">
            <p v-if="order.tax_invoice_parsed.tax_id" class="font-bold">เลขประจำตัวผู้เสียภาษี: <span class="font-normal">{{ order.tax_invoice_parsed.tax_id }}</span></p>
            <p v-if="order.tax_invoice_parsed.branch" class="font-bold">สาขา: <span class="font-normal">{{ order.tax_invoice_parsed.branch }}</span></p>
          </div>
          <p class="text-xs text-gray-600 leading-relaxed mt-1" v-if="order.tax_invoice_parsed.address_line">
            {{ order.tax_invoice_parsed.address_line }}
            {{ order.tax_invoice_parsed.subdistrict ? `ต.${order.tax_invoice_parsed.subdistrict}` : '' }}
            {{ order.tax_invoice_parsed.district ? `อ.${order.tax_invoice_parsed.district}` : '' }}
            {{ order.tax_invoice_parsed.province ? `จ.${order.tax_invoice_parsed.province}` : '' }}
            {{ order.tax_invoice_parsed.postal_code || '' }}
          </p>
        </template>
        <template v-else>
          <p class="text-sm font-bold text-gray-900">{{ getCustomerName(order) }}</p>
          <p class="text-xs text-gray-500 italic">ไม่มีข้อมูลใบกำกับภาษีระบุโดยลูกค้า (ออกในนามบุคคลทั่วไป)</p>
        </template>
      </div>
      <div class="w-[35%] space-y-3">
        <div class="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
          <span class="text-gray-600 font-bold">เลขที่ / No:</span>
          <span class="font-bold text-gray-900">INV-{{ shortId(order?.id) }}</span>
        </div>
        <div class="flex justify-between text-sm p-2">
          <span class="text-gray-600 font-bold">วันที่ / Date:</span>
          <span class="text-gray-900 font-medium">{{ formatDate(order?.created_at) }}</span>
        </div>
        <div class="flex justify-between text-sm p-2">
          <span class="text-gray-600 font-bold">อ้างอิงออเดอร์:</span>
          <span class="text-gray-900 font-medium">#{{ shortId(order?.id) }}</span>
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <table class="w-full text-left border-collapse mb-8 border border-gray-300">
      <thead>
        <tr class="bg-gray-100 border-b border-gray-300">
          <th class="py-3 px-4 text-xs font-bold text-gray-800 uppercase w-12 text-center border-r border-gray-300">ลำดับ<br>(No)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-800 uppercase border-r border-gray-300">รายละเอียดสินค้า<br>(Description)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-800 uppercase text-center w-24 border-r border-gray-300">จำนวน<br>(Qty)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-800 uppercase text-right w-32 border-r border-gray-300">ราคา/หน่วย<br>(Unit Price)</th>
          <th class="py-3 px-4 text-xs font-bold text-gray-800 uppercase text-right w-32">จำนวนเงิน<br>(Amount)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in order?.items" :key="item.id" class="border-b border-gray-200">
          <td class="py-3 px-4 text-sm text-gray-700 text-center border-r border-gray-200">{{ index + 1 }}</td>
          <td class="py-3 px-4 text-sm font-medium text-gray-900 border-r border-gray-200">{{ item.product_name }}</td>
          <td class="py-3 px-4 text-sm text-gray-700 text-center border-r border-gray-200">{{ item.quantity }}</td>
          <td class="py-3 px-4 text-sm text-gray-700 text-right border-r border-gray-200">฿{{ formatPrice(item.price_at_purchase) }}</td>
          <td class="py-3 px-4 text-sm text-gray-900 text-right font-bold">฿{{ formatPrice(item.price_at_purchase * item.quantity) }}</td>
        </tr>
        <!-- Shipping Row -->
        <tr v-if="order?.shipping_cost > 0" class="border-b border-gray-200">
          <td class="py-3 px-4 text-sm text-gray-700 text-center border-r border-gray-200"></td>
          <td class="py-3 px-4 text-sm font-medium text-gray-900 border-r border-gray-200">ค่าบริการจัดส่ง</td>
          <td class="py-3 px-4 text-sm text-gray-700 text-center border-r border-gray-200">1</td>
          <td class="py-3 px-4 text-sm text-gray-700 text-right border-r border-gray-200">฿{{ formatPrice(order.shipping_cost) }}</td>
          <td class="py-3 px-4 text-sm text-gray-900 text-right font-bold">฿{{ formatPrice(order.shipping_cost) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="flex justify-end mb-12">
      <div class="w-1/2 rounded-xl border border-gray-200 overflow-hidden">
        <div class="flex justify-between text-sm py-2 px-4 border-b border-gray-100">
          <span class="text-gray-700">ยอดรวมก่อนภาษี (Amount Before VAT)</span>
          <span class="font-bold text-gray-900">฿{{ formatPrice(amountBeforeVat) }}</span>
        </div>
        <div class="flex justify-between text-sm py-2 px-4 border-b border-gray-100">
          <span class="text-gray-700">ภาษีมูลค่าเพิ่ม 7% (VAT 7%)</span>
          <span class="font-bold text-gray-900">฿{{ formatPrice(vatAmount) }}</span>
        </div>
        <div class="flex justify-between text-lg bg-gray-50 py-3 px-4">
          <span class="font-black text-gray-900">ยอดรวมทั้งสิ้น (Grand Total)</span>
          <span class="font-black text-gray-900">฿{{ formatPrice(order?.total_amount) }}</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="grid grid-cols-2 gap-10 mt-16 pt-8">
      <div class="text-center">
        <div class="border-b border-gray-400 w-48 mx-auto mb-2"></div>
        <p class="text-sm font-bold text-gray-800">ผู้รับสินค้า / บิล (Receiver)</p>
        <p class="text-xs text-gray-500 mt-1">วันที่ (Date) _____/_____/_____</p>
      </div>
      <div class="text-center">
        <div class="border-b border-gray-400 w-48 mx-auto mb-2"></div>
        <p class="text-sm font-bold text-gray-800">ผู้ออกเอกสาร (Authorized Signature)</p>
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
