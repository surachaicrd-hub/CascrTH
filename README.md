# Morespace

## Premium Storage Shed eCommerce & AI-Powered CMS Platform

Morespace คือแพลตฟอร์มร้านค้าออนไลน์และระบบจัดการเนื้อหาแบบครบวงจร สำหรับธุรกิจจำหน่ายบ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง โรงเรือน และโกดังสำเร็จรูป

ระบบประกอบด้วยหน้าร้านออนไลน์ ระบบจัดการสินค้า ตะกร้าสินค้า การชำระเงิน การออกใบเสนอราคา ระบบสมาชิก แดชบอร์ดผู้ดูแล และเครื่องมือ AI สำหรับช่วยสร้างบทความ วิเคราะห์ SEO/GEO และตอบคำถามลูกค้าผ่านเว็บไซต์และ LINE Messaging API

> Repository: `StorageShed`  
> Product/Brand: `Morespace`

---

## Tech Stack

### Frontend

- Vue 3
- Composition API
- Pinia
- Vite
- Tailwind CSS
- PostCSS
- CKEditor 5
- AOS
- thai-address-database
- Vitest
- Playwright

### Backend

- Node.js
- Express
- MySQL
- mysql2 Connection Pool
- Google Gemini API ผ่าน `@google/genai`
- node-cron
- Multer
- Sharp
- Nodemailer
- PDFKit
- PM2

### Security and Optimization

- Helmet
- Compression
- Express Rate Limit
- JWT Authentication
- CORS Configuration
- Request Validation
- HTTP Timeout Configuration
- Environment Variables

---

## Core Features

### 1. eCommerce System

ระบบร้านค้าออนไลน์สำหรับจัดการและจำหน่ายสินค้า ประกอบด้วย:

- หมวดหมู่สินค้า
- รายละเอียดสินค้า
- SKU และข้อมูลสต็อก
- ราคาและราคาส่วนลด
- ขนาด วัสดุ สี และคุณสมบัติ
- รูปภาพสินค้า
- ป้ายกำกับสินค้า
- สินค้าแนะนำ
- ตารางเปรียบเทียบสินค้า
- รายการโปรด
- ตะกร้าสินค้า
- คูปองส่วนลด
- ค่าจัดส่ง
- ระบบ Checkout
- ฟอร์มกรอกที่อยู่ในประเทศไทย
- ประวัติคำสั่งซื้อ
- สถานะคำสั่งซื้อ

### 2. Product Attribute Matching

ระบบเชื่อมโยงคุณสมบัติสินค้าเข้ากับความต้องการของลูกค้า เช่น:

- พื้นที่ติดตั้ง
- ขนาดสินค้า
- ลักษณะการใช้งาน
- วัสดุ
- งบประมาณ
- ความจุในการจัดเก็บ
- คุณสมบัติพิเศษ

ช่วยให้ลูกค้าเลือกสินค้าและเปรียบเทียบรุ่นที่เหมาะสมได้ง่ายขึ้น

### 3. Payment Gateway

รองรับการเชื่อมต่อระบบ IPay Merchant API ของธนาคารกรุงเทพ สำหรับการชำระเงินผ่านบัตรเครดิต

ข้อมูลสำคัญของ Payment Gateway ต้องจัดเก็บใน Environment Variables เท่านั้น ห้ามบันทึกลงใน Source Code หรือ README

### 4. Quotation Generator

ระบบสร้างใบเสนอราคา PDF อัตโนมัติ โดยรองรับข้อมูล:

- ข้อมูลลูกค้า
- รายการสินค้า
- จำนวนสินค้า
- ราคาต่อหน่วย
- ส่วนลด
- ค่าจัดส่ง
- ภาษี
- ยอดรวม
- หมายเหตุ
- วันหมดอายุของใบเสนอราคา

---

## AI-Powered CMS

### 1. AI Article Generation

ระบบช่วยสร้างบทความจากข้อมูลสินค้าโดยใช้ Google Gemini API พร้อมจัดโครงสร้างเนื้อหาให้เหมาะกับ SEO และ GEO

รูปแบบเนื้อหาที่ระบบรองรับ:

- ชื่อบทความ
- บทนำ
- หัวข้อหลักและหัวข้อย่อย
- ย่อหน้า HTML
- รายละเอียดสินค้า
- ตารางเปรียบเทียบ
- จุดเด่นและข้อควรพิจารณา
- คำแนะนำในการเลือกสินค้า
- FAQ
- บทสรุป
- Call to Action

### 2. SEO and GEO Analysis

