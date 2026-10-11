const { chromium } = require('playwright');
const { findBrowserExecutable } = require('../config/pdf-service');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Payment = require('../models/Payment');

(async () => {
    // 1. Get auth token via API
    const authRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'superadmin', password: 'UshaAdmin@2026#Secure' })
    });
    const authData = await authRes.json();
    const token = authData.data.token;

    // 2. Launch browser
    const executablePath = findBrowserExecutable();
    const browser = await chromium.launch({
        executablePath: executablePath || undefined,
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Pre-populate localStorage with auth token
    await page.addInitScript((tok) => {
        localStorage.setItem('cmsAuthToken', tok);
    }, token);

    console.log('Navigating to admin console...');
    await page.goto('http://localhost:5000/admin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Navigate to students tab
    await page.evaluate(() => showTab('students'));
    await page.waitForTimeout(300);

    // Open Add Student Modal
    console.log('Opening Add Student Modal...');
    await page.evaluate(() => openAddStudentModal());
    await page.waitForTimeout(500);

    // Test Photo Upload via file input
    console.log('Uploading sample photo to modal...');
    const sampleImagePath = path.join(__dirname, '..', 'public', 'assets', 'images', 'logo.png');
    await page.setInputFiles('#newStudentPhotoInput', sampleImagePath);
    
    // Wait for photo upload to process
    await page.waitForTimeout(1500);

    const photoUrl = await page.evaluate(() => document.getElementById('newStudentPhotoUrl')?.value);
    const photoStatus = await page.evaluate(() => document.getElementById('newStudentPhotoStatus')?.textContent);
    console.log('Photo upload result in form: URL =', photoUrl, '| Status =', photoStatus);

    if (!photoUrl.startsWith('/uploads/')) {
        throw new Error('Photo failed to upload to /uploads/! Actual: ' + photoUrl);
    }

    // Fill form
    await page.evaluate(() => {
        document.getElementById('newStudentName').value = 'SEEMA VISHWAKARMA';
        document.getElementById('newStudentFather').value = 'RAMESH VISHWAKARMA';
        document.getElementById('newStudentMother').value = 'USHA DEVI';
        document.getElementById('newStudentMobile').value = '9876543211';
        document.getElementById('newStudentCourse').value = 'ADCA';
        document.getElementById('newStudentTotalFee').value = '7000';
        document.getElementById('newStudentPaid').value = '2000';
        document.getElementById('newStudentAddress').value = 'Pahasa Bazar, Mau';
    });

    // Submit
    console.log('Submitting form with uploaded photo...');
    await page.evaluate(() => {
        const form = document.getElementById('newStudentForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    await page.waitForTimeout(2000);

    // Check DB
    await mongoose.connect('mongodb://127.0.0.1:27017/uiskills_db');
    const student = await Student.findOne({ mobile: '9876543211' });
    if (!student) {
        throw new Error('Student not saved in database!');
    }

    console.log('\n✅ VERIFIED: Student created with uploaded photo!');
    console.log('Student ID:', student._id);
    console.log('Name:', student.name);
    console.log('Photo URL in DB:', student.photo);
    console.log('Roll No:', student.rollNo);
    console.log('Reg / Enrollment No:', student.registrationNo);
    console.log('Total Fee:', student.totalFee, 'Paid:', student.paidAmount, 'Pending:', student.pendingAmount);

    // Clean up
    await Student.findByIdAndDelete(student._id);
    await Payment.deleteMany({ studentId: student._id });
    if (student.photo && student.photo.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', 'public', student.photo);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await mongoose.disconnect();
    console.log('Cleaned up test student and uploaded test image.');

    await browser.close();
    console.log('Test completed successfully!');
})();
