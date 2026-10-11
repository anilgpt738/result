const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runTest() {
    const token = jwt.sign(
        { id: 'admin123', role: 'superadmin', name: 'Director' }, 
        process.env.JWT_SECRET || 'usha_super_secret_jwt_key_2026'
    );

    // 1. Test photo upload endpoint
    const boundary = '----WebKitFormBoundaryTest' + Date.now();
    const dummyJpg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xFF, 0xD9]);
    
    const postDataStart = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="student_test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
    );
    const postDataEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([postDataStart, dummyJpg, postDataEnd]);

    const uploadRes = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/upload-photo',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Content-Length': payload.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });

    console.log('1. Photo Upload Test:', uploadRes);
    if (!uploadRes.success || !uploadRes.url) {
        throw new Error('Photo upload failed');
    }

    // 2. Test mathematical calculation of marks
    const mongoose = require('mongoose');
    const Student = require('../models/Student');
    const Result = require('../models/Result');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiskills_db');

    const omkar = await Student.findOne({ registrationNo: 'UIS2026001' });
    const result = await Result.findOne({ studentId: omkar._id });

    console.log('\n2. Omkar Vishwakarma Mathematical Verification:');
    console.log('- Total Marks Obtained:', result.totalMarks, '(Expected: 637)');
    console.log('- Total Max Marks:', result.totalMaxMarks, '(Expected: 800)');
    console.log('- Percentage:', result.percentage + '%', '(Expected: 79.63%)');
    console.log('- Overall Grade:', result.overallGrade, '(Expected: A)');
    console.log('- Result Status:', result.result, '(Expected: Pass)');

    if (result.totalMarks !== 637 || result.percentage !== 79.63 || result.overallGrade !== 'A' || result.result !== 'Pass') {
        throw new Error('Marksheet calculation verification failed');
    }

    console.log('\n✅ All photo upload and percentage calculation tests PASSED successfully!');
    await mongoose.disconnect();
    process.exit(0);
}

runTest().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
