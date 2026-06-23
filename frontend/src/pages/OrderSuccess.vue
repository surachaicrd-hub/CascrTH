<script setup>
import { ref, computed, onMounted } from 'vue'
import html2pdf from 'html2pdf.js'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../utils/apiFetch'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
import ReviewModal from '../components/ReviewModal.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { showToast } = useToast()
const { showConfirm } = useConfirm()

const orderId = route.params.id
const order = ref(null)
const loading = ref(true)
const uploading = ref(false)
const cancelling = ref(false)
const slipPreview = ref(null)
const slipFile = ref(null)

const isReviewModalOpen = ref(false)
const selectedProductForReview = ref(null)

const openReviewModal = (item) => {
  selectedProductForReview.value = {
    id: item.product_id,
    order_id: item.order_id,
    name: item.product_name,
    image_url: item.product_image
  }
  isReviewModalOpen.value = true
}

const handleReviewSubmitted = () => {
  if (order.value && order.value.items) {
    const item = order.value.items.find(i => i.product_id === selectedProductForReview.value?.id)
    if (item) item.is_reviewed = true
  }
}

const paymentLabel = computed(() => {
  if (!order.value) return ''
  const m = order.value.payment_method
  if (m === 'bank_transfer') return 'โอนเงินผ่านบัญชีธนาคาร'
  if (m === 'promptpay') return 'พร้อมเพย์ (PromptPay)'
  if (m === 'mobile_banking') return 'Mobile Banking'
  return m
})

