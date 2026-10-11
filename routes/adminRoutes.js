const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Models
const Student = require('../models/Student');
const Course = require('../models/Course');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Certificate = require('../models/Certificate');
const Payment = require('../models/Payment');
const Setting = require('../models/Settings');
const User = require('../models/User');
const Counter = require('../models/Counter');

// Middleware
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { marksEntryValidation, paymentValidation, handleValidationErrors } = require('../middleware/validate');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer photo upload configuration
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, 'student-' + Date.now() + '-' + Math.round(Math.random() * 1E6) + ext);
    }
});

const uploadPhoto = multer({
    storage: photoStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (/image\/(jpeg|jpg|png|webp)/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
        }
    }
});

// Ensure all admin routes are protected
router.use(authenticateToken);
router.use(authorizeRoles('superadmin', 'admin'));

// Helper for generating sequences
const generateNextSequence = async (name) => {
    const counter = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
};

// --- Dashboard ---
router.get('/dashboard', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ status: 'active' });
        
        const paymentStats = await Payment.aggregate([
            { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
        ]);
        const totalCollected = paymentStats[0] ? paymentStats[0].totalCollected : 0;
        
        const studentsWithPending = await Student.aggregate([
            { $match: { pendingAmount: { $gt: 0 } } },
            { $group: { _id: null, totalPending: { $sum: '$pendingAmount' } } }
        ]);
        const pendingFees = studentsWithPending[0] ? studentsWithPending[0].totalPending : 0;

        const upcomingExams = await Exam.find({ date: { $gte: new Date() } }).limit(5).sort({ date: 1 });
        const recentAdmissions = await Student.find().sort({ admissionDate: -1 }).limit(5);

        return res.status(200).json({
            success: true,
            message: 'Dashboard data retrieved',
            data: { totalStudents, activeStudents, pendingFees, totalCollected, upcomingExams, recentAdmissions }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Student Management ---
router.get('/students', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, course, status, sort } = req.query;
        const query = {};
        
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { appNo: new RegExp(search, 'i') },
                { mobile: new RegExp(search, 'i') }
            ];
        }
        if (course) query.course = course;
        if (status) query.status = status;

        const sortOptions = {};
        if (sort) {
            const [field, order] = sort.split(':');
            sortOptions[field] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const students = await Student.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)).populate('course', 'name code');
        const total = await Student.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: 'Students retrieved',
            data: {
                students,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('course')
            .lean();
        
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        
        const results = await Result.find({ studentId: req.params.id }).populate('examId');
        const payments = await Payment.find({ studentId: req.params.id });
        const certificates = await Certificate.find({ studentId: req.params.id });

        return res.status(200).json({ success: true, message: 'Student retrieved', data: { student, results, payments, certificates } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// POST /upload-photo - Direct photo upload
router.post('/upload-photo', (req, res) => {
    uploadPhoto.single('photo')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Error uploading photo' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No photo file provided' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        return res.status(200).json({
            success: true,
            message: 'Photo uploaded successfully',
            url: fileUrl
        });
    });
});

// POST /students/:id/photo - Update student photo directly
router.post('/students/:id/photo', (req, res) => {
    uploadPhoto.single('photo')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Error uploading photo' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No photo file provided' });
        }
        try {
            const fileUrl = `/uploads/${req.file.filename}`;
            const student = await Student.findByIdAndUpdate(
                req.params.id,
                { photo: fileUrl, updatedAt: new Date() },
                { new: true }
            );
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            return res.status(200).json({
                success: true,
                message: 'Student photo updated successfully',
                photo: fileUrl,
                data: student
            });
        } catch (dbErr) {
            return res.status(500).json({ success: false, message: dbErr.message });
        }
    });
});

