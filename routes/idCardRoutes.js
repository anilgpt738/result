const express = require('express');
const router = express.Router();
const path = require('path');
const Student = require('../models/Student');
const IdCard = require('../models/IdCard');
const Settings = require('../models/Settings');
const { generateQrDataUrl, renderHtmlToPdf } = require('../config/pdf-service');

/**
 * Generate CR80 ID Card HTML (Front + Back)
 * Dimensions: CR80 standard 85.6mm x 54mm (approx 324px x 204px at 96 DPI, 1011px x 638px at 300 DPI)
 */
async function generateIdCardHtml(student, idCard) {
    const instSettings = await Settings.getSetting('institute_profile') || {
        name: 'Usha Institute Of Computer Education',
        atcCode: 'IN/UP/MAU/29172',
        address: 'Hanuman Mandir ke pass, Pahasa Bazar, Mau, UP 221705'
    };

    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify/id-card/${encodeURIComponent(student.enrollmentNo || student.registrationNo)}`;
    const qrDataUrl = await generateQrDataUrl(qrUrl);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            body { background: #f1f5f9; padding: 20px; display: flex; gap: 30px; justify-content: center; }
            
            /* CR80 Card Dimensions */
            .id-card {
                width: 336px;
                height: 212px;
                border-radius: 12px;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                position: relative;
                overflow: hidden;
            }
            
            /* Front Design */
            .card-front {
                display: flex;
                flex-direction: column;
            }
            .front-header {
                background: #0B1230;
                color: #ffffff;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                border-bottom: 2px solid #C9A45C;
            }
            .front-header img {
                height: 32px;
                width: 32px;
                object-fit: contain;
                background: #fff;
                border-radius: 50%;
                padding: 1px;
            }
            .front-header-title {
                font-size: 10.5px;
                font-weight: 800;
                color: #C9A45C;
                line-height: 1.1;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .front-header-sub {
                font-size: 7.5px;
                color: #e2e8f0;
            }
            .front-body {
                display: flex;
                padding: 10px 12px;
                gap: 12px;
                flex: 1;
            }
            .student-photo {
                width: 70px;
                height: 85px;
                border-radius: 6px;
                border: 1.5px solid #0B1230;
                object-fit: cover;
                background: #f8fafc;
            }
            .student-meta {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 3px;
            }
            .meta-name {
                font-size: 13px;
                font-weight: 800;
                color: #0B1230;
                line-height: 1.2;
            }
            .meta-row {
                font-size: 9.5px;
                color: #334155;
            }
            .meta-label {
                font-weight: 600;
                color: #64748b;
            }
            .meta-val {
                font-weight: 700;
            }
            .front-footer {
                background: #F0F4F9;
                padding: 4px 12px;
                font-size: 8px;
                color: #0B1230;
                font-weight: 700;
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #e2e8f0;
            }

            /* Back Design */
            .card-back {
                padding: 12px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background: #ffffff;
            }
            .back-row {
                font-size: 9px;
                margin-bottom: 3px;
                color: #1e293b;
            }
            .back-qr-box {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 4px;
                background: #f8fafc;
                padding: 6px;
                border-radius: 6px;
                border: 1px dashed #cbd5e1;
            }
            .back-qr-img {
                width: 50px;
                height: 50px;
            }
            .back-notice {
                font-size: 7px;
                color: #64748b;
                line-height: 1.2;
            }
            .back-footer-auth {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 4px;
            }
            .auth-sign-img {
                height: 22px;
                object-fit: contain;
            }
        </style>
    </head>
    <body>
        <!-- FRONT -->
        <div class="id-card card-front">
            <div class="front-header">
                <img src="/assets/images/logo.png" alt="Logo">
                <div>
                    <div class="front-header-title">USHA INSTITUTE</div>
                    <div class="front-header-sub">COMPUTER EDUCATION • ATC: ${instSettings.atcCode}</div>
                </div>
            </div>
            <div class="front-body">
                <img src="${student.photo || '/assets/images/default-student.jpeg'}" class="student-photo" alt="Photo" onerror="this.src='/assets/images/default-student.jpeg'">
                <div class="student-meta">
                    <div class="meta-name">${student.name}</div>
                    <div class="meta-row"><span class="meta-label">Enroll:</span> <span class="meta-val" style="font-family:'JetBrains Mono';">${student.enrollmentNo || student.registrationNo}</span></div>
                    <div class="meta-row"><span class="meta-label">Course:</span> <span class="meta-val">${student.course || 'ADCA'}</span></div>
                    <div class="meta-row"><span class="meta-label">Batch:</span> <span class="meta-val">${student.batch || 'Regular'}</span></div>
                    <div class="meta-row"><span class="meta-label">Valid Till:</span> <span class="meta-val">${idCard && idCard.validTill ? new Date(idCard.validTill).toLocaleDateString('en-GB') : 'Dec 2026'}</span></div>
                </div>
            </div>
            <div class="front-footer">
                <span>STUDENT IDENTITY CARD</span>
                <span style="color:#C9A45C;">LEARN · GROW · SUCCEED</span>
            </div>
        </div>

        <!-- BACK -->
        <div class="id-card card-back">
            <div>
                <div class="back-row"><strong>Father's Name:</strong> ${student.fatherName || '-'}</div>
                <div class="back-row"><strong>Date of Birth:</strong> ${student.dob || '-'}</div>
                <div class="back-row"><strong>Contact:</strong> ${student.mobile || '-'}</div>
                <div class="back-row"><strong>Address:</strong> ${student.address || instSettings.address}</div>
            </div>
            <div class="back-qr-box">
                <img src="${qrDataUrl}" class="back-qr-img" alt="QR">
                <div class="back-notice">
                    Scan QR code to verify student credentials digitally.<br>
                    <strong>If found, return to:</strong><br>
                    ${instSettings.address}
                </div>
            </div>
            <div class="back-footer-auth">
                <div style="font-size:7.5px;color:#64748b;">Card No: ${idCard ? idCard.cardNo : 'UIC-2026-00001'}</div>
                <div style="text-align:right;">
                    <img src="/assets/images/signature.png" class="auth-sign-img" alt="Sign"><br>
                    <span style="font-size:7px;font-weight:700;color:#0B1230;">Authorised Signatory</span>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// GET /api/id-card/preview/:studentId
router.get('/preview/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) return res.status(404).send('Student not found');
        const idCard = await IdCard.findOne({ studentId: student._id });
        const html = await generateIdCardHtml(student, idCard);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (err) {
        return res.status(500).send('Error rendering ID card: ' + err.message);
    }
});

// GET /api/id-card/pdf/:studentId
router.get('/pdf/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) return res.status(404).send('Student not found');
        const idCard = await IdCard.findOne({ studentId: student._id });
        const html = await generateIdCardHtml(student, idCard);
        const pdf = await renderHtmlToPdf(html, { landscape: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ID_Card_${student.enrollmentNo || 'card'}.pdf`);
        return res.send(pdf);
    } catch (err) {
        return res.status(500).send('Error generating ID card PDF: ' + err.message);
    }
});

module.exports = router;
module.exports.generateIdCardHtml = generateIdCardHtml;
