const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Student = require('../models/Student');
const Course = require('../models/Course');
const Counter = require('../models/Counter');
const AuditLog = require('../models/AuditLog');
const { generateEnrollmentNo, generateApplicationNo } = require('../config/number-generator');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

// Upload directory
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const cpUpload = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'thumb', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
]);

// Course code 2-digit mapping for 12-digit Luhn enrollment numbers
const COURSE_CODE_MAP = {
    'ADCA': '01',
    'DCA': '02',
    'BCC': '03',
    'TALLY': '04',
    'O_LEVEL': '05',
    'DCS': '06'
};

/**
 * Public Route: POST /api/admissions/apply
 * Multi-step Online Admission Submission
 */
router.post('/apply', cpUpload, async (req, res) => {
    try {
        const {
            name, fatherName, motherName, dob, gender, category,
            mobile, email, address, state, district, pincode,
            qualification, bloodGroup, aadhaarNum, apaarId,
            course, batch, session
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Student full name is required' });
        }
        if (!mobile || !mobile.trim()) {
            return res.status(400).json({ success: false, message: 'Mobile number is required for verification' });
        }

        const appSeq = await Counter.getNextSequence('application_2026');
        const year = 2026;
        const appNo = generateApplicationNo(year, appSeq);

        // Resolve selected Course
        const courseQuery = (course || 'ADCA').trim();
        const courseDoc = await Course.findOne({
            $or: [
                { code: new RegExp(`^${courseQuery}$`, 'i') },
                { shortName: new RegExp(`^${courseQuery}$`, 'i') },
                { name: new RegExp(courseQuery, 'i') }
            ]
        });

        const courseCode = courseDoc ? courseDoc.code : 'ADCA';
        const totalFee = courseDoc ? courseDoc.fee : 7000;

        // DPDP compliance: Mask Aadhaar if provided, keep last 4 digits only
        let safeAadhaar = '';
        if (aadhaarNum && aadhaarNum.trim()) {
            const cleanAadhaar = aadhaarNum.trim().replace(/\s+/g, '');
            safeAadhaar = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
        }

        const photoPath = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : '/assets/images/default-student.jpeg';
        const signaturePath = req.files?.signature ? `/uploads/${req.files.signature[0].filename}` : '';
        const thumbPath = req.files?.thumb ? `/uploads/${req.files.thumb[0].filename}` : '';
        const idProofPath = req.files?.idProof ? `/uploads/${req.files.idProof[0].filename}` : '';

        const newStudent = new Student({
            appNo,
            name: name.trim().toUpperCase(),
            fatherName: (fatherName || '').trim().toUpperCase(),
            motherName: (motherName || '').trim().toUpperCase(),
            dob: dob || '',
            gender: gender || 'Male',
            category: category || 'General',
            mobile: mobile.trim(),
            email: (email || '').trim().toLowerCase(),
            address: address || '',
            state: state || 'Uttar Pradesh',
            district: district || 'Mau',
            pincode: pincode || '221705',
            qualification: qualification || '12th',
            bloodGroup: bloodGroup || '',
            aadhaarNum: safeAadhaar,
            apaarId: apaarId || '',
            course: courseCode,
            courseId: courseDoc ? courseDoc._id : null,
            batch: batch || 'Morning Batch',
            session: session || '2025-2026',
            status: 'applied', // Initial state awaiting admin verification
            totalFee,
            netFee: totalFee,
            paidAmount: 0,
            pendingAmount: totalFee,
            fee: `₹${totalFee}`,
            photo: photoPath,
            signature: signaturePath,
            thumb: thumbPath,
            idProof: idProofPath,
            admissionDate: new Date()
        });

        await newStudent.save();

        // Audit Log
        await AuditLog.create({
            action: 'ONLINE_ADMISSION_SUBMITTED',
            resource: 'Student',
            resourceId: newStudent._id.toString(),
            details: { appNo, name: newStudent.name, course: courseCode },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully! Please note your Application Number for tracking.',
            appNo,
            studentId: newStudent._id,
            totalFee,
            data: {
                _id: newStudent._id,
                appNo,
                name: newStudent.name,
                course: courseCode,
                status: 'applied',
                maskedAadhaar: safeAadhaar,
                createdAt: newStudent.createdAt
            }
        });

    } catch (error) {
        console.error('Admission Apply Error:', error);
        return res.status(500).json({ success: false, message: 'Server error processing application: ' + error.message });
    }
});

/**
 * Public Route: GET /api/admissions/status/:appNo
 * Check admission status
 */