ระบบช่วยวิเคราะห์และสร้างข้อมูลประกอบบทความ เช่น:

- Meta Title
- Meta Description
- Keywords
- Search Intent
- URL Slug
- Related Topics
- FAQ
- Structured Content
- LLM Context
- Internal Link Suggestions

GEO หรือ Generative Engine Optimization ใช้สำหรับจัดโครงสร้างเนื้อหาให้ระบบค้นหาและ AI สามารถทำความเข้าใจบริบทของเนื้อหาได้ง่ายขึ้น

### 3. AI Image Prompt Generator

ระบบสร้าง Prompt ภาษาอังกฤษสำหรับนำไปใช้กับเครื่องมือสร้างภาพ เช่น Midjourney, DALL-E หรือระบบสร้างภาพอื่น

ระบบจะสร้างคำอธิบายภาพจาก:

- ชื่อสินค้า
- ประเภทสินค้า
- วัสดุ
- ขนาด
- สถานที่ติดตั้ง
- ลักษณะการใช้งาน
- สไตล์ภาพ
- แสงและมุมกล้อง

### 4. Automated Content Tasks

รองรับการตั้งเวลาทำงานด้วย `node-cron` เช่น:

- สร้างบทความตามกำหนดเวลา
- วิเคราะห์ SEO
- แนะนำสินค้า
- เตรียมบทความฉบับร่าง
- เผยแพร่เนื้อหา
- ส่งรายงานประจำวัน

ก่อนเปิดใช้งานการเผยแพร่อัตโนมัติใน Production ควรมีระบบตรวจสอบเนื้อหาและบันทึกประวัติการทำงาน

---

## LINE Messaging API and CRM

### Gemini Chatbot

ระบบแชตบอตสำหรับตอบคำถามลูกค้า โดยสามารถใช้ข้อมูลต่อไปนี้ประกอบคำตอบ:

- ข้อมูลสินค้า
- คำถามที่พบบ่อย
- รายละเอียดบริการ
- ประวัติการสนทนา
- ข้อมูลคำสั่งซื้อที่ได้รับอนุญาต
- เงื่อนไขการจัดส่ง
- การรับประกัน

### LINE Broadcast Campaign

ระบบส่งข้อความถึงลูกค้าที่ติดตามบัญชี LINE เช่น:

- โปรโมชัน
- คูปองส่วนลด
- สินค้าใหม่
- ข่าวสาร
- บทความแนะนำ
- การแจ้งเตือนคำสั่งซื้อ

การส่ง Broadcast ต้องเป็นไปตามข้อกำหนดของ LINE และต้องตรวจสอบสิทธิ์การรับข้อความของผู้ใช้

### Newsletter Subscription

- สมัครรับข่าวสาร
- ยืนยันอีเมล
- จัดการรายชื่อผู้รับ
- ส่งข่าวสารและโปรโมชัน
- ยกเลิกรับข่าวสาร

---

## Admin and Analytics Dashboard

ระบบหลังบ้านรองรับการจัดการ:

- สินค้า
- หมวดหมู่
- คุณสมบัติสินค้า
- คำสั่งซื้อ
- ลูกค้า
- คูปอง
- ใบเสนอราคา
- บทความ
- SEO Metadata
- รูปภาพ
- Newsletter
- LINE Campaign
- AI Settings
- System Settings
- Logs

### Sales Analytics

แดชบอร์ดวิเคราะห์ข้อมูล เช่น:

- จำนวนคำสั่งซื้อ
- ยอดขายรวม
- ยอดขายตามช่วงเวลา
- สินค้าขายดี
- หมวดหมู่ยอดนิยม
- ลูกค้าใหม่
- มูลค่าคำสั่งซื้อเฉลี่ย
- สถานะคำสั่งซื้อ

### AI Settings

- จัดการ Gemini API Key
- กำหนดโมเดล
- กำหนด Prompt
- กำหนดจำนวนครั้ง Retry
- ตั้งค่าการสลับ Key
- ตั้งค่าการสลับโมเดล
- ตรวจสอบประวัติการใช้งาน
- ตรวจสอบข้อผิดพลาด

### Diagnostics Logs

- API Request Logs
- Application Logs
- Error Logs
- AI Request Logs
- Cron Job Logs
- Authentication Logs

ไฟล์ Logs ต้องไม่ถูก Commit ขึ้น GitHub และต้องหลีกเลี่ยงการบันทึกรหัสผ่าน API Key หรือข้อมูลสำคัญของลูกค้า

---

## Folder Structure

