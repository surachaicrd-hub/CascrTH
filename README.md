# Premium Storage Shed eCommerce & AI-Powered CMS Platform

แพลตฟอร์มระบบจัดการเนื้อหา (CMS) และร้านค้าออนไลน์ (eCommerce) แบบครบวงจร พัฒนาขึ้นสำหรับธุรกิจจัดจำหน่ายบ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง และโกดังสำเร็จรูป โดยมีจุดเด่นคือการผสานการทำงานร่วมกับ **Google Gemini AI** สำหรับระบบช่วยเขียนบทความและวิเคราะห์ข้อมูลเพื่อทำ SEO/GEO (Generative Engine Optimization) รวมถึงแชตบอตตอบคำถามลูกค้าผ่าน LINE Messaging API และหน้าเว็บ

---

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (ระบบหน้าบ้าน)
- **Framework:** Vue 3 (Composition API)
- **State Management:** Pinia (สำหรับจัดการ Cart, Wishlist, User Session)
- **Build Tool:** Vite (รองรับ Fast Refresh ในขณะพัฒนา)
- **Styling:** Tailwind CSS + PostCSS (เพื่อการดีไซน์ที่รองรับ Responsive)
- **Rich Editor:** CKEditor 5
- **Animations:** AOS (Animate on Scroll)
- **Address Auto-Complete:** thai-address-database (ระบบช่วยกรอก ที่อยู่/แขวง/เขต/จังหวัด ในไทยอัตโนมัติ)
- **Testing:** Vitest & Playwright

### Backend (ระบบหลังบ้าน)
- **Server:** Node.js + Express
- **Database:** MySQL (InnoDB Engine, เชื่อมต่อผ่าน `mysql2` ด้วย Connection Pool)
- **AI Integration:** `@google/genai` (SDK ล่าสุดในการเชื่อมต่อ Gemini API)
- **Automated Tasks:** `node-cron` (สำหรับระบบวิเคราะห์บทความ/ส่งข้อมูลรายวัน)
- **File Management:** Multer (ระบบอัปโหลดรูปภาพ) + Sharp (ย่อและเพิ่มประสิทธิภาพรูปภาพอัตโนมัติ)
- **Email Server:** Nodemailer (เชื่อมต่อ SMTP ส่งอีเมลยืนยันรายการ/ส่งรายงาน)
- **Document Generation:** PDFKit (ระบบสร้างใบเสนอราคาสินค้าเป็น PDF อัตโนมัติ)
- **Security & Optimization:** Helmet (ตั้งค่าความปลอดภัย Security Headers), Compression (บีบอัดข้อมูลแบบ gzip), Express Rate Limit (ป้องกันการโจมตีแบบ Brute-force)
- **Process Manager:** PM2 (สำหรับจัดการแอปพลิเคชันในระบบ Production)

---

## 🌟 ฟีเจอร์หลัก (Core Features)

### 1. ระบบร้านค้าออนไลน์ (eCommerce System)
- **Product Catalog:** จัดการหมวดหมู่สินค้า ข้อมูลขนาด วัสดุ SKU ป้ายกำกับ (ฟรีค่าส่ง, มีการรับประกัน, แนะนำ) และตารางแสดงข้อมูลเปรียบเทียบเชิงเทคนิค
- **Attribute Matching:** เชื่อมโยงรายละเอียดความต้องการใช้สอยหรือสเปกเฉพาะเข้ากับหมวดหมู่สินค้า
- **Dynamic Cart & Checkout:** ระบบจัดการตะกร้าสินค้า คูปองส่วนลด รหัสคูปอง ค่าจัดส่ง และฟอร์มกรอกที่อยู่อัจฉริยะ
- **Payment Gateway:** เชื่อมต่อกับธนาคารกรุงเทพผ่านระบบ IPay Merchant API สำหรับการชำระเงินผ่านบัตรเครดิต
- **Quotation Generator:** จัดทำใบเสนอราคาแบบ PDF อัตโนมัติ (Quotation Export) ตามสินค้าที่เลือกรวดเร็วผ่านหลังบ้าน

### 2. ระบบจัดการเนื้อหาอัจฉริยะ (AI-Powered CMS)
- **AI Auto-Article Generation:** ระบบสร้างบทความจากรายละเอียดของสินค้าผ่าน Gemini AI โดยเขียนและวางโครงสร้างอ้างอิงตามหลัก **GEO (Generative Engine Optimization)** เพื่อให้ AI Bot อื่นๆ (เช่น Perplexity, ChatGPT) นำข้อมูลของร้านไปวิเคราะห์และแนะนำได้ง่ายขึ้น
  - แบ่งย่อหน้าด้วย HTML `<p>` ชัดเจน
  - มีตารางเปรียบเทียบคุณสมบัติเชิงเทคนิค (แท็ก `<table>`)
  - มี FAQs (คำถาม-คำตอบ) ที่สอดคล้องกับพฤติกรรมการค้นหา