// POST /students - Manual addition by institute with sequential 2026 numbering
router.post('/students', async (req, res) => {
    try {
        const {
            name, fatherName, motherName, dob, gender, mobile, email,
            course, session, totalFee, paidAmount, address, category, photo
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Student name is required' });
        }

        const seq = await generateNextSequence('student_2026');
        const seqStr = String(seq).padStart(3, '0');
        const appNo = `APP2026${seqStr}`;
        const regNo = `UIS2026${seqStr}`;
        const rollNo = `ROLL2026${seqStr}`;

        // Resolve course ObjectId if exists
        let courseDoc = null;
        if (course) {
            courseDoc = await Course.findOne({
                $or: [
                    { code: new RegExp(`^${course.trim()}$`, 'i') },
                    { shortName: new RegExp(`^${course.trim()}$`, 'i') },
                    { name: new RegExp(course.trim(), 'i') }
                ]
            });
        }

        const courseFee = totalFee !== undefined && totalFee !== null && totalFee !== '' ? Number(totalFee) : (courseDoc ? courseDoc.fee : 7000);
        const paid = Number(paidAmount) || 0;
        const pending = Math.max(0, courseFee - paid);

        const newStudent = new Student({
            name: name.trim(),
            fatherName: (fatherName || '').trim(),
            motherName: (motherName || '').trim(),
            dob: dob || '',
            gender: gender || 'Male',
            category: category || 'General',
            mobile: (mobile || '').trim(),
            email: (email || '').trim(),
            course: courseDoc ? courseDoc.code : (course || 'ADCA'),
            courseId: courseDoc ? courseDoc._id : null,
            session: session || '2025-2026',
            appNo,
            registrationNo: regNo,
            enrollmentNo: regNo,
            rollNo,
            admissionNo: regNo,
            admissionDate: new Date(),
            totalFee: courseFee,
            paidAmount: paid,
            pendingAmount: pending,
            fee: `₹${courseFee}`,
            status: 'admitted',
            address: address || '',
            photo: (photo && photo.trim()) ? photo.trim() : '/assets/images/default-student.jpeg'
        });

        await newStudent.save();

        // If initial payment was made, record it
        if (paid > 0) {
            const paySeq = await generateNextSequence('receipt_no');
            const receiptNo = `RCP-2026-${String(paySeq).padStart(3, '0')}`;
            const payment = new Payment({
                studentId: newStudent._id,
                receiptNo,
                paymentType: 'admission',
                amount: paid,
                method: 'cash',
                status: 'success',
                description: 'Initial admission fee payment',
                paidAt: new Date(),
                receiptGenerated: true
            });
            await payment.save();
        }

        return res.status(201).json({
            success: true,
            message: `Student registered successfully with Roll: ${rollNo} / Reg: ${regNo}`,
            data: newStudent
        });
    } catch (error) {
        console.error('Add student error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
    }
});

router.put('/students/:id', async (req, res) => {
    try {
        const updates = req.body;
        // Prevent changing protected fields
        delete updates.appNo;
        delete updates.registrationNo;
        updates.updatedAt = new Date();

        const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        return res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.delete('/students/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, { status: 'suspended', updatedAt: new Date() }, { new: true });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        return res.status(200).json({ success: true, message: 'Student marked as suspended', data: student });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Course Management ---
router.post('/courses', async (req, res) => {
    try {
        const body = { ...req.body };
        if (!body.title && body.name) body.title = body.name;
        if (!body.name && body.title) body.name = body.title;
        const totalFee = Number(body.fee) || 0;
        if (!body.feePlan) {
            body.feePlan = {
                registrationFee: 0,
                installmentCount: 1,
                installmentAmount: totalFee,
                examMaterialFee: 0,
                otherFee: 0,
                totalFee: totalFee
            };
        }
        body.fee = totalFee;
        const course = new Course(body);
        await course.save();
        return res.status(201).json({ success: true, message: 'Course created', data: course });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message, error: error.message });
    }
});

router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        return res.status(200).json({ success: true, message: 'Courses retrieved', data: courses });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        return res.status(200).json({ success: true, message: 'Course retrieved', data: course });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/courses/:id', async (req, res) => {
    try {
        const body = { ...req.body };
        if (!body.title && body.name) body.title = body.name;
        if (!body.name && body.title) body.name = body.title;
        if (body.fee !== undefined && !body.feePlan) {
            const totalFee = Number(body.fee) || 0;
            body.feePlan = {
                registrationFee: 0,
                installmentCount: 1,
                installmentAmount: totalFee,
                examMaterialFee: 0,
                otherFee: 0,
                totalFee: totalFee
            };
            body.fee = totalFee;
        }
        const course = await Course.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        return res.status(200).json({ success: true, message: 'Course updated', data: course });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message, error: error.message });
    }
});

