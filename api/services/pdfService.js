const PDFDocument = require('pdfkit');
const path = require('path');
const db = require('../config/database');
const fs = require('fs');

const FONT_REGULAR = path.join(__dirname, '../fonts/Sarabun-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../fonts/Sarabun-Bold.ttf');

const getCompanySettings = async () => {
    try {
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'store_logo', 'contact_email', 'contact_phone', 'contact_address', 'contact_tax_id', 'contact_company_name')"
        );
        const s = {};
        for (const r of rows) s[r.setting_key] = r.setting_value;
        return {
            companyName: s.contact_company_name || s.store_name || 'บริษัทจำหน่ายสินค้า',
            address: s.contact_address || '',
            taxId: s.contact_tax_id || '-',
            phone: s.contact_phone || '-',
            email: s.contact_email || '',
            logo: s.store_logo || null
        };
    } catch (e) {
        console.error('Failed to get company settings for PDF:', e);
        return {
            companyName: 'บริษัทจำหน่ายสินค้า',
            address: '-',
            taxId: '-',
            phone: '-',
            email: '',
            logo: null
        };
    }
};

/**
 * Generates a Quotation PDF returning a Promise that resolves with a Buffer.
 * @param {Object} data - Quotation details
 * @param {String} data.id - The quotation request ID
 * @param {String} data.customerName - Customer name
 * @param {String} data.companyName - Customer company (optional)
 * @param {String} data.phone - Customer phone
 * @param {String} data.email - Customer email
 * @param {String} data.usageType - Interested service/product
 * @param {String} data.areaSize - Area size
 * @param {String} data.budget - Estimated budget
 * @param {String} data.details - Additional details
 */
exports.generateQuotationPDF = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const company = await getCompanySettings();
            
            // Create a document
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            
            // Collect chunks into a buffer
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);
            
            // Register Thai fonts
            if (fs.existsSync(FONT_REGULAR)) doc.registerFont('Sarabun', FONT_REGULAR);
            if (fs.existsSync(FONT_BOLD)) doc.registerFont('Sarabun-Bold', FONT_BOLD);
            
            const fontReg = fs.existsSync(FONT_REGULAR) ? 'Sarabun' : 'Helvetica';
            const fontBold = fs.existsSync(FONT_BOLD) ? 'Sarabun-Bold' : 'Helvetica-Bold';
            
            // Header
            doc.font(fontBold).fontSize(20).text('ใบเสนอราคา (Quotation / Estimate)', { align: 'center' });
            doc.moveDown(2);
            
            // Company Info (Left) & Doc Info (Right)
            const startY = doc.y;
            
            doc.font(fontBold).fontSize(14).text(company.companyName, 50, startY);
            doc.font(fontReg).fontSize(12)
               .text(company.address)
               .text(`เลขประจำตัวผู้เสียภาษี: ${company.taxId}`)
               .text(`โทร: ${company.phone} | อีเมล: ${company.email}`);
               
            // Right block
            const shortId = (data.id || '').split('-')[0].toUpperCase();
            const dateStr = new Date().toLocaleDateString('th-TH');
            
            doc.font(fontBold).fontSize(12)
               .text(`เลขที่อ้างอิง: QT-${shortId}`, 400, startY)
               .text(`วันที่: ${dateStr}`, 400, startY + 15);
               
            doc.moveDown(3);
            
            // Customer Info Box
            const customerY = doc.y;
            doc.rect(50, customerY, 495, 80).stroke();
            
            doc.font(fontBold).fontSize(12).text('ข้อมูลลูกค้า / Customer Info', 60, customerY + 10);
            doc.font(fontReg).fontSize(12)
               .text(`ชื่อลูกค้า: ${data.customerName || '-'}`, 60, customerY + 30)
               .text(`บริษัท: ${data.companyName || '-'}`, 300, customerY + 30)
               .text(`โทรศัพท์: ${data.phone || '-'}`, 60, customerY + 50)
               .text(`อีเมล: ${data.email || '-'}`, 300, customerY + 50);
               
            doc.moveDown(4);
            
            // Items Table
            const tableTop = doc.y;
            doc.font(fontBold);
            
            doc.rect(50, tableTop, 495, 25).fillAndStroke('#f3f4f6', '#d1d5db');
            doc.fillColor('#000000')
               .text('รายละเอียดบริการ (Description)', 60, tableTop + 6)
               .text('ข้อมูลผู้ใช้ (Details)', 300, tableTop + 6);
               
            doc.font(fontReg);
            let rowY = tableTop + 35;
            
            // Row 1: Item
            doc.text(data.usageType || 'บริการตามที่ลูกค้าสนใจ', 60, rowY);
            doc.text(`งบประมาณที่ตกลง: ${data.budget || '-'}`, 300, rowY);
            
            rowY += 25;
            // Row 2: Details
            doc.text(`ขนาดพื้นที่: ${data.areaSize ? data.areaSize + ' ตร.ม.' : '-'}`, 60, rowY);
            doc.text(`พื้นที่โครงการ: ${data.projectScale || '-'}`, 300, rowY);
            
            rowY += 25;
            // Row 3: More Details
            if (data.details) {
                doc.text(`รายละเอียดเพิ่มเติม: ${data.details}`, 60, rowY, { width: 450 });
            }
            
            const lineY = doc.y + 20;
            doc.moveTo(50, lineY).lineTo(545, lineY).stroke();
            doc.moveDown(2);
            
            // Footer Note
            doc.font(fontReg).fontSize(10).fillColor('#6b7280');
            doc.text('* เอกสารฉบับนี้เป็นเพียงการประเมินราคาเบื้องต้นตามข้อมูลที่ได้รับ ลูกค้าสามารถระบุความต้องการเพิ่มเติมได้เมื่อทีมงานติดต่อกลับ', 50, doc.y, { align: 'center' });
            
            // Finalize PDF file
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