const statusConfig = computed(() => {
  if (!order.value) return {}
  const s = order.value.payment_status
  if (s === 'cancelled') return { label: 'ยกเลิกแล้ว', color: 'red', desc: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว' }
  if (s === 'failed') return { label: 'ชำระเงินไม่สำเร็จ', color: 'red', desc: 'การชำระเงินถูกปฏิเสธหรือล้มเหลว' }
  if (s === 'reviewing') return { label: 'รอตรวจสอบ', color: 'blue', desc: 'ทีมงานจะตรวจสอบภายใน 1-2 ชั่วโมง' }
  if (s === 'paid') return { label: 'ชำระเงินแล้ว', color: 'emerald', desc: 'การชำระเงินได้รับการยืนยันแล้ว' }
  return { label: 'รอชำระเงิน', color: 'amber', desc: 'กรุณาชำระเงินและแนบหลักฐานด้านล่าง' }
})

const isTransferLike = computed(() => {
  if (!order.value) return false
  return ['bank_transfer', 'mobile_banking'].includes(order.value.payment_method)
})

const isPromptpay = computed(() => {
  return order.value?.payment_method === 'promptpay'
})

const subtotal = computed(() => {
  if (!order.value?.items) return 0
  return order.value.items.reduce((sum, item) => sum + (parseFloat(item.price_at_purchase) * item.quantity), 0)
})

const shippingCost = computed(() => {
  if (!order.value) return 0
  return parseFloat(order.value.shipping_cost) || 0
})

const discount = computed(() => {
  const diff = subtotal.value + shippingCost.value - parseFloat(order.value?.total_amount || 0)
  return diff > 0 ? diff : 0
})

const promptpayQrUrl = computed(() => {
  const num = settingsStore.paymentPromptpayNumber
  if (!num) return ''
  return `https://promptpay.io/${num}/${order.value?.total_amount || ''}`
})

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/orders/${orderId}`)
    const data = await res.json()
    if (data.success) {
      order.value = data.data
    }
  } catch (err) {
    console.error('Fetch order error:', err)
  } finally {
    loading.value = false
  }
}

const onSlipSelected = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    showToast('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)', 'error')
    return
  }
  slipFile.value = file
  slipPreview.value = URL.createObjectURL(file)
}

const uploadSlip = async () => {
  if (!slipFile.value) {
    showToast('กรุณาเลือกรูปหลักฐานการชำระเงิน', 'warning')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('slip', slipFile.value)

    const res = await fetch(`/api/orders/${orderId}/payment-slip`, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      showToast('ยืนยันการชำระเงินเรียบร้อยแล้ว!', 'success')
      order.value.payment_slip_url = data.slip_url
      order.value.payment_status = data.payment_status
      slipFile.value = null
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลด', 'error')
  } finally {
    uploading.value = false
  }
}

const cancelOrder = async () => {
  const confirmed = await showConfirm({
    title: 'ยกเลิกคำสั่งซื้อ',
    message: 'คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?<br/><span class="text-xs text-gray-400">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>',
    confirmText: 'ยืนยันยกเลิก',
    cancelText: 'ไม่ยกเลิก',
    type: 'danger'
  })
  if (!confirmed) return
  cancelling.value = true
  try {
    const res = await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PUT' })
    const data = await res.json()
    if (data.success) {
      showToast('ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว', 'success')
      order.value.payment_status = 'cancelled'
      order.value.order_status = 'cancelled'
    } else {
      showToast(data.error || 'ไม่สามารถยกเลิกได้', 'error')
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาด', 'error')
  } finally {
    cancelling.value = false
  }
}

const printOrder = async () => {
  const element = document.getElementById('print-document')
  if (!element) return

  // Show element temporarily for rendering
  element.classList.remove('hidden')
  
  const opt = {
    margin: [10, 10, 10, 10], // top, left, bottom, right
    filename: `Order-${order.value.id.split('-')[0].toUpperCase()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, windowWidth: 700 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  try {
    const worker = html2pdf().set(opt).from(element)
    await worker.save()
  } catch (err) {
    console.error('PDF Generation Error:', err)
    showToast('ไม่สามารถสร้างไฟล์เอกสารได้', 'error')
  } finally {
    // Hide back
    element.classList.add('hidden')
  }
}

onMounted(() => {
  window.scrollTo(0, 0)
  
  // Show toast if redirected back from iPay with an error
  if (route.query.error === 'payment_failed') {
      showToast('การชำระเงินผ่านบัตรเครดิตล้มเหลว กรุณาลองใหม่อีกครั้ง หรือเปลี่ยนวิธีชำระเงิน', 'error')
  } else if (route.query.error === 'user_cancelled') {
      showToast('คุณได้ยกเลิกการชำระเงิน', 'warning')
  }

  fetchOrder()
})
</script>

<template>
  <div class="bg-[#f8f9fa] dark:bg-[#0a0f16] min-h-screen transition-colors">
    <!-- UI Version (Hidden on Print) -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32 min-h-[70vh] print:hidden">

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
    </div>

    <div v-else-if="order" class="space-y-8">

      <!-- Header Section -->
      <div class="text-center mb-4">
        <div class="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5"
             :class="order.payment_status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
                      order.payment_status === 'reviewing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' :
                      'bg-amber-100 dark:bg-amber-900/30 text-amber-500'">
          <svg v-if="order.payment_status === 'paid'" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
          <svg v-else-if="order.payment_status === 'reviewing'" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <svg v-else class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <h1 class="text-2xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">สั่งซื้อสินค้าสำเร็จ!</h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm">ขอบคุณที่ไว้วางใจเลือกซื้อสินค้าและบริการจาก Morespace</p>
      </div>

      <!-- Status Badges -->
      <div class="flex justify-center flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              :class="{
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': order.payment_status === 'pending',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': order.payment_status === 'reviewing',
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': order.payment_status === 'paid',
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': order.payment_status === 'cancelled' || order.payment_status === 'failed'
              }">
          <span class="w-2 h-2 rounded-full" :class="{
            'bg-amber-500': order.payment_status === 'pending',
            'bg-blue-500': order.payment_status === 'reviewing',
            'bg-emerald-500': order.payment_status === 'paid',
            'bg-red-500': order.payment_status === 'cancelled' || order.payment_status === 'failed'
          }"></span>
          {{ statusConfig.label }}
        </span>
        <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
              :class="{
                'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400': order.order_status === 'pending',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': order.order_status === 'processing',
                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': order.order_status === 'shipped',
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': order.order_status === 'completed'
              }">
          <span class="w-2 h-2 rounded-full" :class="{
            'bg-gray-400': order.order_status === 'pending',
            'bg-blue-500': order.order_status === 'processing',
            'bg-purple-500': order.order_status === 'shipped',
            'bg-emerald-500': order.order_status === 'completed'
          }"></span>
          {{ order.order_status === 'completed' ? 'เสร็จสิ้น' : order.order_status === 'shipped' ? 'จัดส่งแล้ว' : order.order_status === 'processing' ? 'กำลังเตรียมจัดส่ง' : 'รอดำเนินการ' }}
        </span>
      </div>

      <!-- Order Detail Card -->
      <div class="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">

        <!-- Order Info Header -->
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">เลขคำสั่งซื้อ</p>
              <p class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm select-all">#{{ order.id.split('-')[0].toUpperCase() }}</p>
            </div>
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">วันที่สั่งซื้อ</p>
              <p class="font-bold text-gray-700 dark:text-gray-300 text-sm">{{ new Date(order.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ช่องทางชำระเงิน</p>
              <p class="font-bold text-gray-700 dark:text-gray-300 text-sm">{{ paymentLabel }}</p>
            </div>
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ยอดรวมสุทธิ</p>
              <p class="font-black text-emerald-600 dark:text-emerald-400 text-lg">฿{{ Number(order.total_amount).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Order Items List -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 class="font-bold text-gray-900 dark:text-white mb-4">รายการสินค้า ({{ order.items?.length || 0 }} รายการ)</h3>
          <div class="space-y-3">
            <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-3">
              <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shrink-0 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <img v-if="item.product_image" :src="item.product_image" :alt="item.product_name" class="w-full h-full object-cover absolute inset-0 z-0" />
                <svg v-else class="w-5 h-5 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-900 dark:text-white text-sm truncate">{{ item.product_name }}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">฿{{ Number(item.price_at_purchase).toLocaleString() }} × {{ item.quantity }} ชิ้น</p>
                <div v-if="settingsStore.showProductReview && (order.order_status === 'completed' || order.order_status === 'delivered')" class="mt-2 text-left print-hide">
                  <button v-if="!item.is_reviewed" @click.prevent="openReviewModal(item)" class="px-3 py-1 text-[11px] font-bold border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-block">
                    เขียนรีวิวสินค้า
                  </button>
                  <span v-else class="px-3 py-1 text-[11px] font-bold border border-gray-300 text-gray-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-lg inline-block cursor-not-allowed">
                    รีวิวแล้ว
                  </span>
                </div>
              </div>
              <p class="font-bold text-gray-900 dark:text-white text-sm shrink-0">฿{{ Number(item.price_at_purchase * item.quantity).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Price Summary -->
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div class="max-w-sm ml-auto space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">ยอดรวมสินค้า</span>
              <span class="font-bold text-gray-700 dark:text-gray-300">฿{{ subtotal.toLocaleString() }}</span>
            </div>
            <div v-if="discount > 0" class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">ส่วนลด</span>
              <span class="font-bold text-red-500">-฿{{ discount.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">ค่าจัดส่ง</span>
              <span class="font-bold" :class="shippingCost > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-emerald-600 dark:text-emerald-400'">
                {{ shippingCost > 0 ? '฿' + shippingCost.toLocaleString() : 'ฟรี' }}
              </span>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
              <span class="font-bold text-gray-900 dark:text-white">ยอดรวมสุทธิ</span>
              <span class="font-black text-emerald-600 dark:text-emerald-400 text-xl">฿{{ Number(order.total_amount).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Shipping & Tax Info -->
        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Shipping Address -->
          <div v-if="order.shipping_address">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <h4 class="font-bold text-gray-900 dark:text-white text-sm">ที่อยู่จัดส่ง</h4>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3">
              <p class="font-bold text-gray-800 dark:text-gray-200 mb-1">{{ order.shipping_address.first_name }} {{ order.shipping_address.last_name }}</p>
              <p v-if="order.shipping_address.phone" class="mb-1 flex items-center gap-1.5"><svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> {{ order.shipping_address.phone }}</p>
              <p>{{ order.shipping_address.address_line }}
                <template v-if="order.shipping_address.subdistrict"> ต.{{ order.shipping_address.subdistrict }}</template>
                <template v-if="order.shipping_address.district"> อ.{{ order.shipping_address.district }}</template>
                <template v-if="order.shipping_address.province"> จ.{{ order.shipping_address.province }}</template>
                <template v-if="order.shipping_address.postal_code"> {{ order.shipping_address.postal_code }}</template>
              </p>
            </div>
          </div>

          <!-- Tax Invoice -->
          <div v-if="order.tax_invoice">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <h4 class="font-bold text-gray-900 dark:text-white text-sm">ข้อมูลใบกำกับภาษี</h4>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3">
              <p v-if="order.tax_invoice.company_name" class="font-bold text-gray-800 dark:text-gray-200 mb-1">{{ order.tax_invoice.company_name }}</p>
              <p v-if="order.tax_invoice.tax_id" class="mb-1">เลขที่ผู้เสียภาษี: {{ order.tax_invoice.tax_id }}</p>
              <p v-if="order.tax_invoice.branch" class="mb-1">สาขา: {{ order.tax_invoice.branch }}</p>
              <p>{{ order.tax_invoice.address_line }}
                <template v-if="order.tax_invoice.subdistrict"> ต.{{ order.tax_invoice.subdistrict }}</template>
                <template v-if="order.tax_invoice.district"> อ.{{ order.tax_invoice.district }}</template>
                <template v-if="order.tax_invoice.province"> จ.{{ order.tax_invoice.province }}</template>
                <template v-if="order.tax_invoice.postal_code"> {{ order.tax_invoice.postal_code }}</template>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Section: Bank Transfer / Mobile Banking -->
      <div v-if="isTransferLike && order.payment_status === 'pending'" class="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">กรุณาโอนเงินเข้าบัญชีดังต่อไปนี้</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">เลือกบัญชีใดบัญชีหนึ่งเพื่อทำการโอน</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="(bank, i) in settingsStore.paymentBankAccounts" :key="i"
               class="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <img v-if="bank.logo" :src="bank.logo" :alt="bank.bankName" class="w-10 h-10 rounded-lg object-contain bg-white p-1">
            <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600" v-else>
              {{ (bank.bankName || 'BANK').substring(0, 3).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-gray-900 dark:text-white text-sm truncate">{{ bank.name || bank.accountName }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ bank.bankName }}</p>
              <p class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 select-all">{{ bank.number || bank.accountNumber }}</p>
            </div>
          </div>
        </div>

        <div class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4 text-center">
          <p class="text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center gap-1.5"><svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg> ยอดที่ต้องโอน: ฿{{ Number(order.total_amount).toLocaleString() }}</p>
        </div>
      </div>

      <!-- Payment Section: PromptPay -->
      <div v-if="isPromptpay && order.payment_status === 'pending'" class="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">สแกน QR Code เพื่อชำระเงินผ่านพร้อมเพย์</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">เปิดแอปธนาคารของคุณแล้วสแกน QR Code ด้านล่าง</p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-4">
          <div class="bg-white border-2 border-gray-200 rounded-2xl p-4 inline-block">
            <img v-if="promptpayQrUrl" :src="promptpayQrUrl" alt="PromptPay QR Code" class="w-48 h-48 object-contain mx-auto">
            <div v-else class="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">ไม่พบเลข PromptPay</div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">หมายเลข PromptPay: <span class="font-mono font-bold text-gray-700 dark:text-gray-300 select-all">{{ settingsStore.paymentPromptpayNumber }}</span></p>
          <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 rounded-2xl p-4 text-center w-full">
            <p class="text-blue-700 dark:text-blue-400 font-bold text-sm flex items-center gap-1.5"><svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg> ยอดที่ต้องชำระ: ฿{{ Number(order.total_amount).toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- Upload Payment Slip Section -->
      <div v-if="order.payment_status === 'pending'" class="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">แนบหลักฐานการชำระเงิน</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">ถ่ายรูปหรือแคปหน้าจอสลิปแล้วอัปโหลดด้านล่าง</p>
          </div>
        </div>

        <!-- Upload Area -->
        <label class="block cursor-pointer">
          <div v-if="!slipPreview" class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
            <svg class="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            <p class="text-gray-600 dark:text-gray-400 font-bold text-sm mb-1">คลิกเพื่อเลือกรูปสลิป</p>
            <p class="text-xs text-gray-400">PNG, JPG, WEBP (สูงสุด 5MB)</p>
          </div>
          <div v-else class="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img :src="slipPreview" alt="Payment slip preview" class="w-full max-h-80 object-contain bg-gray-50 dark:bg-gray-800">
            <div class="absolute top-3 right-3">
              <button @click.prevent="slipPreview = null; slipFile = null" class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <input type="file" accept="image/*" class="hidden" @change="onSlipSelected">
        </label>

        <button @click="uploadSlip" :disabled="!slipFile || uploading"
                class="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 disabled:shadow-none">
          <svg v-if="uploading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ uploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน' }}
        </button>
      </div>

      <!-- Reviewing State -->
      <div v-if="order.payment_status === 'reviewing'" class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 rounded-3xl p-6 shadow-sm space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-blue-800 dark:text-blue-300">ได้รับหลักฐานแล้ว กำลังตรวจสอบ</h3>
            <p class="text-blue-700/80 dark:text-blue-400/80 text-sm mt-1">ทีมงานจะตรวจสอบการชำระเงินของคุณและดำเนินการเสร็จสิ้นภายใน <strong>1-2 ชั่วโมง</strong> ในช่วงเวลาทำการ (09:00 - 18:00)</p>
          </div>
        </div>
        <!-- Display uploaded slip -->
        <div v-if="order.payment_slip_url" class="rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-700/30 bg-white dark:bg-gray-900/30">
          <p class="text-xs font-bold text-blue-600 dark:text-blue-400 px-4 pt-3 pb-1 uppercase tracking-wider">หลักฐานที่แนบไว้</p>
          <img :src="order.payment_slip_url" alt="Payment slip" class="w-full max-h-64 object-contain p-2">
        </div>
      </div>

      <!-- Paid State -->
      <div v-if="order.payment_status === 'paid'" class="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-700/30 rounded-3xl p-6 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-emerald-800 dark:text-emerald-300">ชำระเงินสำเร็จ!</h3>
            <p class="text-emerald-700/80 dark:text-emerald-400/80 text-sm mt-1">การชำระเงินได้รับการยืนยันเรียบร้อยแล้ว ทีมงานจะดำเนินการจัดส่งสินค้าให้โดยเร็วที่สุด</p>
          </div>
        </div>
      </div>

      <!-- Cancelled State -->
      <div v-if="order.payment_status === 'cancelled'" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/30 rounded-3xl p-6 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-red-800 dark:text-red-300">คำสั่งซื้อถูกยกเลิกแล้ว</h3>
            <p class="text-red-700/80 dark:text-red-400/80 text-sm mt-1">คำสั่งซื้อนี้ถูกยกเลิกแล้ว หากต้องการสั่งซื้อใหม่ กรุณาเลือกสินค้าและดำเนินการอีกครั้ง</p>
          </div>
        </div>
      </div>

      <!-- Failed State -->
      <div v-if="order.payment_status === 'failed'" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/30 rounded-3xl p-6 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-red-800 dark:text-red-300">การชำระเงินไม่สำเร็จ</h3>
            <p class="text-red-700/80 dark:text-red-400/80 text-sm mt-1">เกิดข้อผิดพลาดในการตัดบัตรหรือการชำระเงินถูกปฏิเสธ กรุณาติดต่อแอดมินหรือทำการสั่งซื้อใหม่อีกครั้ง</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap justify-center gap-3 pt-6 print-hide">
        <button @click="printOrder" class="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/30 whitespace-nowrap">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          ดาวน์โหลดใบเสร็จ (PDF)
        </button>
        <router-link to="/products" class="inline-flex items-center justify-center bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-bold py-3 px-6 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap">
          เลือกซื้อสินค้าเพิ่ม
        </router-link>
        <router-link to="/profile?tab=orders" class="inline-flex items-center justify-center bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-sm whitespace-nowrap">
          ดูประวัติคำสั่งซื้อ
        </router-link>
        <button v-if="order.payment_status === 'pending'" @click="cancelOrder" :disabled="cancelling"
                class="inline-flex items-center justify-center bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-3 px-6 rounded-2xl border border-red-200 dark:border-red-700 transition-all hover:-translate-y-0.5 hover:shadow-sm whitespace-nowrap">
          {{ cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกคำสั่งซื้อ' }}
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-20">
      <div class="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">ไม่พบคำสั่งซื้อ</h2>
      <p class="text-gray-500 mb-6">กรุณาตรวจสอบหมายเลขคำสั่งซื้อของคุณอีกครั้ง</p>
      <router-link to="/" class="text-emerald-600 hover:text-emerald-700 font-bold">กลับไปหน้าแรก</router-link>
    </div>

    </div>
    <!-- End UI Version -->

    <!-- Formal PDF Template (Hidden from screen, used for html2pdf generation) -->
    <div v-if="order" id="print-document" class="hidden w-[700px] bg-white text-black p-8 font-sans mx-auto" style="line-height: 1.5; font-size: 14px;">
      <!-- Header Section -->
      <div class="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-800">
        <div>
           <div class="flex items-center gap-2 mb-2">
             <template v-if="settingsStore.storeLogo">
               <img :src="settingsStore.storeLogo" alt="Store Logo" class="h-12 w-auto object-contain" />
             </template>
             <template v-else>
               <svg class="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               <h1 class="text-3xl font-black tracking-tighter">{{ settingsStore.storeName || 'MORESPACE' }}</h1>
             </template>
           </div>
           
           <p v-if="settingsStore.storeAddress" class="text-sm mt-3">{{ settingsStore.storeAddress }}</p>
           <p v-else class="text-sm mt-3">บริการออกแบบ และติดตั้งพื้นที่จัดเก็บ</p>
           
           <div class="text-sm mt-1">
             <template v-if="settingsStore.storePhone">โทร: {{ settingsStore.storePhone }} | </template>
             <template v-if="settingsStore.storeTaxId">เลขประจำตัวผู้เสียภาษี: {{ settingsStore.storeTaxId }}</template>
           </div>
        </div>
        <div class="text-right">
           <h2 class="text-3xl font-bold mb-2 uppercase">{{ order.payment_status === 'paid' ? 'ใบเสร็จรับเงิน' : 'ใบสั่งซื้อ/ข้อเสนอ' }}</h2>
           <p class="text-sm"><span class="font-bold">เลขที่เอกสาร:</span> #{{ order.id.split('-')[0].toUpperCase() }}</p>
           <p class="text-sm"><span class="font-bold">วันที่:</span> {{ new Date(order.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) }}</p>
           <p class="text-sm"><span class="font-bold">สถานะชำระเงิน:</span> {{ paymentLabel }} ({{ statusConfig.label }})</p>
        </div>
      </div>

      <!-- Customer Section -->
      <div class="flex gap-12 mb-8">
        <div class="flex-1">
           <h3 class="font-bold text-lg border-b border-gray-300 mb-2 pb-1">ข้อมูลลูกค้า (Customer Info)</h3>
           <p class="font-bold mb-1">{{ order.shipping_address?.first_name }} {{ order.shipping_address?.last_name }}</p>
           <p class="text-sm">{{ order.shipping_address?.address_line }}</p>
           <p class="text-sm">
             <template v-if="order.shipping_address?.subdistrict">ต.{{ order.shipping_address.subdistrict }} </template>
             <template v-if="order.shipping_address?.district">อ.{{ order.shipping_address.district }} </template>
             <template v-if="order.shipping_address?.province">จ.{{ order.shipping_address.province }} </template>
             <template v-if="order.shipping_address?.postal_code">{{ order.shipping_address.postal_code }}</template>
           </p>
           <p class="text-sm mt-1 pb-2">โทร: <span class="font-mono">{{ order.shipping_address?.phone || '-' }}</span></p>
        </div>

        <div v-if="order.tax_invoice" class="flex-1">
           <h3 class="font-bold text-lg border-b border-gray-300 mb-2 pb-1">ข้อมูลใบกำกับภาษี (Tax Info)</h3>
           <p class="font-bold mb-1">{{ order.tax_invoice.company_name }}</p>
           <p class="text-sm">เลขประจำตัวผู้เสียภาษี: <span class="font-mono">{{ order.tax_invoice.tax_id }}</span></p>
           <p class="text-sm">สาขา: {{ order.tax_invoice.branch || 'สำนักงานใหญ่' }}</p>
           <p class="text-sm truncate">{{ order.tax_invoice.address_line }} {{ order.tax_invoice.province }} {{ order.tax_invoice.postal_code }}</p>
        </div>
      </div>

      <!-- Table Section -->
      <table class="w-full mb-8 border-collapse">
        <thead>
          <tr class="bg-gray-100 border-y border-gray-800 text-black">
            <th class="py-3 px-4 text-left font-bold w-12">#</th>
            <th class="py-3 px-4 text-left font-bold w-16">รูปภาพ<br/><span class="text-xs">(Image)</span></th>
            <th class="py-3 px-4 text-left font-bold">รายการสินค้า (Description)</th>
            <th class="py-3 px-4 text-center font-bold w-24">จำนวน<br/><span class="text-xs">(Qty)</span></th>
            <th class="py-3 px-4 text-right font-bold w-32">ราคาต่อหน่วย<br/><span class="text-xs">(Unit Price)</span></th>
            <th class="py-3 px-4 text-right font-bold w-32">จำนวนเงิน<br/><span class="text-xs">(Amount)</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in order.items" :key="item.id" class="border-b border-gray-200">
            <td class="py-3 px-4">{{ index + 1 }}</td>
            <td class="py-3 px-4">
               <img v-if="item.product_image" :src="item.product_image" class="w-12 h-12 object-cover rounded-md border border-gray-200" />
               <div v-else class="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs">ภาพ</div>
            </td>
            <td class="py-3 px-4">
               <div class="font-bold">{{ item.product_name }}</div>
            </td>
            <td class="py-3 px-4 text-center font-mono">{{ item.quantity }}</td>
            <td class="py-3 px-4 text-right font-mono">{{ Number(item.price_at_purchase).toLocaleString() }}</td>
            <td class="py-3 px-4 text-right font-mono">{{ Number(item.price_at_purchase * item.quantity).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="flex justify-end mb-12">
        <div class="w-72 space-y-2">
          <div class="flex justify-between text-sm">
            <span>รวมเป็นเงิน (Subtotal)</span>
            <span class="font-mono">{{ subtotal.toLocaleString() }}</span>
          </div>
          <div v-if="discount > 0" class="flex justify-between text-sm">
            <span>ส่วนลด (Discount)</span>
            <span class="font-mono">-{{ discount.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>ค่าจัดส่ง (Shipping)</span>
            <span class="font-mono">{{ shippingCost > 0 ? shippingCost.toLocaleString() : '0.00' }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2 mt-2">
            <span>จำนวนเงินรวมสุทธิ (Total)</span>
            <span class="font-mono">฿ {{ Number(order.total_amount).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Signatures Section -->
      <div class="grid grid-cols-2 gap-16 mt-20 text-center">
        <div>
          <div class="border-b border-gray-400 w-48 mx-auto mb-2"></div>
          <p class="font-bold">ผู้รับเงิน / ผู้เสนอราคา</p>
          <p class="text-sm mt-1 text-gray-600">วันที่ ..........................................</p>
        </div>
        <div>
          <div class="border-b border-gray-400 w-48 mx-auto mb-2"></div>
          <p class="font-bold">ผู้รับสินค้า / ผู้ว่าจ้าง</p>
          <p class="text-sm mt-1 text-gray-600">วันที่ ..........................................</p>
        </div>
      </div>

      <div class="text-center mt-12 text-sm text-gray-500 border-t border-gray-200 pt-4">
        เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์
      </div>
    </div>
    
    <ReviewModal
      v-if="selectedProductForReview"
      :isOpen="isReviewModalOpen"
      :product="selectedProductForReview"
      @close="isReviewModalOpen = false"
      @review-submitted="handleReviewSubmitted"
    />
  </div>
</template>

<style scoped>
@media print {
  /* Hide non-printable elements */
  .print-hide,
  nav,
  footer,
  header {
    display: none !important;
  }

  /* Reset page styles */
  * {
    color: #000 !important;
    background: #fff !important;
    border-color: #ccc !important;
    box-shadow: none !important;
    text-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Container */
  .max-w-3xl {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Remove rounded corners and shadows for print */
  [class*="rounded"] {
    border-radius: 4px !important;
  }

  /* Ensure text is legible */
  body {
    font-size: 12pt !important;
    line-height: 1.5 !important;
  }

  /* Force status badge colors to print */
  .bg-amber-100 { background-color: #fef3c7 !important; }
  .bg-blue-100 { background-color: #dbeafe !important; }
  .bg-emerald-100 { background-color: #d1fae5 !important; }
  .bg-red-100 { background-color: #fee2e2 !important; }
  .text-amber-700 { color: #b45309 !important; }
  .text-blue-700 { color: #1d4ed8 !important; }
  .text-emerald-700 { color: #047857 !important; }
  .text-red-700 { color: #b91c1c !important; }
  .text-emerald-600 { color: #059669 !important; }
  .text-red-500 { color: #ef4444 !important; }
  .font-bold { font-weight: 700 !important; }
  .font-black { font-weight: 900 !important; }

  /* Table Styles */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }
  th {
    background-color: #f3f4f6 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  th, td {
    border: 1px solid #e5e7eb !important;
    padding: 0.5rem 1rem !important;
  }
  .border-y {
    border-top: 2px solid #000 !important;
    border-bottom: 2px solid #000 !important;
  }
  .border-b-2 {
    border-bottom: 2px solid #000 !important;
  }

  /* Page margin */
  @page {
    margin: 1.5cm;
    size: A4;
  }
}
</style>
