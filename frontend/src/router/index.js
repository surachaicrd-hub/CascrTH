import { createRouter, createWebHistory } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'

const routes = [
    {
        path: '/',
        component: () => import('../pages/Home.vue'),
        meta: { title: 'STORAGE HOUSE - บ้านเก็บของและโรงเรือนสำเร็จรูประดับพรีเมียม', description: 'STORAGE HOUSE โดยบริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด จำหน่ายและติดตั้งบ้านเก็บของ โรงเรือน และโกดังสำเร็จรูปคุณภาพสูง รับประกัน 10 ปี' }
    },
    {
        path: '/products',
        component: () => import('../pages/Products.vue'),
        meta: { title: 'แคตตาล็อกสินค้า - STORAGE HOUSE บ้านเก็บของพรีเมียม', description: 'เลือกชมแคตตาล็อกสินค้ามากกว่า 100 รายการ ทั้งบ้านเก็บของ PP/HDPE, โรงจอดรถ และโรงเรือนเพาะปลูก' }
    },
    {
        path: '/products/category/:category',
        component: () => import('../pages/Products.vue'),
        meta: { title: 'สินค้าหมวดหมู่ - STORAGE HOUSE', description: 'สินค้าในหมวดหมู่ที่เลือก - STORAGE HOUSE บ้านเก็บของและโรงเรือนพรีเมียม' }
    },
    {
        path: '/products/:id',
        component: () => import('../pages/ProductDetail.vue'),
        meta: { title: 'รายละเอียดสินค้า - STORAGE HOUSE', description: 'ข้อมูลรายละเอียด สเปค และราคาของสินค้า โครงสร้างเหล็กแข็งแรงทนทาน' }
    },
    {
        path: '/services',
        component: () => import('../pages/Services.vue'),
        meta: { title: 'บริการของเรา - STORAGE HOUSE ผู้เชี่ยวชาญด้านงานติดตั้ง', description: 'บริการให้คำปรึกษา ประเมินหน้างาน และติดตั้งบ้านเก็บของอย่างมืออาชีพโดยวิศวกรและช่างผู้ชำนาญการ' }
    },
    {
        path: '/projects',
        component: () => import('../pages/Projects.vue'),
        meta: { title: 'แฟ้มผลงาน - STORAGE HOUSE', description: 'ชมผลงานการติดตั้งจริงของ STORAGE HOUSE ทั่วประเทศ สร้างความมั่นใจด้วยมาตรฐานระดับสากล' }
    },
    {
        path: '/projects/:slug',
        component: () => import('../pages/ProjectDetail.vue'),
        meta: { title: 'รายละเอียดผลงาน - STORAGE HOUSE' }
    },
    {
        path: '/installation-guide',
        component: () => import('../pages/InstallationGuide.vue'),
        meta: { title: 'คู่มือการเตรียมพื้นที่และติดตั้ง - STORAGE HOUSE', description: 'คลิปวิดีโอคู่มือและข้อมูลการเตรียมพื้นที่หน้างานก่อนการติดตั้งบ้านเก็บของหรือโรงเรือน' }
    },
    {
        path: '/payment-methods',
        component: () => import('../pages/PaymentGuide.vue'),
        meta: { title: 'วิธีการสั่งซื้อและชำระเงิน - STORAGE HOUSE', description: 'ขั้นตอนการสั่งซื้อสินค้า ช่องทางการชำระเงิน และนโยบายทางการเงิน' }
    },
    {
        path: '/about',
        component: () => import('../pages/About.vue'),
        meta: { title: 'เกี่ยวกับเรา - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด', description: 'ทำความรู้จักกับบริษัท ซีอาร์ ดิสทริบิวชั่น ผู้เชี่ยวชาญด้านสินค้านำเข้าอุตสาหกรรมด้วยประสบการณ์กว่า 20 ปี' }
    },
    {
        path: '/ai-consultant',
        component: () => import('../pages/AIConsultant.vue'),
        meta: { title: 'AI ผู้ช่วยส่วนตัว - วิเคราะห์งบประมาณและพื้นที่', description: 'ทดลองใช้ AI Consultant ของ STORAGE HOUSE เพื่อช่วยคำนวณพื้นที่และประเมินงบประมาณของคุณ ฟรี' }
    },
    {
        path: '/verify-email',
        component: () => import('../pages/VerifyEmail.vue'),
        meta: { title: 'ยืนยันอีเมลของคุณ - STORAGE HOUSE', description: 'ยืนยันตัวตนเพื่อเข้าถึงสิทธิประโยชน์จาก STORAGE HOUSE แบบเต็มรูปแบบ' }
    },
    {
        path: '/auth/line/callback',
        component: () => import('../pages/LineCallback.vue'),
        meta: { title: 'กำลังเข้าสู่ระบบ - STORAGE HOUSE' }
    },
    {
        path: '/forgot-password',
        component: () => import('../pages/ForgotPassword.vue'),
        meta: { title: 'ลืมรหัสผ่าน - STORAGE HOUSE', description: 'ขอลิงก์รีเซ็ตรหัสผ่านผ่านอีเมล' }
    },
    {
        path: '/reset-password',
        component: () => import('../pages/ResetPassword.vue'),
        meta: { title: 'ตั้งรหัสผ่านใหม่ - STORAGE HOUSE', description: 'ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ' }
    },
    {
        path: '/quotation',
        component: () => import('../pages/Quotation.vue'),
        meta: { title: 'ขอใบเสนอราคา - STORAGE HOUSE', description: 'กรอกแบบฟอร์มเพื่อขอรับใบเสนอราคาบ้านเก็บของ หรือนัดหมายช่างประเมินหน้างาน' }
    },
    {
        path: '/contact',
        component: () => import('../pages/Contact.vue'),
        meta: { title: 'ติดต่อเรา - STORAGE HOUSE', description: 'ช่องทางการติดต่อ STORAGE HOUSE ที่อยู่สำนักงาน อีเมล เบอร์โทรศัพท์ และ Line Official' }
    },
    {
        path: '/profile',
        component: () => import('../pages/Profile.vue'),
        meta: { title: 'บัญชีของฉัน - STORAGE HOUSE' }
    },
    {
        path: '/cart',
        component: () => import('../pages/Cart.vue'),
        meta: { title: 'ตะกร้าสินค้า - STORAGE HOUSE', description: 'ตรวจสอบรายการสินค้าและดำเนินการสั่งซื้อ STORAGE HOUSE' }
    },
    {
        path: '/checkout',
        component: () => import('../pages/Checkout.vue'),
        meta: { title: 'ชำระเงิน - STORAGE HOUSE', description: 'ดำเนินการชำระเงินและกรอกข้อมูลจัดส่ง' }
    },
    {
        path: '/order-success/:id',
        component: () => import('../pages/OrderSuccess.vue'),
        meta: { title: 'สั่งซื้อสำเร็จ - STORAGE HOUSE' }
    },
    {
        path: '/recently-viewed',
        component: () => import('../pages/RecentlyViewedPage.vue'),
        meta: { title: 'ประวัติการดูสินค้า - STORAGE HOUSE', description: 'ประวัติสินค้าที่คุณเคยดู' }
    },
    {
        path: '/compare',
        component: () => import('../pages/Compare.vue'),
        meta: { title: 'เปรียบเทียบสินค้า - STORAGE HOUSE', description: 'เปรียบเทียบคุณสมบัติและราคาของสินค้าแบบ side-by-side' }
    },
    {
        path: '/space-calculator',
        component: () => import('../pages/SpaceCalculator.vue'),
        meta: { title: 'ประเมินพื้นที่และราคา - STORAGE HOUSE', description: 'เครื่องมือคำนวณขนาดพื้นที่ แนะนำสินค้าที่เหมาะสมพร้อมประเมินราคา' }
    },

    // Legal & Utilities
    {
        path: '/privacy-policy',
        component: () => import('../pages/PrivacyPolicy.vue'),
        meta: { title: 'นโยบายความเป็นส่วนตัว - STORAGE HOUSE', description: 'รายละเอียดนโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของบริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }
    },
    {
        path: '/terms',
        component: () => import('../pages/TermsOfService.vue'),
        meta: { title: 'เงื่อนไขการให้บริการ - STORAGE HOUSE', description: 'ข้อกำหนดและเงื่อนไขการใช้งานแพลตฟอร์ม STORAGE HOUSE รวมถึงนโยบายการรับประกันสินค้า' }
    },
    {
        path: '/cookie-policy',
        component: () => import('../pages/CookiePolicy.vue'),
        meta: { title: 'นโยบายการใช้คุกกี้ - STORAGE HOUSE', description: 'รายละเอียดนโยบายการใช้คุกกี้ (Cookie Policy) ของเว็บไซต์ STORAGE HOUSE' }
    },
    {
        path: '/warranty',
        component: () => import('../pages/WarrantyPolicy.vue'),
        meta: { title: 'นโยบายการรับประกัน - STORAGE HOUSE', description: 'เงื่อนไขการรับประกันและข้อยกเว้นสำหรับสินค้าและบริการก่อสร้างโกดังของ STORAGE HOUSE' }
    },
    {
        path: '/blog',
        component: () => import('../pages/Blog.vue'),
        meta: { title: 'บทความและความรู้ - STORAGE HOUSE', description: 'บทความให้ความรู้เกี่ยวกับบ้านเก็บของ โรงเรือน การดูแลรักษา และเคล็ดลับจัดพื้นที่' }
    },
    {
        path: '/blog/:slug',
        component: () => import('../pages/BlogDetail.vue'),
        meta: { title: 'บทความ - STORAGE HOUSE' }
    },
    {
        path: '/maintenance',
        component: () => import('../pages/Maintenance.vue'),
        meta: { title: 'ปิดปรับปรุงระบบชั่วคราว - STORAGE HOUSE', isMaintenancePage: true }
    },
    {
        path: '/error',
        component: () => import('../pages/ServerError.vue'),
        meta: { title: 'เกิดข้อผิดพลาด - STORAGE HOUSE' }
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import('../pages/NotFound.vue'),
        meta: { title: '404 ไม่พบหน้าเว็บ - STORAGE HOUSE' }
    },
    {
        path: '/admin/login',
        component: () => import('../pages/admin/Login.vue'),
        meta: { title: 'เข้าสู่ระบบ - STORAGE HOUSE Admin' }
    },
    {
        path: '/admin/orders/:id/print/:docType',
        component: () => import('../pages/admin/PrintDocument.vue'),
        meta: { title: 'พิมพ์เอกสาร - Admin' }
    },
    {
        path: '/admin',
        component: () => import('../pages/admin/AdminLayout.vue'),
        meta: { title: 'ระบบจัดการส่วนหลังบ้าน - STORAGE HOUSE' },
        children: [
            { path: '', component: () => import('../pages/admin/Dashboard.vue'), meta: { title: 'Dashboard - Admin' } },
            { path: 'analytics', component: () => import('../pages/admin/AnalyticsAdmin.vue'), meta: { title: 'Analytics - Admin' } },
            { path: 'homepage', component: () => import('../pages/admin/HomeAdmin.vue'), meta: { title: 'จัดการหน้าหลัก - Admin' } },
            { path: 'products', component: () => import('../pages/admin/ProductsAdmin.vue'), meta: { title: 'จัดการสินค้า - Admin' } },
            { path: 'products/new', component: () => import('../pages/admin/ProductFormAdmin.vue'), meta: { title: 'เพิ่มสินค้า - Admin' } },
            { path: 'products/:id/edit', component: () => import('../pages/admin/ProductFormAdmin.vue'), meta: { title: 'แก้ไขสินค้า - Admin' } },
            { path: 'categories', component: () => import('../pages/admin/CategoriesAdmin.vue'), meta: { title: 'จัดการหมวดหมู่ - Admin' } },
            { path: 'categories/new', component: () => import('../pages/admin/CategoryFormAdmin.vue'), meta: { title: 'เพิ่มหมวดหมู่ - Admin' } },
            { path: 'categories/:id/edit', component: () => import('../pages/admin/CategoryFormAdmin.vue'), meta: { title: 'แก้ไขหมวดหมู่ - Admin' } },
            { path: 'leads', component: () => import('../pages/admin/LeadsAdmin.vue'), meta: { title: 'ระบบหลังบ้าน Leads - Admin' } },
            { path: 'orders', component: () => import('../pages/admin/OrdersAdmin.vue'), meta: { title: 'จัดการคำสั่งซื้อ - Admin' } },
            { path: 'orders/:id', component: () => import('../pages/admin/OrderDetailAdmin.vue'), meta: { title: 'รายละเอียดคำสั่งซื้อ - Admin' } },
            { path: 'inbox', component: () => import('../pages/admin/InboxAdmin.vue'), meta: { title: 'กล่องข้อความ - Admin' } },
            { path: 'newsletter', component: () => import('../pages/admin/NewsletterAdmin.vue'), meta: { title: 'สมาชิกข่าวสาร - Admin' } },
            { path: 'contact', component: () => import('../pages/admin/ContactAdmin.vue'), meta: { title: 'จัดการข้อมูลติดต่อ - Admin' } },
            { path: 'about', component: () => import('../pages/admin/AboutAdmin.vue'), meta: { title: 'จัดการเนื้อหา เกี่ยวกับเรา - Admin' } },
            { path: 'services', component: () => import('../pages/admin/ServicesAdmin.vue'), meta: { title: 'จัดการหน้าบริการ - Admin' } },
            { path: 'projects', component: () => import('../pages/admin/ProjectsAdmin.vue'), meta: { title: 'จัดการหน้าผลงาน - Admin' } },
            { path: 'articles', component: () => import('../pages/admin/ArticlesAdmin.vue'), meta: { title: 'จัดการบทความ - Admin' } },
            { path: 'customers', component: () => import('../pages/admin/CustomersAdmin.vue'), meta: { title: 'จัดการลูกค้าสมาชิก - Admin' } },
            { path: 'customers/:id', component: () => import('../pages/admin/CustomerDetailAdmin.vue'), meta: { title: 'รายละเอียดลูกค้า - Admin' } },
            { path: 'users', component: () => import('../pages/admin/AdminUsersAdmin.vue'), meta: { title: 'จัดการผู้ดูแลระบบ - Admin' } },
            { path: 'profile', component: () => import('../pages/admin/ProfileAdmin.vue'), meta: { title: 'โปรไฟล์ผู้ดูแลระบบ - Admin' } },
            { path: 'settings', component: () => import('../pages/admin/SettingsAdmin.vue'), meta: { title: 'ตั้งค่าระบบ - Admin' } },
            { path: 'logs', component: () => import('../pages/admin/LogsAdmin.vue'), meta: { title: 'บันทึกระบบ (System Logs) - Admin' } },
            { path: 'logs/orders', component: () => import('../pages/admin/LogsAdmin.vue'), meta: { title: 'ประวัติกิจกรรมคำสั่งซื้อ - Admin' } },
            { path: 'logs/emails', component: () => import('../pages/admin/LogsAdmin.vue'), meta: { title: 'ประวัติส่งอีเมล (Email Logs) - Admin' } },
            { path: 'policies', component: () => import('../pages/admin/PoliciesAdmin.vue'), meta: { title: 'จัดการนโยบายและข้อตกลง - Admin' } },
            { path: 'guides', component: () => import('../pages/admin/GuidesAdmin.vue'), meta: { title: 'จัดการคู่มือและวิธีการต่างๆ - Admin' } },
            { path: 'footer', component: () => import('../pages/admin/FooterAdmin.vue'), meta: { title: 'จัดการข้อมูล Footer - Admin' } },
            { path: 'manual', component: () => import('../pages/admin/Manual.vue'), meta: { title: 'คู่มือการใช้งานแบบละเอียด - Admin' } },
            { path: 'reviews', component: () => import('../pages/admin/ReviewsAdmin.vue'), meta: { title: 'จัดการรีวิวสินค้า - Admin' } },
            { path: 'coupons', component: () => import('../pages/admin/CouponsAdmin.vue'), meta: { title: 'จัดการโค้ดส่วนลด - Admin' } },
            { path: 'line', component: () => import('../pages/admin/LineAdmin.vue'), meta: { title: 'จัดการ Line Official - Admin' } }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0, behavior: 'smooth' }
    }
})