router.get('/status/:appNo', async (req, res) => {
    try {
        const student = await Student.findOne({ appNo: req.params.appNo.trim() })
            .select('name appNo enrollmentNo rollNo course status createdAt totalFee paidAmount pendingAmount');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Application number not found' });
        }

        return res.json({ success: true, data: student });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Protected Admin Route: GET /api/admissions/applications
 * List all admission applications
 */
router.get('/applications', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const { status, search, course } = req.query;
        const query = {};

        if (status) query.status = status;
        if (course) query.course = course;
        if (search) {
            query.$or = [
                { name: new RegExp(search.trim(), 'i') },
                { appNo: new RegExp(search.trim(), 'i') },
                { mobile: new RegExp(search.trim(), 'i') },
                { enrollmentNo: new RegExp(search.trim(), 'i') }
            ];
        }

        const applications = await Student.find(query).sort({ createdAt: -1 });
        return res.json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Protected Admin Route: POST /api/admissions/applications/:id/approve
 * Atomically approve application, generate 12-digit Luhn enrollment number,
 * roll number, and generate installment schedules.
 */
router.post('/applications/:id/approve', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (student.status === 'enrolled' || student.status === 'admitted') {
            return res.status(400).json({ success: false, message: 'Student is already approved and enrolled' });
        }

        const year = 2026;
        const courseCode = student.course || 'ADCA';
        const course2Digit = COURSE_CODE_MAP[courseCode] || '01';

        // Increment sequence atomically
        const seq = await Counter.getNextSequence('student_2026');
        const seq3 = String(seq).padStart(3, '0');

        // Generate 12-digit Luhn Enrollment Number
        const enrollmentNo = generateEnrollmentNo(year, course2Digit, seq);
        const rollNo = `ROLL2026${seq3}`;
        const regNo = `UIS2026${seq3}`;

        student.enrollmentNo = enrollmentNo;
        student.admissionNo = enrollmentNo;
        student.registrationNo = regNo;
        student.rollNo = rollNo;
        student.status = 'admitted';
        student.admissionDate = new Date();

        // Build default installment fee schedule based on course
        const courseDoc = await Course.findOne({ code: courseCode });
        const totalFee = courseDoc ? courseDoc.fee : (student.totalFee || 7000);
        student.totalFee = totalFee;
        student.netFee = totalFee;
        student.pendingAmount = Math.max(0, totalFee - (student.paidAmount || 0));

        // Generate 12 installments for ADCA, 6 for DCA, 3 for BCC, 4 for Tally
        const count = courseDoc && courseDoc.durationMonths ? courseDoc.durationMonths : 12;
        const perMonth = Math.round((totalFee - 300) / count); // ₹300 reg + monthly

        const installments = [];
        // Installment 1: Registration
        installments.push({
            installmentNo: 1,
            title: 'Registration Fee',
            amount: 300,
            dueDate: new Date(),
            status: student.paidAmount >= 300 ? 'Paid' : 'Pending',
            paidAmount: student.paidAmount >= 300 ? 300 : 0
        });

        // Subsequent monthly installments
        for (let i = 1; i <= count; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            installments.push({
                installmentNo: i + 1,
                title: `Month ${i} Tuition Fee`,
                amount: perMonth,
                dueDate,
                status: 'Pending',
                paidAmount: 0
            });
        }
        student.installments = installments;

        await student.save();

        // Audit Log
        await AuditLog.create({
            userId: req.user.id,
            userName: req.user.name || 'Admin',
            role: req.user.role,
            action: 'APPROVE_ADMISSION',
            resource: 'Student',
            resourceId: student._id.toString(),
            details: {
                appNo: student.appNo,
                enrollmentNo,
                rollNo,
                course: courseCode
            },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.json({
            success: true,
            message: `Application approved! Enrollment No: ${enrollmentNo}, Roll: ${rollNo}`,
            data: student
        });

    } catch (error) {
        console.error('Approval Error:', error);
        return res.status(500).json({ success: false, message: 'Error approving application: ' + error.message });
    }
});

/**
 * Protected Admin Route: POST /api/admissions/applications/:id/reject
 */
router.post('/applications/:id/reject', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const { reason } = req.body;
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        student.status = 'dropped';
        student.updatedAt = new Date();
        await student.save();

        // Audit Log
        await AuditLog.create({
            userId: req.user.id,
            userName: req.user.name || 'Admin',
            role: req.user.role,
            action: 'REJECT_ADMISSION',
            resource: 'Student',
            resourceId: student._id.toString(),
            details: { appNo: student.appNo, reason: reason || 'Not eligible' },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.json({
            success: true,
            message: 'Application marked as rejected',
            data: student
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