router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        return res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Marks Entry ---
router.post('/results', marksEntryValidation, handleValidationErrors, async (req, res) => {
    try {
        let { studentId, examId, courseId, session, marks } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student record not found' });
        }

        // Resolve course if not supplied
        if (!courseId) {
            let matchedCourse = null;
            if (student.course) {
                matchedCourse = await Course.findOne({
                    $or: [
                        { code: new RegExp(`^${student.course.trim()}$`, 'i') },
                        { shortName: new RegExp(`^${student.course.trim()}$`, 'i') },
                        { name: new RegExp(student.course.trim(), 'i') }
                    ]
                });
            }
            if (!matchedCourse) {
                matchedCourse = await Course.findOne({ code: 'ADCA' });
            }
            if (matchedCourse) {
                courseId = matchedCourse._id;
            } else {
                return res.status(400).json({ success: false, message: 'Course could not be resolved for this student' });
            }
        }

        // Resolve or create Exam if not provided
        if (!examId) {
            let exam = await Exam.findOne({ courseId, session: session || student.session || '2023-2024' });
            if (!exam) {
                exam = new Exam({
                    name: `Annual Examination ${session || '2023-2024'}`,
                    examCycle: student.examCycle || 'Annual Exam',
                    session: session || student.session || '2023-2024',
                    courseId,
                    status: 'results_published'
                });
                await exam.save();
            }
            examId = exam._id;
        }

        let existingResult = await Result.findOne({ studentId, examId });

        let totalMax = 0;
        let totalObtained = 0;
        let hasAnyFail = false;
        
        const processedMarks = (marks || []).map(m => {
            const max = Number(m.maxMarks) || 100;
            const obt = Number(m.marksObtained) || 0;
            const pass = Number(m.passingMarks) || 40;
            totalMax += max;
            totalObtained += obt;

            const subPerc = max > 0 ? (obt / max) * 100 : 0;
            let subGrade = 'F';
            if (subPerc >= 90) subGrade = 'A+';
            else if (subPerc >= 75) subGrade = 'A';
            else if (subPerc >= 60) subGrade = 'B';
            else if (subPerc >= 45) subGrade = 'C';
            else if (subPerc >= 40) subGrade = 'D';

            if (obt < pass) hasAnyFail = true;

            return {
                subjectName: m.subjectName,
                maxMarks: max,
                marksObtained: obt,
                grade: subGrade,
                status: obt >= pass ? 'pass' : 'fail'
            };
        });

        // Exact half-up rounding (e.g. 637 / 800 * 100 = 79.625 -> 79.63)
        const percentage = totalMax > 0 ? Math.floor((totalObtained / totalMax) * 10000 + 0.5) / 100 : 0;
        let grade = 'F';
        if (hasAnyFail || percentage < 40) {
            grade = 'F';
        } else if (percentage >= 90) grade = 'A+';
        else if (percentage >= 75) grade = 'A';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 45) grade = 'C';
        else grade = 'D';

        const finalStatus = (hasAnyFail || percentage < 40) ? 'Fail' : 'Pass';

        let result;
        if (existingResult) {
            existingResult.marks = processedMarks;
            existingResult.totalMaxMarks = totalMax;
            existingResult.totalMarks = totalObtained;
            existingResult.percentage = percentage;
            existingResult.overallGrade = grade;
            existingResult.result = finalStatus;
            existingResult.isPublished = true;
            existingResult.publishedAt = new Date();
            existingResult.session = session || student.session || '2025-2026';
            await existingResult.save();
            result = existingResult;
        } else {
            result = new Result({
                studentId, examId, courseId,
                session: session || student.session || '2025-2026',
                marks: processedMarks,
                totalMaxMarks: totalMax, totalMarks: totalObtained,
                percentage, overallGrade: grade,
                result: finalStatus,
                isPublished: true,
                publishedAt: new Date()
            });
            await result.save();
        }

        // If Pass, auto-issue or update Certificate
        let cert = null;
        if (result.result === 'Pass') {
            const courseObj = await Course.findById(courseId);
            const courseCode = courseObj ? (courseObj.code || 'ADCA') : 'ADCA';
            const year = 2026;

            cert = await Certificate.findOne({ studentId });
            if (!cert) {
                const seq = await generateNextSequence(`cert_${year}_${courseCode}`);
                const serialSeq = await generateNextSequence('cert_serial');
                const seqStr = String(seq).padStart(3, '0');

                const certNo = `TBF/${courseCode}/${year}/${seqStr}`;
                const marksheetNo = `TBF/${courseCode}/${year}/M${seqStr}`;
                const serialNo = (15000 + serialSeq).toString();
                const enroll = student.enrollmentNo || student.registrationNo || student.rollNo || `UIS${year}${seqStr}`;

                cert = new Certificate({
                    studentId,
                    resultId: result._id,
                    courseId,
                    certificateType: 'completion',
                    certificateNo: certNo,
                    marksheetNo: marksheetNo,
                    serialNo: serialNo,
                    enrollmentNo: enroll,
                    session: result.session,
                    status: 'issued',
                    verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/certificate?certNo=${encodeURIComponent(enroll)}`
                });
                await cert.save();
            } else {
                cert.resultId = result._id;
                cert.status = 'issued';
                await cert.save();
            }
        }

        // Update student status to completed
        student.status = 'completed';
        await student.save();

        return res.status(201).json({
            success: true,
            message: 'Result and Certificate processed successfully',
            data: { result, certificate: cert, student }
        });
    } catch (error) {
        console.error('Error saving result:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// GET /results/student/:studentId - Get existing result for a student to pre-fill marks
router.get('/results/student/:studentId', async (req, res) => {
    try {
        const result = await Result.findOne({ studentId: req.params.studentId }).sort({ createdAt: -1 });
        const certificate = await Certificate.findOne({ studentId: req.params.studentId });
        return res.status(200).json({ success: true, data: { result, certificate } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/results/:id', async (req, res) => {
    try {
        const { marks } = req.body;
        if (!marks) return res.status(400).json({ success: false, message: 'Marks array required' });

        let totalMax = 0;
        let totalObtained = 0;
        marks.forEach(m => {
            totalMax += Number(m.maxMarks);
            totalObtained += Number(m.marksObtained);
        });
        const percentage = (totalObtained / totalMax) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else if (percentage >= 40) grade = 'E';

        const result = await Result.findByIdAndUpdate(req.params.id, {
            marks, totalMaxMarks: totalMax, totalMarksObtained: totalObtained,
            percentage, grade, status: percentage >= 40 ? 'Pass' : 'Fail'
        }, { new: true });

        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
        return res.status(200).json({ success: true, message: 'Result updated', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.post('/results/publish', async (req, res) => {
    try {
        const { examId } = req.body;
        if (!examId) return res.status(400).json({ success: false, message: 'examId is required' });

        const result = await Result.updateMany(
            { examId },
            { isPublished: true, publishedAt: new Date() }
        );
        return res.status(200).json({ success: true, message: `${result.modifiedCount} results published` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/results', async (req, res) => {
    try {
        const { examId, courseId, studentId, isPublished } = req.query;
        const query = {};
        if (examId) query.examId = examId;
        if (courseId) query.courseId = courseId;
        if (studentId) query.studentId = studentId;
        if (isPublished !== undefined) query.isPublished = isPublished === 'true';

        const results = await Result.find(query).populate('studentId', 'name appNo').populate('examId', 'name date');
        return res.status(200).json({ success: true, message: 'Results retrieved', data: results });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Exam Management ---
router.post('/exams', async (req, res) => {
    try {
        const exam = new Exam(req.body);
        await exam.save();
        return res.status(201).json({ success: true, message: 'Exam created', data: exam });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/exams', async (req, res) => {
    try {
        const exams = await Exam.find().populate('courseId');
        return res.status(200).json({ success: true, message: 'Exams retrieved', data: exams });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/exams/:id', async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('courseId');
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        return res.status(200).json({ success: true, message: 'Exam retrieved', data: exam });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/exams/:id', async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        return res.status(200).json({ success: true, message: 'Exam updated', data: exam });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.delete('/exams/:id', async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        return res.status(200).json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Certificate Management ---
router.post('/certificates/issue', async (req, res) => {
    try {
        const { studentId, resultId } = req.body;
        
        const result = await Result.findById(resultId).populate('courseId');
        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
        if (!result.isPublished) return res.status(400).json({ success: false, message: 'Result not published yet' });
        if (result.status !== 'Pass') return res.status(400).json({ success: false, message: 'Cannot issue certificate for Fail status' });
        if (result.studentId.toString() !== studentId) return res.status(400).json({ success: false, message: 'Result does not belong to this student' });

        const year = new Date().getFullYear();
        const courseCode = result.courseId.code || 'CRS';
        
        const seq = await generateNextSequence(`cert_${year}_${courseCode}`);
        const certificateNo = `TBF/${courseCode}/${year}/${seq.toString().padStart(4, '0')}`;
        
        const serialSeq = await generateNextSequence('cert_serial');
        const serialNo = `SRN${year}${serialSeq.toString().padStart(6, '0')}`;

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost'}/verify/certificate/${certificateNo}`;
        
        const certificate = new Certificate({
            studentId, resultId, courseId: result.courseId._id,
            certificateNo, serialNo, issueDate: new Date(),
            certificateType: 'completion',
            verificationUrl, status: 'issued'
        });

        await certificate.save();
        return res.status(201).json({ success: true, message: 'Certificate issued', data: certificate });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/certificates', async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};
        if (status) query.status = status;
        
        if (search) {
            query.$or = [
                { certificateNo: new RegExp(search, 'i') },
                { serialNo: new RegExp(search, 'i') }
            ];
        }

        const certificates = await Certificate.find(query).populate('studentId', 'name appNo').populate('courseId', 'name code');
        return res.status(200).json({ success: true, message: 'Certificates retrieved', data: certificates });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/certificates/:id/revoke', async (req, res) => {
    try {
        const certificate = await Certificate.findByIdAndUpdate(req.params.id, { status: 'Revoked' }, { new: true });
        if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
        return res.status(200).json({ success: true, message: 'Certificate revoked', data: certificate });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Payment Management ---
router.post('/payments', paymentValidation, handleValidationErrors, async (req, res) => {
    try {
        const { studentId, amount, paymentType, method, referenceNo } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const year = new Date().getFullYear();
        const seq = await generateNextSequence(`receipt_${year}`);
        const receiptNo = `UICE/REC/${year}/${seq.toString().padStart(5, '0')}`;

        const payment = new Payment({
            studentId, amount, paymentType, method, receiptNo, referenceNo,
            status: (method === 'cash') ? 'completed' : 'pending',
            date: new Date()
        });

        await payment.save();

        if (payment.status === 'completed') {
            student.paidAmount = (student.paidAmount || 0) + Number(amount);
            student.pendingAmount = Math.max(0, (student.totalFee || 0) - student.paidAmount);
            await student.save();
        }

        return res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/payments', async (req, res) => {
    try {
        const { status, studentId } = req.query;
        const query = {};
        if (status) query.status = status;
        if (studentId) query.studentId = studentId;

        const payments = await Payment.find(query).populate('studentId', 'name appNo').sort({ date: -1 });
        return res.status(200).json({ success: true, message: 'Payments retrieved', data: payments });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/payments/:id/verify', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        if (payment.status === 'completed') return res.status(400).json({ success: false, message: 'Payment already completed' });

        payment.status = 'completed';
        payment.verifiedAt = new Date();
        // Assuming verifiedBy can be populated later or we get from req.user
        payment.verifiedBy = req.user.id;
        
        await payment.save();

        const student = await Student.findById(payment.studentId);
        if (student) {
            student.paidAmount = (student.paidAmount || 0) + payment.amount;
            student.pendingAmount = Math.max(0, (student.totalFee || 0) - student.paidAmount);
            await student.save();
        }

        return res.status(200).json({ success: true, message: 'Payment verified', data: payment });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- Settings ---
router.get('/settings', async (req, res) => {
    try {
        const { category } = req.query;
        const query = category ? { category } : {};
        const settings = await Setting.find(query);
        return res.status(200).json({ success: true, message: 'Settings retrieved', data: settings });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { key, value, category } = req.body;
        if (!key || value === undefined) return res.status(400).json({ success: false, message: 'Key and value required' });

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, category, updatedAt: new Date() },
            { new: true, upsert: true }
        );
        return res.status(200).json({ success: true, message: 'Setting updated', data: setting });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// --- User Management ---
router.get('/users', async (req, res) => {
    try {
        // Superadmin only check can be added if needed, but router covers admin & superadmin
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Superadmin access required' });
        }
        const users = await User.find().select('-password');
        return res.status(200).json({ success: true, message: 'Users retrieved', data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Superadmin access required' });
        }
        const updates = req.body;
        delete updates.password; // Don't allow password change here

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, message: 'User updated', data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.put('/users/:id/toggle-active', async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Superadmin access required' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isActive = !user.isActive;
        await user.save();
        
        const updatedUser = user.toObject();
        delete updatedUser.password;

        return res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: updatedUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router;
