# Shared Hosting Deploy Checklist

เอกสารนี้ใช้แก้อาการหน้าเว็บโหลดได้ แต่ Console ขึ้นประมาณนี้:

```text
Unexpected token '<', "<!doctype "... is not valid JSON
Failed to fetch public settings
Failed to load nav categories
Failed to fetch showcase products
```

สาเหตุคือ browser เรียก `/api/...` แล้วได้ไฟล์ `index.html` กลับมาแทน JSON จาก API. เครื่องหมาย `<` ตัวแรกมาจาก `<!doctype html>` จึง parse เป็น JSON ไม่ได้.

## วิธี deploy ที่ถูกต้อง

โปรเจกต์นี้ต้องรันผ่าน Node.js/Express app ในโฟลเดอร์ `api` เพราะ Express เป็นตัวเสิร์ฟทั้ง API และหน้าเว็บ Vue ที่ build แล้ว.

1. ที่เครื่อง local ให้รัน `deploy_update.bat` สำหรับอัปเดต หรือ `deploy.bat` สำหรับ deploy ชุดเต็ม
2. อัปโหลดไฟล์ `deploy_api_update.zip` หรือ `deploy_api.zip` ไปที่ Application Root ของ Node.js app บน cPanel
3. แตกไฟล์ zip ให้ `index.js`, `routes`, `services`, `config`, `public` อยู่ที่ Application Root โดยตรง
4. อย่าลบไฟล์ `.env` บนโฮส
5. อย่าลบโฟลเดอร์ `public/uploads` บนโฮส
6. กด Restart App ในหน้า Node.js App ของ cPanel

## ค่า cPanel Node.js App ที่ต้องเป็น

```text
Application Root: โฟลเดอร์แอป Node.js ที่แตก zip ไว้
Document Root:    โฟลเดอร์เดียวกัน/public
Startup File:     index.js
Node Environment: production
```

ตัวอย่าง ถ้าแตกไฟล์ไว้ที่:

```text
/home/USER/app
```

ให้ตั้ง:

```text
Application Root: /home/USER/app
Document Root:    /home/USER/app/public
Startup File:     index.js
```

## วิธีตรวจหลัง deploy

เปิด URL เหล่านี้ใน browser:

```text
https://your-domain.com/api/health
https://your-domain.com/api/settings/public
https://your-domain.com/api/categories
```

ผลที่ถูกต้องต้องเห็น JSON เช่น `{ "status": "ok" ... }` หรือ `{ "success": true ... }`.

ถ้าเห็นหน้าเว็บหลัก, HTML, หรือข้อความขึ้นต้นด้วย `<!doctype html>` แปลว่า request `/api/...` ยังไม่ได้เข้าถึง Node.js/Express app.

## เช็กเพิ่มเติมเมื่อยังพัง

- ตรวจว่าโดเมนชี้เข้า Node.js App ไม่ใช่ชี้เข้า static `frontend/dist` อย่างเดียว
- ตรวจว่าไม่ได้อัปโหลดเฉพาะไฟล์ใน `frontend/dist` ไปที่ `public_html`
- ตรวจว่า `public/index.html` อยู่ใต้ Application Root ของ Node app
- ตรวจว่า `.env` มี `JWT_SECRET`, ค่า database และ `NODE_ENV=production`
- ดู log ของ Node.js App ว่า start สำเร็จหรือไม่
- หลังแตกไฟล์ zip ทุกครั้ง ให้กด Restart App

## หมายเหตุเรื่อง Vite preview/dev

ค่า proxy ใน `frontend/vite.config.js` ใช้เฉพาะตอนพัฒนาในเครื่อง local เท่านั้น. ตอนขึ้น production browser จะเรียก `/api/...` บนโดเมนจริง ดังนั้นโดเมนจริงต้องถูกส่งเข้า Express app หรือมี reverse proxy ส่ง `/api` ไปที่ Express app.