```text
StorageShed/
├── api/
│   ├── config/               # การตั้งค่าฐานข้อมูลและระบบ
│   ├── routes/               # API endpoints
│   ├── services/             # AI, LINE, PDF, Email และ Cron
│   ├── public/               # Static files และไฟล์อัปโหลด
│   ├── logs/                 # Logs ของ Backend
│   ├── .env.example          # ตัวอย่าง Environment Variables
│   ├── index.js              # จุดเริ่มต้นของ API Server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # หน้าเว็บไซต์และหน้า Admin
│   │   ├── components/       # UI Components
│   │   ├── store/            # Pinia Stores
│   │   ├── services/         # API Services
│   │   ├── assets/           # CSS, Images และ Assets
│   │   └── router/           # Route Configuration
│   ├── public/
│   ├── .env.example
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── logs/                     # PM2 Logs
├── ecosystem.config.js       # PM2 Configuration
├── run.bat                   # เริ่ม Backend และ Frontend บน Windows
├── .gitignore
└── README.md
```

---

## Prerequisites

โปรแกรมที่ควรติดตั้งก่อนเริ่มใช้งาน:

- Node.js 18 ขึ้นไป
- npm
- MySQL 8.0 ขึ้นไป
- Git
- GitHub Desktop หรือ Git CLI

สำหรับ Production แนะนำเพิ่มเติม:

- PM2
- Nginx หรือ Reverse Proxy
- SSL Certificate
- ระบบสำรองฐานข้อมูล

---

## Database Setup

สร้างฐานข้อมูล MySQL:

```sql
CREATE DATABASE storageshed_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

ระบบอาจตรวจสอบหรือสร้างตารางที่จำเป็นเมื่อ API เริ่มทำงาน ทั้งนี้ขึ้นอยู่กับโครงสร้างโค้ดและระบบ Migration ที่ใช้งานจริง

> ควรสำรองฐานข้อมูลก่อนอัปเดตโครงสร้างตารางใน Production เสมอ

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd StorageShed
```

### 2. Install Backend Dependencies

```bash
cd api
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variables

### Backend

สร้างไฟล์ `api/.env` โดยใช้ `api/.env.example` เป็นต้นแบบ:

```env
NODE_ENV=development
PORT=8080

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=storageshed_db

JWT_SECRET=generate_a_strong_random_string_at_least_32_characters

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GEMINI_API_KEY=your_gemini_api_key

LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password

IPAY_MERCHANT_ID=your_merchant_id
IPAY_CURRENCY_CODE=764
```

ชื่อ Environment Variables ต้องตรวจสอบกับไฟล์ `.env.example` และโค้ดจริงของโปรเจกต์อีกครั้ง

### Frontend

สร้างไฟล์ `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> ห้าม Commit ไฟล์ `.env` ขึ้น GitHub

---

## Running Locally

### Start Backend

```bash
cd api
npm start
```

Backend จะเปิดตามพอร์ตที่กำหนดใน `api/.env` ตัวอย่าง:

```text
http://localhost:8080
```

### Start Frontend

เปิด Terminal อีกหน้าต่างแล้วรัน:

```bash
cd frontend
npm run dev
```

Frontend จะเปิดตามพอร์ตที่กำหนดใน `vite.config.js` ตัวอย่าง:

```text
http://localhost:8000
```

### Windows Quick Start

บน Windows สามารถดับเบิลคลิก:

```text
run.bat
```

เพื่อเปิด Backend และ Frontend พร้อมกัน หากไฟล์ดังกล่าวได้รับการตั้งค่าไว้เรียบร้อยแล้ว

---

## Testing

### Frontend Unit Tests

```bash
cd frontend
npm run test
```

### End-to-End Tests

```bash
cd frontend
npx playwright test
```

### Production Build Test

```bash
cd frontend
npm run build
```

คำสั่งจริงอาจแตกต่างกันตาม Scripts ที่กำหนดใน `package.json`

---

## Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
```

ไฟล์ Production จะถูกสร้างใน:

```text
frontend/dist/
```

### 2. Install PM2

```bash
npm install pm2 -g
```

### 3. Start Backend

จากโฟลเดอร์หลักของโปรเจกต์:

```bash
pm2 start ecosystem.config.js --env production
```

### 4. PM2 Commands

ตรวจสอบสถานะ:

```bash
pm2 status
```

ดู Logs:

```bash
pm2 logs morespace-api
```

รีสตาร์ต:

```bash
pm2 restart morespace-api
```

หยุดชั่วคราว:

```bash
pm2 stop morespace-api
```

บันทึกรายการ Process:

```bash
pm2 save
```

---

## AI Network and Timeout Configuration

การสร้างบทความด้วย AI อาจใช้เวลานานกว่าการเรียก API ทั่วไป ระบบจึงมีการตั้งค่า Timeout ให้รองรับงานประมวลผลระยะยาว

ตัวอย่างการตั้งค่า:

- Headers Timeout: 120 วินาที
- Body Timeout: 240 วินาที
- Retry เมื่อเกิดข้อผิดพลาดชั่วคราว
- สลับ API Key ตามค่าที่กำหนด
- สลับโมเดลตามค่าที่กำหนด

ข้อผิดพลาดที่ควรรองรับ:

- `429` Rate Limit หรือ Quota
- `500` Internal Server Error
- `502` Bad Gateway
- `503` Service Unavailable
- Network Timeout
- Invalid Response
- Invalid JSON

ระบบควรบันทึก Error ที่จำเป็นโดยไม่บันทึก API Key หรือข้อมูลลับ

---

## Security

ห้าม Commit ข้อมูลต่อไปนี้ขึ้น GitHub:

- `.env`
- API Key
- Access Token
- JWT Secret
- รหัสผ่านฐานข้อมูล
- Google Client Secret
- LINE Channel Secret
- Payment Gateway Credentials
- SMTP Password
- Private Key
- ข้อมูลลูกค้า
- ข้อมูลคำสั่งซื้อจริง
- Logs
- Database Backup

ตัวอย่าง `.gitignore`:

```gitignore
# Environment variables
.env
.env.*
!.env.example

# Dependencies
node_modules/

# Build files
dist/
build/
.next/
coverage/
.cache/

# Logs
logs/
*.log

# Database and backup files
*.sql
*.db
*.sqlite
*.sqlite3
*.bak

# Uploaded private files
uploads/private/

# Editors and operating systems
.vscode/
.idea/
.DS_Store
Thumbs.db
```

---

## Backup Policy

GitHub สำรองเฉพาะ Source Code และไฟล์ที่ถูก Commit เท่านั้น โดยทั่วไปจะไม่รวม:

- MySQL Database
- ไฟล์ `.env`
- รูปภาพที่ผู้ใช้อัปโหลด
- เอกสาร PDF ที่สร้างภายหลัง
- Logs
- ไฟล์ที่อยู่ใน `.gitignore`

จึงควรมีระบบสำรองเพิ่มเติม:

1. สำรอง Source Code ด้วย GitHub
2. สำรอง MySQL Database เป็นประจำ
3. สำรองโฟลเดอร์ Uploads
4. สำรอง Environment Variables ใน Password Manager
5. เก็บ Backup อีกชุดไว้คนละอุปกรณ์หรือ Cloud Storage

---

## Git Workflow

ก่อนให้ AI หรือผู้พัฒนาแก้โค้ด:

```text
ตรวจสอบ Changes → Commit → Push origin
```

หลังแก้โค้ดและทดสอบสำเร็จ:

```text
ตรวจสอบไฟล์ → ทดสอบระบบ → Commit → Push origin
```

ตัวอย่าง Commit Message:

```text
Add product comparison feature
Fix checkout validation
Update Gemini article generator
Improve admin dashboard
Backup before AI changes
```

แนะนำให้ Commit เป็นช่วงสั้น ๆ ตามฟีเจอร์ ไม่ควรรอให้แก้หลายระบบแล้ว Commit พร้อมกันทั้งหมด

---

## Important Notes

- Repository นี้ควรตั้งค่าเป็น Private
- ห้ามนำ Credentials จริงใส่ใน README
- ตรวจสอบ `.gitignore` ก่อน Push
- สำรองฐานข้อมูลก่อนแก้ Schema
- ทดสอบ Payment และ LINE Webhook ใน Sandbox ก่อน Production
- ตรวจสอบเนื้อหาจาก AI ก่อนเผยแพร่
- จำกัดสิทธิ์หน้า Admin ตามบทบาทผู้ใช้
- อัปเดต Dependencies และ Security Patch เป็นระยะ

---

## Project Information

**Product:** Morespace  
**Repository:** StorageShed  
**Project Type:** eCommerce and AI-Powered CMS  
**Developer:** บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด  
**Brand Owner:** Morespace

---

## License and Usage

โปรเจกต์นี้เป็นทรัพย์สินของบริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด และพัฒนาขึ้นสำหรับการใช้งานภายในธุรกิจ Morespace

ห้ามคัดลอก แจกจ่าย เผยแพร่ จำหน่าย หรือเปิดเผย Source Code แก่บุคคลภายนอกโดยไม่ได้รับอนุญาต
