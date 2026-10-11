const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Certificate = require('../models/Certificate');
const Result = require('../models/Result');
const Course = require('../models/Course');
const Counter = require('../models/Counter');

// Folder Check & Auto-Creation
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const cpUpload = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'thumb', maxCount: 1 }
]);

// 1. Student Online Application Form Route
router.post('/apply', cpUpload, async (req, res) => {
    try {
        const {
            applicantName, fatherName, motherName, gender, dob, category,
            mobileNo, emailId, state, district, course, examCycle, totalFee,
            aadhaarNum, apaarId, applyAs, institute, papers
        } = req.body;

        const seq = await Counter.getNextSequence('student_2026');
        const seqStr = String(seq).padStart(3, '0');
        const generatedAppNo = `APP2026${seqStr}`;
        const generatedRegNo = `UIS2026${seqStr}`;
        const generatedRollNo = `ROLL2026${seqStr}`;

        const photoPath = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : '';
        const signaturePath = req.files?.signature ? `/uploads/${req.files.signature[0].filename}` : '';
        const thumbPath = req.files?.thumb ? `/uploads/${req.files.thumb[0].filename}` : '';

        let parsedPapers = [];
        if (papers) {
            try {
                parsedPapers = typeof papers === 'string' ? JSON.parse(papers) : papers;
            } catch (err) {
                parsedPapers = [];
            }
        }

        const studentData = {
            appNo: generatedAppNo,
            registrationNo: generatedRegNo,
            enrollmentNo: generatedRegNo,
            rollNo: generatedRollNo,
            session: '2025-2026',
            status: 'admitted',
            name: applicantName || "Student",
            fatherName: fatherName || "",
            motherName: motherName || "",
            dob: dob || "",
            gender: gender || "",
            category: category || "",
            mobile: mobileNo || "",
            email: emailId || "",
            state: state || "",
            district: district || "",
            course: course || "",
            examCycle: examCycle || "",
            fee: totalFee || "₹0",
            aadhaarNum: aadhaarNum || "",
            apaarId: apaarId || "",
            applyAs: applyAs || "",
            institute: institute || "",
            photo: photoPath,
            signature: signaturePath,
            thumb: thumbPath,
            papers: parsedPapers
        };

        const student = new Student(studentData);
        await student.save();

        res.status(200).json({
            success: true,
            message: 'Application Saved Successfully!',
            appNo: generatedAppNo,
            registrationNo: generatedRegNo,
            rollNo: generatedRollNo,
            data: student
        });

    } catch (error) {
        console.error('SERVER CATCH ERROR:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error during submission'
        });
    }
});

// 2. Student Login API Route
router.post('/login', async (req, res) => {
    try {
        const { appNo, mobile } = req.body;

        if (!appNo || !mobile) {
            return res.status(400).json({ 
                success: false, 
                message: 'Application Number aur Mobile Number dono bharne zaroori hain!' 
            });
        }

        const student = await Student.findOne({
            $and: [
                { $or: [{ appNo: appNo }, { registrationNo: appNo }] },
                { $or: [{ mobile: mobile }, { mobileNo: mobile }] }
            ]
        });

        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'No student record found! Registration No. ya Mobile number check karein.' 
            });
        }

        return res.json({
            success: true,
            message: 'Login successful',
            student: student
        });

    } catch (error) {
        console.error('Student Login API Error:', error);
        return res.status(500).json({ success: false, message: 'Database Error: ' + error.message });
    }
});

// 3. Admin Panel - All Students Route
router.get('/all-students', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Data fetch karne me error aaya'
        });
    }
});

// Helper for building flexible student search queries
function buildStudentSearchQuery(rawKey) {
    const trimmed = (rawKey || '').trim();
    const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const exact = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
    
    const conditions = [
        { rollNo: exact },
        { appNo: exact },
        { registrationNo: exact },
        { enrollmentNo: exact },
        { admissionNo: exact }
    ];

    // If query is 3 digits (e.g. "001"), also match UIS2026001 / ROLL2026001
    if (/^\d{3}$/.test(trimmed)) {
        const seqPattern = new RegExp(`2026${trimmed}$`, 'i');
        conditions.push({ registrationNo: seqPattern }, { rollNo: seqPattern }, { enrollmentNo: seqPattern });
    }

    return { $or: conditions };
}