// Navigation Guard for SEO Meta Tags
router.beforeEach((to, from, next) => {
    // Set Title
    let title = to.meta.title || 'STORAGE HOUSE - ระบบจัดการบ้านเก็บของอัจฉริยะ'
    try {
        const settingsStore = useSettingsStore()
        if (settingsStore.storeName) {
            title = title.replace(/STORAGE HOUSE/g, settingsStore.storeName)
        }
    } catch (e) {
        // Pinia might not be fully initialized yet on startup
    }
    document.title = title

    // Set Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `https://storagehouse.co.th${to.path === '/' ? '' : to.path}`)


    // Set Meta Description
    const description = to.meta.description || 'เว็บไซต์จำหน่ายและให้คำปรึกษาการสร้างบ้านเก็บของและโรงเรือน'
    const metaDescriptionTag = document.querySelector('meta[name="description"]')
    if (metaDescriptionTag) {
        metaDescriptionTag.setAttribute('content', description)
    } else if (to.meta.description) {
        const meta = document.createElement('meta')
        meta.name = 'description'
        meta.content = description
        document.head.appendChild(meta)
    }

    // Dynamic OG Meta Tags for social sharing
    const ogTags = {
        'og:title': document.title,
        'og:description': description,
        'og:url': `https://storagehouse.co.th${to.fullPath}`,
        'twitter:title': document.title,
        'twitter:description': description,
    }
    for (const [property, content] of Object.entries(ogTags)) {
        const isOg = property.startsWith('og:')
        const selector = isOg ? `meta[property="${property}"]` : `meta[name="${property}"]`
        let tag = document.querySelector(selector)
        if (tag) {
            tag.setAttribute('content', content)
        } else {
            tag = document.createElement('meta')
            if (isOg) tag.setAttribute('property', property)
            else tag.name = property
            tag.content = content
            document.head.appendChild(tag)
        }
    }

    // Admin Authentication Guard
    if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
        const token = localStorage.getItem('adminToken')
        if (!token) {
            return next('/admin/login')
        }
    }

    // Maintenance Mode Guard (exclude admin routes and the maintenance page itself)
    try {
        const settingsStore = useSettingsStore()
        if (settingsStore.maintenanceModeEnabled && !to.path.startsWith('/admin') && !to.meta.isMaintenancePage) {
            return next('/maintenance')
        }
        // If maintenance is OFF but user is on maintenance page, redirect to home
        if (!settingsStore.maintenanceModeEnabled && to.meta.isMaintenancePage) {
            return next('/')
        }
    } catch (e) {}

    // AI Consultant Guard
    try {
        const settingsStore = useSettingsStore()
        if (to.path === '/ai-consultant' && !settingsStore.isAiConsultantEnabled) {
            return next('/')
        }
    } catch (e) {}

    // Online Shopping Guard
    try {
        const settingsStore = useSettingsStore()
        if (!settingsStore.isOnlineShoppingEnabled && (to.path === '/cart' || to.path === '/profile' || to.path === '/verify-email')) {
            return next('/')
        }
    } catch (e) {
        // Pinia might not be fully initialized on the very first route resolution
    }

    next()
})

export default router