- **AI Image Prompt Generator:** สร้าง Prompt ภาษาอังกฤษสำหรับการนำไปเจเนอเรตรูปภาพปกด้วย Midjourney หรือ DALL-E เพื่อประหยัดค่าใช้จ่ายในการประมวลผลรูปภาพบนคลาวด์
- **Auto SEO Tags Analyzer:** คำนวณ Meta Title, Meta Description, Keywords และบริบท AI (LLM Context) ให้อัตโนมัติเมื่อกดเขียนบทความ
- **Auto-Cron Generation:** ตั้งค่าให้ระบบเขียนบทความ แนะนำสินค้า และจัดพิมพ์เผยแพร่อัตโนมัติตามกำหนดเวลาในแต่ละวัน

### 3. ระบบเชื่อมต่อ LINE Messaging API & CRM
- **Gemini Chatbot:** ระบบตอบแชตด้วยเอไอวิเคราะห์ผ่านประวัติการสนทนาของลูกค้าใน LINE
- **LINE Broadcast Campaign:** ส่งแชตโปรโมชัน คูปองส่วนลด หรือข่าวสารจากระบบแอดมินหลังบ้านตรงเข้ามือถือของลูกค้าที่ติดตาม
- **Newsletter Subscription:** ฟอร์มติดตามข่าวสารและระบบส่งจดหมายอัปเดตสิทธิพิเศษ

### 4. ระบบวิเคราะห์และหลังบ้าน (Admin & Analytics Dashboard)
- **Sales Analytics:** สถิติจำนวนออเดอร์ ยอดขาย และกราฟเปรียบเทียบในแต่ละช่วงเวลา
- **Settings System:** หน้าควบคุม API Key ของ Gemini (รองรับการใส่หลาย Keys เพื่อวนลูปป้องกัน Quota Exceeded), โมเดลที่ต้องการเลือกใช้งาน, จัดการตารางข้อมูลหลัก และการตั้งค่าอัตโนมัติอื่นๆ
- **Diagnostics Logs:** บันทึก Logs การทำงานของระบบ รวมถึงมีแท็บแสดงพฤติกรรมการเรียกใช้งาน AI แบบ Real-time

---

## 📂 โครงสร้างโฟลเดอร์ของโปรเจกต์ (Folder Structure)

```text
StorageShed/
├── api/                       # ระบบหลังบ้าน (Express API Server)
│   ├── config/                # ไฟล์ตั้งค่า Database, Logger
│   ├── routes/                # Endpoint APIs (แยกโมดูลการทำงาน 30+ หมวดหมู่)
│   ├── services/              # งานประมวลผลเบื้องหลัง (Gemini AI, Line, PDF, Email, Cron)
│   ├── public/                # ไฟล์ Static และประวัติเอกสารอัปโหลด
│   ├── index.js               # จุดเริ่มต้นของแอปพลิเคชันหลังบ้าน
│   └── package.json           # รายการ Libraries และ Dependencies ของหลังบ้าน
├── frontend/                  # ระบบหน้าบ้าน (Vue 3 / Vite)
│   ├── src/
│   │   ├── pages/             # หน้าเพจหลักและหน้า Admin Panel
│   │   ├── components/        # ส่วนประกอบ UI ที่นำมาใช้ซ้ำ
│   │   └── store/             # จัดการ State (Pinia)
│   ├── index.html             # เทมเพลต HTML หลัก
│   ├── tailwind.config.js     # กำหนดค่าสี ธีม ดีไซน์ของระบบ
│   ├── vite.config.js         # ตั้งค่า Reverse Proxy สำหรับเรียกใช้งาน API ในโหมดพัฒนา
│   └── package.json           # รายการ Libraries และ Dependencies ของหน้าบ้าน
├── logs/                      # โฟลเดอร์เก็บ Error และ Output Logs ของ PM2
├── ecosystem.config.js        # ไฟล์ตั้งค่ากระบวนการทำงานของ PM2 ใน Production
└── run.bat                    # สคริปต์แบบแบทช์สำหรับเริ่มรันโปรเจกต์ในโหมดพัฒนา
```

---

## ⚙️ การตั้งค่าก่อนเริ่มใช้งาน (Prerequisites)

### 1. โปรแกรมที่ต้องติดตั้ง
- **Node.js** (เวอร์ชัน 18 ขึ้นไป แนะนำเวอร์ชัน LTS ล่าสุด)
- **MySQL Database Server** (เวอร์ชัน 8.0 ขึ้นไป)

### 2. การจัดเตรียมฐานข้อมูล
1. สร้างฐานข้อมูลใหม่ใน MySQL เช่น `storageshed_db`
2. โครงสร้างตารางจะถูกรันและสร้างโดยอัตโนมัติ (`auto-create / auto-migration`) ทันทีเมื่อเซิร์ฟเวอร์หลังบ้าน (`api/index.js`) เริ่มทำงานครั้งแรก

---

## 🛠️ ขั้นตอนการติดตั้งและเริ่มต้นใช้งาน (Installation)

