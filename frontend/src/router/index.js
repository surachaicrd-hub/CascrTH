import { createRouter, createWebHistory } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'

const routes = [
    {
        path: '/',
        component: () => import('../pages/Home.vue'),
        meta: { title: '' }
    },
    {
        path: '/products',
        component: () => import('../pages/Products.vue'),
        meta: { title: 'แคตตาล็อกสินค้า' }
    },
    {
        path: '/products/category/:category',
        component: () => import('../pages/Products.vue'),
        meta: { title: 'สินค้าหมวดหมู่' }
    },
    {
        path: '/products/:id',
        component: () => import('../pages/ProductDetail.vue'),
        meta: { title: 'รายละเอียดสินค้า' }
    },
    {
        path: '/services',
        component: () => import('../pages/Services.vue'),
        meta: { title: 'บริการของเรา' }
    },
    {
        path: '/projects',
        component: () => import('../pages/Projects.vue'),
        meta: { title: 'แฟ้มผลงาน' }
    },
    {
        path: '/projects/:slug',
        component: () => import('../pages/ProjectDetail.vue'),
        meta: { title: 'รายละเอียดผลงาน' }
    },
    {
        path: '/installation-guide',
        component: () => import('../pages/InstallationGuide.vue'),
        meta: { title: 'คู่มือการเตรียมพื้นที่และติดตั้ง' }
    },
    {
        path: '/faq',
        redirect: '/installation-guide'
    },
    {
        path: '/payment-methods',
        component: () => import('../pages/PaymentGuide.vue'),
        meta: { title: 'วิธีการสั่งซื้อและชำระเงิน' }
    },
    {
        path: '/about',
        component: () => import('../pages/About.vue'),
        meta: { title: 'เกี่ยวกับเรา' }
    },
    {
        path: '/verify-email',
        component: () => import('../pages/VerifyEmail.vue'),
        meta: { title: 'ยืนยันอีเมลของคุณ' }
    },
    {
        path: '/auth/line/callback',
        component: () => import('../pages/LineCallback.vue'),
        meta: { title: 'กำลังเข้าสู่ระบบ' }
    },
    {
        path: '/forgot-password',
        component: () => import('../pages/ForgotPassword.vue'),
        meta: { title: 'ลืมรหัสผ่าน' }
    },
    {
        path: '/reset-password',
        component: () => import('../pages/ResetPassword.vue'),
        meta: { title: 'ตั้งรหัสผ่านใหม่' }
    },
    {
        path: '/quotation',
        component: () => import('../pages/Quotation.vue'),
        meta: { title: 'ขอใบเสนอราคา' }
    },
    {
        path: '/contact',
        component: () => import('../pages/Contact.vue'),
        meta: { title: 'ติดต่อเรา' }
    },
    {
        path: '/profile',
        component: () => import('../pages/Profile.vue'),
        meta: { title: 'บัญชีของฉัน' }
    },
    {
        path: '/cart',
        component: () => import('../pages/Cart.vue'),
        meta: { title: 'ตะกร้าสินค้า' }
    },
    {
        path: '/checkout',
        component: () => import('../pages/Checkout.vue'),
        meta: { title: 'ชำระเงิน' }
    },
    {
        path: '/order-success/:id',
        component: () => import('../pages/OrderSuccess.vue'),
        meta: { title: 'สั่งซื้อสำเร็จ' }
    },
    {
        path: '/recently-viewed',
        component: () => import('../pages/RecentlyViewedPage.vue'),
        meta: { title: 'ประวัติการดูสินค้า' }
    },
    {
        path: '/compare',
        component: () => import('../pages/Compare.vue'),
        meta: { title: 'เปรียบเทียบสินค้า' }
    },

    // Legal & Utilities
    {
        path: '/privacy-policy',
        component: () => import('../pages/PrivacyPolicy.vue'),
        meta: { title: 'นโยบายความเป็นส่วนตัว' }
    },
    {
        path: '/terms',
        alias: '/terms-of-service',
        component: () => import('../pages/TermsOfService.vue'),
        meta: { title: 'เงื่อนไขการให้บริการ' }
    },
    {
        path: '/cookie-policy',
        component: () => import('../pages/CookiePolicy.vue'),
        meta: { title: 'นโยบายการใช้คุกกี้' }
    },
    {
        path: '/warranty',
        component: () => import('../pages/WarrantyPolicy.vue'),
        meta: { title: 'นโยบายการรับประกัน' }
    },
    {
        path: '/sitemap',
        component: () => import('../pages/Sitemap.vue'),
        meta: { title: 'แผนผังเว็บไซต์' }
    },
    {
        path: '/blog',
        component: () => import('../pages/Blog.vue'),
        meta: { title: 'บทความและความรู้' }
    },
    {
        path: '/blog/:slug',
        component: () => import('../pages/BlogDetail.vue'),
        meta: { title: 'บทความ' }
    },
    {
        path: '/maintenance',
        component: () => import('../pages/Maintenance.vue'),
        meta: { title: 'ปิดปรับปรุงระบบชั่วคราว', isMaintenancePage: true }
    },
    {
        path: '/error',
        component: () => import('../pages/ServerError.vue'),
        meta: { title: 'เกิดข้อผิดพลาด' }
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import('../pages/NotFound.vue'),
        meta: { title: '404 ไม่พบหน้าเว็บ' }
    },
    {
        path: '/admin/login',
        component: () => import('../pages/admin/Login.vue'),
        meta: { title: 'เข้าสู่ระบบ - Admin' }
    },
    {
        path: '/admin/orders/:id/print/:docType',
        component: () => import('../pages/admin/PrintDocument.vue'),
        meta: { title: 'พิมพ์เอกสาร - Admin' }
    },
    {
        path: '/admin',
        component: () => import('../pages/admin/AdminLayout.vue'),
        meta: { title: 'ระบบจัดการส่วนหลังบ้าน' },
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
            { path: 'wires', component: () => import('../pages/admin/WireSamplesAdmin.vue'), meta: { title: 'จัดการข้อมูลสายไฟ - Admin' } },
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
    // Set Dynamic Title & Description from settingsStore
    let title = to.meta.title || ''
    let description = to.meta.description || ''

    try {
        const settingsStore = useSettingsStore()
        const sName = settingsStore.storeName || ''
        if (title) {
            if (sName && !title.includes(sName)) {
                title = `${title} | ${sName}`
            }
        } else {
            title = settingsStore.storeOgTitle || sName || ''
        }
        if (!description && settingsStore.storeDescription) {
            description = settingsStore.storeDescription
        }
    } catch (e) {}

    if (title) {
        document.title = title
    }

    // Set Canonical URL
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : (window.location.origin || '')
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `${currentOrigin}${to.path === '/' ? '' : to.path}`)

    // Set Meta Description
    const metaDescriptionTag = document.querySelector('meta[name="description"]')
    if (metaDescriptionTag && description) {
        metaDescriptionTag.setAttribute('content', description)
    }

    // Dynamic OG Meta Tags for social sharing
    const ogTags = {
        'og:title': document.title,
        'og:description': description,
        'og:url': `${currentOrigin}${to.fullPath}`,
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


    // Online Shopping Guard
    try {
        const settingsStore = useSettingsStore()
        if (!settingsStore.isOnlineShoppingEnabled && (to.path === '/cart' || to.path === '/checkout' || to.path.startsWith('/order-success') || to.path === '/profile' || to.path === '/verify-email')) {
            return next('/')
        }
    } catch (e) {
        // Pinia might not be fully initialized on the very first route resolution
    }

    // Projects Module Guard (Redirect to home when disabled)
    try {
        const settingsStore = useSettingsStore()
        if (!settingsStore.isProjectsEnabled && (to.path === '/projects' || to.path.startsWith('/projects/'))) {
            return next('/')
        }
    } catch (e) {
        // Pinia might not be fully initialized on the very first route resolution
    }

    next()
})

export default router