// 4. Admit Card Search API Route
router.get('/admit-card/:searchKey', async (req, res) => {
    try {
        const student = await Student.findOne(buildStudentSearchQuery(req.params.searchKey));

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Admit Card nahi mila! Kripya sahi Roll No. ya Application No. darj karein.'
            });
        }

        const Exam = require('../models/Exam');
        // Resolve course
        let course = null;
        if (student.courseId) {
            course = await Course.findById(student.courseId);
        }
        if (!course && student.course) {
            course = await Course.findOne({
                $or: [
                    { code: new RegExp(`^${student.course.trim()}$`, 'i') },
                    { shortName: new RegExp(`^${student.course.trim()}$`, 'i') },
                    { name: new RegExp(student.course.trim(), 'i') }
                ]
            });
        }

        // Resolve exam with multiple subject dates/times
        let exam = null;
        if (course) {
            exam = await Exam.findOne({ 
                courseId: course._id,
                session: student.session || '2025-2026'
            }).sort({ createdAt: -1 });
        }
        if (!exam) {
            exam = await Exam.findOne({ session: student.session || '2025-2026' }).sort({ createdAt: -1 });
        }

        res.status(200).json({
            success: true,
            student: student,
            course: course || null,
            exam: exam || null,
            data: {
                student: student,
                course: course || null,
                exam: exam || null
            }
        });
    } catch (error) {
        console.error('Admit Card Fetch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Admit card fetch nahi ho paya.'
        });
    }
});

// 5. Result Verification Search API Route
router.get('/result/:searchKey', async (req, res) => {
    try {
        const student = await Student.findOne(buildStudentSearchQuery(req.params.searchKey));

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Result nahi mila! Kripya sahi Roll No. ya Application No. check karein.'
            });
        }

        const Result = require('../models/Result');
        const Certificate = require('../models/Certificate');
        const result = await Result.findOne({ studentId: student._id, isPublished: true });
        const certificate = await Certificate.findOne({ studentId: student._id, status: { $ne: 'revoked' } });

        return res.status(200).json({
            success: true,
            student: student,
            result: result || null,
            certificate: certificate || null
        });
    } catch (error) {
        console.error('Result Fetch Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Result load nahi ho saka.'
        });
    }
});

// 6. Certificate & Marksheet Search API Route
router.get('/certificate/:searchKey', async (req, res) => {
    try {
        const rawKey = req.params.searchKey ? req.params.searchKey.trim() : '';
        const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pattern = new RegExp(`^${escapeRegex(rawKey)}$`, 'i');

        const Certificate = require('../models/Certificate');
        const Result = require('../models/Result');

        // Search certificate or student
        let cert = await Certificate.findOne({
            $or: [
                { certificateNo: pattern },
                { marksheetNo: pattern },
                { serialNo: pattern },
                { enrollmentNo: pattern }
            ],
            status: { $ne: 'revoked' }
        }).populate('studentId').populate('resultId').populate('courseId');

        let student = null;
        let result = null;

        if (cert && cert.studentId) {
            student = cert.studentId;
            result = cert.resultId;
        } else {
            student = await Student.findOne(buildStudentSearchQuery(rawKey));

            if (student) {
                cert = await Certificate.findOne({
                    studentId: student._id,
                    status: { $ne: 'revoked' }
                }).populate('courseId');

                result = await Result.findOne({
                    studentId: student._id,
                    isPublished: true
                });
            }
        }

        if (!student && !cert) {
            return res.status(404).json({
                success: false,
                message: 'Certificate ya student record nahi mila!'
            });
        }

        const certData = {
            certificateNo: cert ? cert.certificateNo : ('TBF/' + (student.course || 'ADCA') + '/2024/' + (student.rollNo || '31158')),
            marksheetNo: cert ? cert.marksheetNo : ('TBF/' + (student.course || 'ADCA') + '/2024/4887'),
            serialNo: cert ? cert.serialNo : '15579',
            enrollmentNo: (cert && cert.enrollmentNo) || student.enrollmentNo || student.registrationNo || student.rollNo,
            issueDate: cert ? cert.issueDate : (result ? result.publishedAt : new Date('2024-07-19')),
            mode: cert ? cert.mode : 'Regular',
            status: cert ? cert.status : 'issued',
            student: student,
            result: result,
            data: student
        };

        return res.status(200).json({
            success: true,
            student: student,
            certificate: certData,
            result: result || null,
            data: student
        });
    } catch (error) {
        console.error('Certificate Fetch Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Certificate load nahi ho saka.'
        });
    }
});

module.exports = router;