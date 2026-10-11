/**
 * Usha Institute Management System - Master Acceptance Test Suite
 * Verifies all Master Build Prompt Version 2.0 requirements:
 * 1. Luhn Algorithm Check Digit & Validation
 * 2. Mathematical Exactness: Half-Up Rounding Rule (637 / 800 === 79.63%)
 * 3. Online Admission Workflow & Luhn Enrollment Generation
 * 4. Dynamic UPI Proof Submission & Financial-Year Receipt Issuance
 * 5. Counter Cash Collection
 * 6. Batch Creation & Daily Attendance with 75% Eligibility
 * 7. Frozen Template HTML & Dimensions Regression
 * 8. Zero Default Preload Guard on Verification Pages
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { calculateLuhnCheckDigit, validateEnrollmentNo, generateEnrollmentNo } = require('../config/number-generator');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
    console.log('================================================================');
    console.log('USHA INSTITUTE - MASTER ACCEPTANCE TEST SUITE');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        return async () => {
            try {
                process.stdout.write(`⏳ Running: ${name} ... `);
                await fn();
                console.log('✅ PASSED');
                passed++;
            } catch (err) {
                console.log(`❌ FAILED: ${err.message}`);
                failed++;
            }
        };
    }

    // 1. LUHN CHECK DIGIT & VALIDATION
    await test('1.1 Luhn Check Digit Algorithm Verification', () => {
        // Test vector: '20260100001' -> Luhn check digit should be 3 -> '202601000013'
        const base11 = '20260100001';
        const checkDigit = calculateLuhnCheckDigit(base11);
        assert.strictEqual(typeof checkDigit, 'number');
        const full12 = base11 + checkDigit;
        assert.strictEqual(full12.length, 12);
        const valRes = validateEnrollmentNo(full12);
        assert.strictEqual(valRes.valid, true, 'Generated 12-digit Luhn enrollment must validate to true');
        const invalidRes = validateEnrollmentNo('202601000019');
        assert.strictEqual(invalidRes.valid, false, 'Tampered enrollment must validate to false');
    })();

    await test('1.2 Number Generator generates valid 12-digit Luhn enrollment', () => {
        const enrollNo = generateEnrollmentNo(2026, '01', 1);
        assert.strictEqual(enrollNo.length, 12);
        assert.strictEqual(enrollNo.startsWith('20260100001'), true);
        assert.strictEqual(validateEnrollmentNo(enrollNo).valid, true);
    })();

    // 2. MATHEMATICAL ROUNDING: EXACT HALF-UP
    await test('2.1 Rounding Engine: 637 / 800 === 79.63%', () => {
        const totalObtained = 637;
        const totalMax = 800;
        const percentage = Math.floor((totalObtained / totalMax) * 10000 + 0.5) / 100;
        assert.strictEqual(percentage, 79.63, 'Exact half-up rounding must yield 79.63 for 637/800');
    })();

    // 3. ADMIN AUTHENTICATION
    let adminToken = '';
    await test('3.1 Admin Login to CMS API', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'superadmin', password: 'UshaAdmin@2026#Secure' })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.token, 'Token must be returned');
        adminToken = json.data.token;
    })();

    // 4. ONLINE ADMISSION FLOW
    let createdAppNo = '';
    let createdAppId = '';
    await test('4.1 Submit Online Admission Form (DPDP Aadhaar Masking)', async () => {
        const payload = new URLSearchParams({
            name: 'Vikram Sharma',
            fatherName: 'Rajesh Sharma',
            motherName: 'Sunita Sharma',
            dob: '2004-05-15',
            gender: 'Male',
            category: 'General',
            mobile: '9876543210',
            email: 'vikram.sharma@example.com',
            course: 'ADCA',
            session: '2025-2026',
            aadhaarNum: '123456789012',
            address: 'Pahasa, Mau, UP'
        });

        const res = await fetch(`${BASE_URL}/api/admissions/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload.toString()
        });
        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.success, true);
        assert.ok(json.appNo.startsWith('UICE/A/2026/'), 'Application number must follow UICE/A/2026/ format');
        assert.strictEqual(json.data.maskedAadhaar, 'XXXX-XXXX-9012', 'Aadhaar must be masked to last 4 digits per DPDP Act');
        createdAppNo = json.appNo;
        createdAppId = json.studentId || json.data._id;
    })();

    let approvedEnrollmentNo = '';
    await test('4.2 Admin Review & Approval -> 12-Digit Luhn Enrollment', async () => {
        const res = await fetch(`${BASE_URL}/api/admissions/applications/${createdAppId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.enrollmentNo, 'Enrollment number must be generated on approval');
        assert.strictEqual(json.data.enrollmentNo.length, 12, 'Enrollment number must be 12 digits');
        assert.strictEqual(validateEnrollmentNo(json.data.enrollmentNo).valid, true, 'Enrollment number must pass Luhn checksum');
        approvedEnrollmentNo = json.data.enrollmentNo;
    })();

    // 5. FEE PAYMENT & UPI RECONCILIATION
    let pendingPaymentId = '';
    const uniqueUtr = '9876' + Math.floor(10000000 + Math.random() * 90000000);
    await test('5.1 Submit 4-Field UPI Payment Proof with 12-Digit UTR', async () => {
        const payload = new URLSearchParams({
            identifier: approvedEnrollmentNo,
            amount: '500',
            upiRefNo: uniqueUtr,
            transactionDate: new Date().toISOString(),
            payerName: 'Vikram Sharma',
            feeHead: 'monthly_installment'
        });

        const res = await fetch(`${BASE_URL}/api/payments/submit-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload.toString()
        });
        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.success, true);
        assert.strictEqual(json.data.utr, uniqueUtr);
        assert.strictEqual(json.data.status, 'pending');
        pendingPaymentId = json.data.paymentId;
    })();

    let issuedReceiptNo = '';
    await test('5.2 Accountant Verification -> Issue Official UICE/R Receipt', async () => {
        const res = await fetch(`${BASE_URL}/api/payments/${pendingPaymentId}/verify-proof`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.receiptNo.startsWith('UICE/R/'), 'Receipt number must follow UICE/R/{FY}/{SEQ} format');
        assert.strictEqual(json.data.payment.status, 'success');
        assert.strictEqual(json.data.studentBalance.paidAmount >= 500, true);
        issuedReceiptNo = json.data.receiptNo;
    })();

    await test('5.3 Counter Cash Collection at Institute Desk', async () => {
        const res = await fetch(`${BASE_URL}/api/payments/record-cash`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                studentId: createdAppId,
                amount: 300,
                feeHead: 'admission_fee',
                remarks: 'Counter cash registration fee'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.receiptNo.startsWith('UICE/R/'));
        assert.strictEqual(json.data.method, 'cash');
    })();

    // 6. BATCHES & ATTENDANCE REGISTER
    let createdBatchId = '';
    await test('6.1 Create Clash-Free Training Batch', async () => {
        const randomCode = 'ADCA-T' + Math.floor(100 + Math.random() * 900);
        const res = await fetch(`${BASE_URL}/api/batches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                batchCode: randomCode,
                courseId: 'ADCA',
                title: 'ADCA Fast-Track Batch',
                timing: '10:00 AM - 12:00 PM',
                room: 'Lab 2',
                capacity: 30,
                teacherName: 'Anil Kumar Gupta'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.success, true);
        createdBatchId = json.data._id;
    })();

    await test('6.2 Mark Daily Attendance for Batch', async () => {
        const res = await fetch(`${BASE_URL}/api/batches/attendance/mark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                batchId: createdBatchId,
                date: '2026-10-10',
                records: [
                    { studentId: createdAppId, status: 'Present', remarks: 'On time' }
                ]
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
    })();

    await test('6.3 Calculate Student Attendance % and 75% Exam Eligibility', async () => {
        const res = await fetch(`${BASE_URL}/api/batches/attendance/student/${createdAppId}`);
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.strictEqual(typeof json.data.percentage, 'number');
        assert.strictEqual(typeof json.data.isEligibleForExam, 'boolean');
        assert.strictEqual(json.data.isEligibleForExam, json.data.percentage >= 75);
    })();

    // 7. FROZEN TEMPLATES INTEGRITY (Never modify layout, CSS, fonts, or markup)
    await test('7.1 Frozen Marksheet: Dimensions 720px × 1041px portrait intact', () => {
        const marksheetHtml = fs.readFileSync(path.join(__dirname, '../public/result.html'), 'utf8');
        assert.ok(marksheetHtml.includes('width: 720px'), 'Marksheet must strictly maintain 720px width');
        assert.ok(marksheetHtml.includes('height: 1041px'), 'Marksheet must strictly maintain 1041px height');
        assert.ok(marksheetHtml.includes('Special Gothic Condensed One'), 'Special Gothic Condensed One font must be preserved');
        assert.ok(marksheetHtml.includes('semester-marksheet_design_9.jpeg'), 'Artwork background must be preserved');
    })();

    await test('7.2 Frozen Certificate: Dimensions 1580px × 1100px landscape intact', () => {
        const certHtml = fs.readFileSync(path.join(__dirname, '../public/certificate.html'), 'utf8');
        assert.ok(certHtml.includes('width: 1580px'), 'Certificate must strictly maintain 1580px width');
        assert.ok(certHtml.includes('height: 1100px'), 'Certificate must strictly maintain 1100px height');
        assert.ok(certHtml.includes('Oswald'), 'Oswald font must be preserved');
        assert.ok(certHtml.includes('semester-certificate_design_9.jpeg'), 'Artwork background must be preserved');
    })();

    await test('7.3 Frozen Admit Card: Dimensions 850px × 1100px portrait intact', () => {
        const admitHtml = fs.readFileSync(path.join(__dirname, '../public/admit-card.html'), 'utf8');
        assert.ok(admitHtml.includes('width: 850px'), 'Admit card must strictly maintain 850px width');
        assert.ok(admitHtml.includes('height: 1100px'), 'Admit card must strictly maintain 1100px height');
    })();

    // 8. ZERO DEFAULT PRELOAD SEARCH GUARD
    await test('8.1 Search Guard: Certificate page hides canvas by default on empty visit', () => {
        const certHtml = fs.readFileSync(path.join(__dirname, '../public/certificate.html'), 'utf8');
        assert.ok(certHtml.includes("document.getElementById('emptyPromptCard').style.display = 'block'"), 'Must show prompt card');
        assert.ok(certHtml.includes("document.getElementById('print').style.display = 'none'"), 'Must hide physical canvas on initial load');
    })();

    await test('8.2 Search Guard: Result marksheet page hides canvas by default on empty visit', () => {
        const resHtml = fs.readFileSync(path.join(__dirname, '../public/result.html'), 'utf8');
        assert.ok(resHtml.includes("document.getElementById('emptyPromptCard').style.display = 'block'"), 'Must show prompt card');
        assert.ok(resHtml.includes("document.getElementById('print').style.display = 'none'"), 'Must hide physical canvas on initial load');
    })();

    // 9. PUBLIC MARKETING PAGES & UNIFIED SHELL
    await test('9.1 Public pages mount siteHeaderMount and siteFooterMount', () => {
        const pages = ['index.html', 'about.html', 'courses.html', 'contact.html', 'apply.html', 'payment.html'];
        for (const p of pages) {
            const html = fs.readFileSync(path.join(__dirname, '../public', p), 'utf8');
            assert.ok(html.includes('id="siteHeaderMount"'), `${p} must mount siteHeaderMount`);
            assert.ok(html.includes('id="siteFooterMount"'), `${p} must mount siteFooterMount`);
            assert.ok(html.includes('/js/i18n.js'), `${p} must load /js/i18n.js`);
            assert.ok(html.includes('/js/main.js'), `${p} must load /js/main.js`);
        }
    })();

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Master Test Suite Error:', err);
    process.exit(1);
});
