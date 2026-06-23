<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PrintReceipt from '../../components/admin/print/PrintReceipt.vue'
import PrintTaxInvoice from '../../components/admin/print/PrintTaxInvoice.vue'
import PrintShippingLabel from '../../components/admin/print/PrintShippingLabel.vue'

const route = useRoute()
const orderId = route.params.id
const docType = route.params.docType // 'receipt', 'tax_invoice', 'shipping_label'

const order = ref(null)
const companySettings = ref({})
const loading = ref(true)
const error = ref('')

const token = () => localStorage.getItem('adminToken')
const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` })

const fetchData = async () => {
  loading.value = true
  try {
    const [orderRes, companyRes] = await Promise.all([
      fetch(`/api/orders/${orderId}`, { headers: authHeaders() }),
      fetch('/api/orders/admin/company-settings', { headers: authHeaders() })
    ])

    const orderData = await orderRes.json()
    const companyData = await companyRes.json()

    const o = orderData.order || orderData.data || orderData
    if (o && o.id) {
      if (o.shipping_address && typeof o.shipping_address === 'string') try { o.shipping_address_parsed = JSON.parse(o.shipping_address) } catch(e) {}
      if (o.tax_invoice && typeof o.tax_invoice === 'string') try { o.tax_invoice_parsed = JSON.parse(o.tax_invoice) } catch(e) {}
      order.value = o
    } else {
      error.value = 'ไม่พบข้อมูลคำสั่งซื้อ'
    }

    companySettings.value = companyData.data || {}

    // Trigger print
    if (order.value) {
      setTimeout(() => {
        window.print()
      }, 500)
    }

  } catch(e) {
    error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!token()) {
    error.value = 'กรุณาเข้าสู่ระบบผู้ดูแลระบบ'
    loading.value = false
    return
  }
  fetchData()
})

const getDocTitle = () => {
  if (docType === 'receipt') return 'พิมพ์ใบเสร็จรับเงิน'
  if (docType === 'tax_invoice') return 'พิมพ์ใบกำกับภาษี'
  if (docType === 'shipping_label') return 'พิมพ์ใบปะหน้าพัสดุ'
  return 'พิมพ์เอกสาร'
}
</script>

<template>
  <div class="print-container bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex justify-center items-center">
    
    <div v-if="loading" class="text-center print:hidden">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-600 font-bold">กำลังโหลดเอกสาร...</p>
    </div>

    <div v-else-if="error" class="text-center bg-white p-8 rounded-2xl shadow-sm print:hidden">
      <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">โหลดข้อมูลไม่สำเร็จ</h2>
      <p class="text-gray-500 mb-6">{{ error }}</p>
      <button @click="window.close()" class="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">ปิดหน้าต่างนี้</button>
    </div>

    <div v-else class="w-full">
      <div class="mb-4 text-center print:hidden space-x-4">
         <button @click="window.print()" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors inline-flex items-center gap-2">
           <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
           กดเพื่อพิมพ์อีกครั้ง
         </button>
         <button @click="window.close()" class="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold shadow-sm transition-colors">
           ปิดหน้าต่าง
         </button>
      </div>
      
      <PrintReceipt v-if="docType === 'receipt'" :order="order" :company="companySettings" />
      <PrintTaxInvoice v-else-if="docType === 'tax_invoice'" :order="order" :company="companySettings" />
      <PrintShippingLabel v-else-if="docType === 'shipping_label'" :order="order" :company="companySettings" />
      
      <div v-else class="text-center print:hidden">
        <p class="text-red-500 font-bold">ประเภทเอกสารไม่ถูกต้อง</p>
      </div>
    </div>
  </div>
</template>

<style>
/* Global print styles to hide everything except our print container */
@media print {
  body { margin: 0; padding: 0; background: white; }
  #app { display: block !important; }
}
</style>