### 1. โคลนโปรเจกต์และติดตั้ง Dependencies
แยกติดตั้งห้องบริการทั้ง 2 ส่วนดังนี้:

**ส่วนของเซิร์ฟเวอร์หลังบ้าน (API):**
```bash
cd api
npm install
```

**ส่วนของหน้าเว็บระบบ (Frontend):**
```bash
cd ../frontend
npm install
```

### 2. ตั้งค่าสภาพแวดล้อม (Environment Variables)

สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `api/.env` โดยคัดลอกรูปแบบจากไฟล์ `api/.env.example` ไปตั้งค่า:
```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=cascr_th
PORT=8200
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
GOOGLE_CLIENT_ID=your_google_sign_in_client_id
```

สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `frontend/.env` สำหรับตั้งค่า Google Sign-in:
```env
VITE_GOOGLE_CLIENT_ID="your_google_sign_in_client_id"
```

---

## 💻 การรันโปรเจกต์ในโหมดพัฒนา (Running Locally)

คุณสามารถรันโปรเจกต์แยกกันได้ดังนี้:

### 1. รันระบบหลังบ้าน (API Server)
ในโฟลเดอร์ `api` รันคำสั่ง:
```bash
npm start
```
*ระบบจะเปิดทำงานที่พอร์ต `http://localhost:8200`*

### 2. รันหน้าบ้าน (Frontend Vite Server)
ในโฟลเดอร์ `frontend` รันคำสั่ง:
```bash
npm run dev
```
*ระบบจะเปิดทำงานในโหมด Hot Reload ที่ `http://localhost:8000` โดยจะมีการทำ Proxy ลิงก์ปลายทางไปยัง API ที่พอร์ต `8200` เสมอ*

### ⚡ ทางเลือกพิเศษ (ระบบ Windows เท่านั้น)
คุณสามารถรันไฟล์สคริปต์ในโฟลเดอร์หลักเพื่อเปิดการใช้งานพร้อมกันได้ทันที:
- ดับเบิลคลิกที่ไฟล์ `run.bat` เพื่อรัน API Server และ Frontend Dev Server พร้อมกันในหน้าต่างเดียว

---

## 📦 การนำขึ้นระบบใช้งานจริง (Production Deployment)

ในการนำระบบขึ้นเผยแพร่ใช้งานจริง แนะนำให้ใช้ **PM2** เพื่อรันระบบหลังบ้านให้ทำงานตลอดเวลาแบบไร้ความหน่วง และคอมไพล์ Frontend ด้วยคำสั่งประสิทธิภาพสูง

### 1. คอมไพล์ไฟล์หน้าบ้าน (Frontend Build)
ในโฟลเดอร์ `frontend` รันคำสั่ง:
```bash
npm run build
```
*โฟลเดอร์ `dist` จะประกอบด้วย static assets ที่พร้อมนำไปขึ้นโฮสติ้ง เช่น Nginx หรือฝังผ่านโฟลเดอร์สาธารณะ (public)*

### 2. ควบคุมกระบวนการหลังบ้านผ่าน PM2
ติดตั้ง PM2 ทั่วไปในระบบ:
```bash
npm install pm2 -g
```

ใช้คำสั่งเริ่มรันและบริหารจัดการหลังบ้านในโฟลเดอร์หลักของโปรเจกต์:
```bash
# เริ่มใช้งานระบบผ่าน PM2
pm2 start ecosystem.config.js --env production

# ตรวจสอบสถานะการทำงาน
pm2 status

# ดูบันทึก Logs การทำงานแบบ Real-time
pm2 logs cascr-api

# หยุดการทำงานชั่วคราว
pm2 stop cascr-api

# รีสตาร์ตระบบหลังอัปเดตโค้ด
pm2 restart cascr-api
```

---

## 🔒 ข้อมูลระบบเครือข่ายและความปลอดภัยด้าน AI (Network & Timeout Optimization)

เนื่องจากระบบเรียกใช้ **Google Gemini API** ในการสร้างบทความความยาว 800 - 1200 คำ ซึ่งใช้เวลาประมวลผลประมาณ 30 - 45 วินาที ตัว Node.js API ได้รับการติดตั้งโมดูล `undici` เพื่อปรับตั้งค่าขยายการรองรับ HTTP headers timeout:
- **Headers Timeout:** ปรับค่าเริ่มต้นของตัวส่งผ่านจาก 30 วินาทีเป็น **2 นาที** (`120,000` มิลลิวินาที) เพื่อป้องกันการเชื่อมต่อขาดก่อนที่โมดูล AI จะประมวลผลบทความเสร็จสิ้น
- **API Model Fallback:** หากคุณเจอปัญหา Quota เกินกำหนด (Error 503) ในโมดูลหลัก ระบบจะทำการสับเปลี่ยนไปใช้งานคีย์สำรอง หรือโมดูล `gemini-2.5-pro` ในโมเดลถัดไปของลิสต์อัตโนมัติ

---
*จัดทำขึ้นโดยทีมพัฒนาระบบ eCommerce & AI Platform*
