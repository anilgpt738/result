const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Settings = require('../models/Settings');
const Counter = require('../models/Counter');

async function seedMasterData() {
    if (mongoose.connection.readyState !== 1) {
        console.log('Connecting to MongoDB for seeding...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiskills_db');
    }

    // 1. Seed Super Admin from .env
    const adminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const adminPassword = process.env.SUPERADMIN_PASSWORD || 'UshaAdmin@2026#Secure';
    const adminName = process.env.SUPERADMIN_NAME || 'Director Anil Kumar Gupta';
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'ushainstitutepahasa@gmail.com';

    let superAdmin = await User.findOne({ username: adminUsername.toLowerCase() });
    if (!superAdmin) {
        superAdmin = new User({
            username: adminUsername.toLowerCase(),
            password: adminPassword,
            name: adminName,
            email: adminEmail,
            role: 'superadmin',
            mustChangePassword: false,
            isActive: true
        });
    } else {
        superAdmin.name = adminName;
        superAdmin.email = adminEmail;
        superAdmin.role = 'superadmin';
        superAdmin.isActive = true;
        superAdmin.password = adminPassword;
    }
    await superAdmin.save();
    console.log('✅ Super Admin ready:', adminUsername);

    // Also seed standard admin user
    let standardAdmin = await User.findOne({ username: 'admin' });
    if (!standardAdmin) {
        standardAdmin = new User({
            username: 'admin',
            password: 'adminpassword123',
            name: 'Institute Administrator',
            email: 'admin@ushainstitute.com',
            role: 'superadmin',
            isActive: true
        });
    } else {
        standardAdmin.role = 'superadmin';
        standardAdmin.isActive = true;
        standardAdmin.password = 'adminpassword123';
    }
    await standardAdmin.save();
    console.log('✅ Admin user ready: admin');

    // 2. Seed Default Settings
    const defaultSettings = [
        {
            key: 'institute_profile',
            category: 'institute',
            description: 'Core institute name, registration and address',
            value: {
                name: 'Usha Institute Of Computer Education',
                nameHindi: 'उषा इंस्टीट्यूट ऑफ कंप्यूटर एजुकेशन',
                atcCode: 'IN/UP/MAU/29172',
                director: 'Anil Kumar Gupta',
                phone: '+91-7275043143',
                email: 'ushainstitutepahasa@gmail.com',
                website: 'www.thebrightfutures.com',
                address: 'Hanuman Mandir ke pass, Pahasa Bazar, Mau, Uttar Pradesh 221705',
                logoUrl: '/assets/images/logo.png',
                sealUrl: '/assets/images/seal.png',
                signatureUrl: '/assets/images/signature.png'
            }
        },
        {
            key: 'payment_config',
            category: 'payment',
            description: 'UPI and Cash configuration',
            value: {
                upiId: process.env.UPI_ID || '7275043143@ybl',
                payeeName: process.env.UPI_NAME || 'Usha Institute Of Computer Education',
                allowCash: true,
                allowUpi: true
            }
        },
        {
            key: 'number_formats',
            category: 'general',
            description: 'Configurable numbering templates for student documents',
            value: {
                enrollment: 'UIS{YEAR}{SEQ5}',
                certificate: 'TBF/{COURSE}/{YEAR}/{SEQ5}',
                marksheet: 'TBF/{COURSE}/{YEAR}/{SEQ4}',
                receipt: 'RCP-{YEAR}-{SEQ6}',
                idCard: 'UIC-{YEAR}-{SEQ5}'
            }
        },
        {
            key: 'grading_scale',
            category: 'exam',
            description: 'Official percentage to grade mapping',
            value: [
                { min: 90, max: 100, grade: 'A+', remark: 'Outstanding' },
                { min: 75, max: 89.99, grade: 'A', remark: 'Excellent' },
                { min: 60, max: 74.99, grade: 'B', remark: 'Good' },
                { min: 45, max: 59.99, grade: 'C', remark: 'Satisfactory' },
                { min: 40, max: 44.99, grade: 'D', remark: 'Pass' },
                { min: 0, max: 39.99, grade: 'F', remark: 'Fail' }
            ]
        },
        {
            key: 'document_backgrounds',
            category: 'certificate',
            description: 'Artwork background paths for documents',
            value: {
                certificateBg: '/assets/backgrounds/cert-bg.jpeg',
                marksheetBg: '/assets/backgrounds/marks-bg.jpeg'
            }
        },
        {
            key: 'affiliation_text',
            category: 'institute',
            description: 'Official affiliation and awarding body legal text',
            value: {
                line1: 'Registered under Section 8, Ministry of Corporate Affairs, Govt. of India | Recognized under CR Act, Ministry of Education (HRD), Govt. of India',
                line2: 'Registered with NITI Aayog, MSME & NCT of Delhi | ISO 9001:2015, 29990:2010, 21001:2025 & 29993:2017 Certified',
                badgeText: 'ISSUED UNDER THE NORMS OF SKILL INDIA & NATIONAL SKILL DEVELOPMENT MISSION (GOVT. OF INDIA)'
            }
        }
    ];

    for (const s of defaultSettings) {
        await Settings.findOneAndUpdate(
            { key: s.key },
            { value: s.value, category: s.category, description: s.description, updatedAt: new Date() },
            { upsert: true, new: true }
        );
    }
    console.log('✅ Institutional Settings seeded');

    // 3. Seed Required Courses (ADCA, DCA, BCC, Tally Prime, DCS)
    const coursesToSeed = [
        {
            code: 'ADCA',
            title: 'Advanced Diploma in Computer Applications',
            name: 'Advanced Diploma in Computer Applications',
            shortName: 'ADCA',
            duration: '12 Months',
            durationMonths: 12,
            eligibility: '10th / 12th Pass or Equivalent',
            status: 'Active',
            isActive: true,
            feePlan: {
                registrationFee: 300,
                installmentCount: 12,
                installmentAmount: 500,
                examMaterialFee: 700,
                otherFee: 0,
                totalFee: 7000
            },
            fee: 7000,
            syllabus: [
                'Computer Fundamentals',
                'Operating System',
                'MS Office: Word, Excel, PowerPoint, Access',
                'Tally Prime',
                'Adobe Photoshop',
                'Internet',
                'Hindi & English Typing',
                'Artificial Intelligence (AI)'
            ],
            subjects: [
                { name: 'Computer Fundamentals & IT', maxMarks: 100, passingMarks: 40 },
                { name: 'MS Office & Office Automation', maxMarks: 100, passingMarks: 40 },
                { name: 'MS Excel & Advanced Excel', maxMarks: 100, passingMarks: 40 },
                { name: 'Internet & Web Technology', maxMarks: 100, passingMarks: 40 },
                { name: 'DBMS', maxMarks: 100, passingMarks: 40 },
                { name: 'Computer Networking', maxMarks: 100, passingMarks: 40 },
                { name: 'Tally & Accounting', maxMarks: 100, passingMarks: 40 },
                { name: 'C Programming & Project Work', maxMarks: 100, passingMarks: 40 }
            ]
        },
        {
            code: 'DCA',
            title: 'Diploma in Computer Applications',
            name: 'Diploma in Computer Applications',
            shortName: 'DCA',
            duration: '6 Months',
            durationMonths: 6,
            eligibility: '10th Pass or Equivalent',
            status: 'Active',
            isActive: true,
            feePlan: {
                registrationFee: 300,
                installmentCount: 6,
                installmentAmount: 500,
                examMaterialFee: 700,
                otherFee: 0,
                totalFee: 4000
            },
            fee: 4000,
            syllabus: [
                'Computer Fundamentals',
                'Operating System',
                'MS Office: Word, Excel, PowerPoint, Access'
            ],
            subjects: [
                { name: 'Computer Fundamentals', maxMarks: 100, passingMarks: 40 },
                { name: 'Operating System (Windows)', maxMarks: 100, passingMarks: 40 },
                { name: 'MS Word, Excel & PowerPoint', maxMarks: 100, passingMarks: 40 },
                { name: 'Database Concepts & Internet', maxMarks: 100, passingMarks: 40 }
            ]
        },
        {
            code: 'BCC',
            title: 'Basic Computer Course',
            name: 'Basic Computer Course',
            shortName: 'BCC',
            duration: '3 Months',
            durationMonths: 3,
            eligibility: '8th / 10th Pass',
            status: 'Active',
            isActive: true,
            feePlan: {
                registrationFee: 250,
                installmentCount: 3,
                installmentAmount: 750,
                examMaterialFee: 0,
                otherFee: 0,
                totalFee: 2500
            },
            fee: 2500,
            syllabus: [
                'Computer Fundamentals',
                'Operating System',
                'LibreOffice Writer',
                'LibreOffice Calc',
                'LibreOffice Impress'
            ],
            subjects: [
                { name: 'Computer Fundamentals & GUI', maxMarks: 100, passingMarks: 40 },
                { name: 'LibreOffice / MS Word', maxMarks: 100, passingMarks: 40 },
                { name: 'Spreadsheet Analysis', maxMarks: 100, passingMarks: 40 },
                { name: 'Internet & Email Concepts', maxMarks: 100, passingMarks: 40 }
            ]
        },
        {
            code: 'TALLY',
            title: 'Tally Prime Computerized Accounting',
            name: 'Tally Prime Computerized Accounting',
            shortName: 'Tally Prime',
            duration: '4 Months',
            durationMonths: 4,
            eligibility: '10th / 12th Pass (Commerce Preferred)',
            status: 'Active',
            isActive: true,
            feePlan: {
                registrationFee: 400,
                installmentCount: 4,
                installmentAmount: 900,
                examMaterialFee: 0,
                otherFee: 0,
                totalFee: 4000
            },
            fee: 4000,
            syllabus: [
                'Company Creation',
                'Accounting Groups and Ledgers',
                'Voucher Entry',
                'Inventory Management',
                'GST and Taxation',
                'Billing and Invoicing',
                'Financial Reports'
            ],
            subjects: [
                { name: 'Company Creation & Grouping', maxMarks: 100, passingMarks: 40 },
                { name: 'Voucher & Journal Entry', maxMarks: 100, passingMarks: 40 },
                { name: 'Inventory & Stock Management', maxMarks: 100, passingMarks: 40 },
                { name: 'GST, Taxation & Balance Sheet', maxMarks: 100, passingMarks: 40 }
            ]
        },
        {
            code: 'DCS',
            title: 'Diploma in Computer Science',
            name: 'Diploma in Computer Science',
            shortName: 'DCS',
            duration: 'To be configured',
            durationMonths: 6,
            eligibility: '10th Pass',
            status: 'Draft', // Draft, not public per specification
            isActive: false,
            feePlan: {
                registrationFee: 0,
                installmentCount: 1,
                installmentAmount: 0,
                examMaterialFee: 0,
                otherFee: 0,
                totalFee: 0
            },
            fee: 0,
            syllabus: ['Course details to be confirmed by Director'],
            subjects: []
        }
    ];

    for (const c of coursesToSeed) {
        await Course.findOneAndUpdate(
            { code: c.code },
            { $set: c },
            { upsert: true, returnDocument: 'after' }
        );
    }
    console.log('✅ 5 Standard Courses seeded (ADCA, DCA, BCC, TALLY, DCS as Draft)');

    // 4. Seed Standard Exam & Student Records
    const Student = require('../models/Student');
    const Exam = require('../models/Exam');
    const Result = require('../models/Result');
    const Certificate = require('../models/Certificate');

    const adcaCourse = await Course.findOne({ code: 'ADCA' });

    let annualExam = await Exam.findOne({ name: 'Annual Examination 2024' });
    if (!annualExam && adcaCourse) {
        annualExam = new Exam({
            name: 'Annual Examination 2024',
            examCycle: 'Annual Exam 2024',
            session: '2023-2024',
            courseId: adcaCourse._id,
            status: 'results_published'
        });
        await annualExam.save();
        console.log('✅ Annual Examination 2024 seeded');
    }

    const standardMarks = [
        { subjectName: 'Computer Fundamentals & IT', maxMarks: 100, marksObtained: 74, grade: 'B', status: 'pass' },
        { subjectName: 'MS Office & Office Automation', maxMarks: 100, marksObtained: 76, grade: 'A', status: 'pass' },
        { subjectName: 'MS Excel & Advanced Excel', maxMarks: 100, marksObtained: 84, grade: 'A', status: 'pass' },
        { subjectName: 'Internet & Web Technology', maxMarks: 100, marksObtained: 83, grade: 'A', status: 'pass' },
        { subjectName: 'DBMS', maxMarks: 100, marksObtained: 78, grade: 'A', status: 'pass' },
        { subjectName: 'Computer Networking', maxMarks: 100, marksObtained: 76, grade: 'A', status: 'pass' },
        { subjectName: 'Tally & Accounting', maxMarks: 100, marksObtained: 84, grade: 'A', status: 'pass' },
        { subjectName: 'C Programming & Project Work', maxMarks: 100, marksObtained: 82, grade: 'A', status: 'pass' }
    ];

    // Clean up any test/junk student records with random IDs
    await Student.deleteMany({
        $and: [
            { rollNo: { $nin: ['202536924646', 'ROLL2026001', 'ROLL2026002', 'ROLL2026003'] } },
            { registrationNo: { $nin: ['202536924646', 'UIS2026001', 'UIS2026002', 'UIS2026003'] } }
        ]
    });

    const dcaCourse = await Course.findOne({ code: 'DCA' });
    const tallyCourse = await Course.findOne({ code: 'TALLY' });

    const adcaExamSubjects = [
        { subjectName: 'Computer Fundamentals & IT', maxMarks: 100, examDate: new Date('2027-01-15'), examDateStr: '15 Jan 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 1 (Pahasa Campus)' },
        { subjectName: 'MS Office & Office Automation', maxMarks: 100, examDate: new Date('2027-01-16'), examDateStr: '16 Jan 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 1 (Pahasa Campus)' },
        { subjectName: 'MS Excel & Advanced Excel', maxMarks: 100, examDate: new Date('2027-01-18'), examDateStr: '18 Jan 2027', timeSlot: '02:00 PM - 05:00 PM', shift: 'Afternoon Shift', venue: 'Lab 1 (Pahasa Campus)' },
        { subjectName: 'Internet & Web Technology', maxMarks: 100, examDate: new Date('2027-01-19'), examDateStr: '19 Jan 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 2 (Pahasa Campus)' },
        { subjectName: 'DBMS', maxMarks: 100, examDate: new Date('2027-01-20'), examDateStr: '20 Jan 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 2 (Pahasa Campus)' },
        { subjectName: 'Computer Networking', maxMarks: 100, examDate: new Date('2027-01-21'), examDateStr: '21 Jan 2027', timeSlot: '02:00 PM - 05:00 PM', shift: 'Afternoon Shift', venue: 'Lab 1 (Pahasa Campus)' },
        { subjectName: 'Tally & Accounting', maxMarks: 100, examDate: new Date('2027-01-22'), examDateStr: '22 Jan 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Accounting Lab' },
        { subjectName: 'C Programming & Project Work', maxMarks: 100, examDate: new Date('2027-01-23'), examDateStr: '23 Jan 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 1 (Pahasa Campus)' }
    ];

    let annualExam2026 = await Exam.findOne({ session: '2025-2026', courseId: adcaCourse._id });
    if (!annualExam2026 && adcaCourse) {
        annualExam2026 = new Exam({
            name: 'Annual Examination 2026',
            examCycle: 'JANUARY 2027',
            session: '2025-2026',
            courseId: adcaCourse._id,
            subjects: adcaExamSubjects,
            status: 'results_published'
        });
        await annualExam2026.save();
    } else if (annualExam2026) {
        annualExam2026.subjects = adcaExamSubjects;
        annualExam2026.examCycle = 'JANUARY 2027';
        await annualExam2026.save();
    }

    // 1. Seed Student 001: Omkar Vishwakarma (ADCA)
    let omkar = await Student.findOne({
        $or: [
            { registrationNo: 'UIS2026001' },
            { rollNo: 'ROLL2026001' },
            { admissionNo: '202536924646' },
            { rollNo: '202536924646' }
        ]
    });

    if (!omkar) {
        omkar = new Student({
            name: 'OMKAR VISHWAKARMA',
            fatherName: 'RAMESH VISHWAKARMA',
            motherName: '',
            dob: '2004-09-22',
            gender: 'Male',
            mobile: '7275043143',
            course: 'ADCA',
            courseId: adcaCourse ? adcaCourse._id : null,
            session: '2025-2026',
            examCycle: 'JANUARY 2027',
            rollNo: 'ROLL2026001',
            enrollmentNo: 'UIS2026001',
            registrationNo: 'UIS2026001',
            appNo: 'APP2026001',
            admissionNo: '202536924646',
            photo: '/assets/images/default-student.jpeg',
            totalFee: 7000,
            paidAmount: 7000,
            pendingAmount: 0,
            status: 'completed'
        });
        await omkar.save();
    } else {
        omkar.name = 'OMKAR VISHWAKARMA';
        omkar.fatherName = 'RAMESH VISHWAKARMA';
        omkar.rollNo = 'ROLL2026001';
        omkar.enrollmentNo = 'UIS2026001';
        omkar.registrationNo = 'UIS2026001';
        omkar.appNo = 'APP2026001';
        omkar.admissionNo = '202536924646';
        omkar.course = 'ADCA';
        omkar.courseId = adcaCourse ? adcaCourse._id : null;
        omkar.session = '2025-2026';
        omkar.examCycle = 'JANUARY 2027';
        omkar.status = 'completed';
        await omkar.save();
    }

    if (adcaCourse) {
        let omkarResult = await Result.findOne({ studentId: omkar._id });
        if (!omkarResult) {
            omkarResult = new Result({
                studentId: omkar._id,
                examId: annualExam2026 ? annualExam2026._id : (annualExam ? annualExam._id : null),
                courseId: adcaCourse._id,
                session: '2025-2026',
                marks: standardMarks,
                totalMarks: 637,
                totalMaxMarks: 800,
                percentage: 79.63,
                overallGrade: 'A',
                result: 'Pass',
                mode: 'Regular',
                isPublished: true,
                publishedAt: new Date('2026-07-19')
            });
            await omkarResult.save();
        } else {
            omkarResult.session = '2025-2026';
            omkarResult.marks = standardMarks;
            omkarResult.totalMarks = 637;
            omkarResult.totalMaxMarks = 800;
            omkarResult.percentage = 79.63;
            omkarResult.overallGrade = 'A';
            omkarResult.result = 'Pass';
            omkarResult.isPublished = true;
            await omkarResult.save();
        }

        let omkarCert = await Certificate.findOne({
            $or: [
                { studentId: omkar._id },
                { serialNo: '15001' },
                { certificateNo: 'TBF/ADCA/2026/001' }
            ]
        });
        if (!omkarCert) {
            omkarCert = new Certificate({
                studentId: omkar._id,
                resultId: omkarResult._id,
                courseId: adcaCourse._id,
                certificateType: 'completion',
                certificateNo: 'TBF/ADCA/2026/001',
                marksheetNo: 'TBF/ADCA/2026/M001',
                serialNo: '15001',
                enrollmentNo: 'UIS2026001',
                session: '2025-2026',
                mode: 'Regular',
                issueDate: new Date('2026-07-19'),
                status: 'issued',
                verificationUrl: 'http://localhost:5000/certificate?certNo=UIS2026001'
            });
            await omkarCert.save();
        } else {
            omkarCert.studentId = omkar._id;
            omkarCert.resultId = omkarResult._id;
            omkarCert.courseId = adcaCourse._id;
            omkarCert.certificateNo = 'TBF/ADCA/2026/001';
            omkarCert.marksheetNo = 'TBF/ADCA/2026/M001';
            omkarCert.serialNo = '15001';
            omkarCert.enrollmentNo = 'UIS2026001';
            omkarCert.session = '2025-2026';
            omkarCert.status = 'issued';
            await omkarCert.save();
        }
    }

    // 2. Seed Student 002: Rahul Sharma (DCA)
    let rahul = await Student.findOne({
        $or: [
            { registrationNo: 'UIS2026002' },
            { rollNo: 'ROLL2026002' }
        ]
    });

    const dcaMarks = [
        { subjectName: 'Computer Fundamentals', maxMarks: 100, marksObtained: 82, grade: 'A', status: 'pass' },
        { subjectName: 'Operating System (Windows)', maxMarks: 100, marksObtained: 85, grade: 'A', status: 'pass' },
        { subjectName: 'MS Word, Excel & PowerPoint', maxMarks: 100, marksObtained: 88, grade: 'A', status: 'pass' },
        { subjectName: 'Database Concepts & Internet', maxMarks: 100, marksObtained: 75, grade: 'A', status: 'pass' }
    ];

    if (!rahul) {
        rahul = new Student({
            name: 'RAHUL SHARMA',
            fatherName: 'SURESH SHARMA',
            motherName: 'MANJU SHARMA',
            dob: '2004-08-15',
            gender: 'Male',
            mobile: '9876543210',
            course: 'DCA',
            courseId: dcaCourse ? dcaCourse._id : null,
            session: '2025-2026',
            rollNo: 'ROLL2026002',
            enrollmentNo: 'UIS2026002',
            registrationNo: 'UIS2026002',
            appNo: 'APP2026002',
            photo: '/assets/images/default-student.jpeg',
            totalFee: 4000,
            paidAmount: 4000,
            pendingAmount: 0,
            status: 'completed'
        });
        await rahul.save();
    } else {
        rahul.name = 'RAHUL SHARMA';
        rahul.fatherName = 'SURESH SHARMA';
        rahul.rollNo = 'ROLL2026002';
        rahul.enrollmentNo = 'UIS2026002';
        rahul.registrationNo = 'UIS2026002';
        rahul.appNo = 'APP2026002';
        rahul.course = 'DCA';
        rahul.courseId = dcaCourse ? dcaCourse._id : null;
        rahul.session = '2025-2026';
        rahul.status = 'completed';
        await rahul.save();
    }

    if (dcaCourse) {
        let rahulResult = await Result.findOne({ studentId: rahul._id });
        if (!rahulResult) {
            rahulResult = new Result({
                studentId: rahul._id,
                examId: annualExam2026 ? annualExam2026._id : (annualExam ? annualExam._id : null),
                courseId: dcaCourse._id,
                session: '2025-2026',
                marks: dcaMarks,
                totalMarks: 330,
                totalMaxMarks: 400,
                percentage: 82.50,
                overallGrade: 'A',
                result: 'Pass',
                mode: 'Regular',
                isPublished: true,
                publishedAt: new Date('2026-07-19')
            });
            await rahulResult.save();
        }

        let rahulCert = await Certificate.findOne({
            $or: [
                { studentId: rahul._id },
                { serialNo: '15002' },
                { certificateNo: 'TBF/DCA/2026/002' }
            ]
        });
        if (!rahulCert) {
            rahulCert = new Certificate({
                studentId: rahul._id,
                resultId: rahulResult._id,
                courseId: dcaCourse._id,
                certificateType: 'completion',
                certificateNo: 'TBF/DCA/2026/002',
                marksheetNo: 'TBF/DCA/2026/M002',
                serialNo: '15002',
                enrollmentNo: 'UIS2026002',
                session: '2025-2026',
                mode: 'Regular',
                issueDate: new Date('2026-07-19'),
                status: 'issued',
                verificationUrl: 'http://localhost:5000/certificate?certNo=UIS2026002'
            });
            await rahulCert.save();
        } else {
            rahulCert.studentId = rahul._id;
            rahulCert.resultId = rahulResult._id;
            rahulCert.courseId = dcaCourse._id;
            rahulCert.certificateNo = 'TBF/DCA/2026/002';
            rahulCert.marksheetNo = 'TBF/DCA/2026/M002';
            rahulCert.serialNo = '15002';
            rahulCert.enrollmentNo = 'UIS2026002';
            rahulCert.session = '2025-2026';
            rahulCert.status = 'issued';
            await rahulCert.save();
        }
    }

    // 3. Seed Student 003: Priya Verma (Tally Prime)
    let priya = await Student.findOne({
        $or: [
            { registrationNo: 'UIS2026003' },
            { rollNo: 'ROLL2026003' }
        ]
    });

    const tallyMarks = [
        { subjectName: 'Company Creation & Grouping', maxMarks: 100, marksObtained: 85, grade: 'A', status: 'pass' },
        { subjectName: 'Voucher & Journal Entry', maxMarks: 100, marksObtained: 86, grade: 'A', status: 'pass' },
        { subjectName: 'Inventory & Stock Management', maxMarks: 100, marksObtained: 84, grade: 'A', status: 'pass' },
        { subjectName: 'GST, Taxation & Balance Sheet', maxMarks: 100, marksObtained: 90, grade: 'A+', status: 'pass' }
    ];

    if (!priya) {
        priya = new Student({
            name: 'PRIYA VERMA',
            fatherName: 'MAHESH VERMA',
            motherName: 'SUNITA VERMA',
            dob: '2005-03-12',
            gender: 'Female',
            mobile: '9876501234',
            course: 'TALLY',
            courseId: tallyCourse ? tallyCourse._id : null,
            session: '2025-2026',
            rollNo: 'ROLL2026003',
            enrollmentNo: 'UIS2026003',
            registrationNo: 'UIS2026003',
            appNo: 'APP2026003',
            photo: '/assets/images/default-student.jpeg',
            totalFee: 4000,
            paidAmount: 4000,
            pendingAmount: 0,
            status: 'completed'
        });
        await priya.save();
    } else {
        priya.name = 'PRIYA VERMA';
        priya.fatherName = 'MAHESH VERMA';
        priya.rollNo = 'ROLL2026003';
        priya.enrollmentNo = 'UIS2026003';
        priya.registrationNo = 'UIS2026003';
        priya.appNo = 'APP2026003';
        priya.course = 'TALLY';
        priya.courseId = tallyCourse ? tallyCourse._id : null;
        priya.session = '2025-2026';
        priya.status = 'completed';
        await priya.save();
    }

    if (tallyCourse) {
        let priyaResult = await Result.findOne({ studentId: priya._id });
        if (!priyaResult) {
            priyaResult = new Result({
                studentId: priya._id,
                examId: annualExam2026 ? annualExam2026._id : (annualExam ? annualExam._id : null),
                courseId: tallyCourse._id,
                session: '2025-2026',
                marks: tallyMarks,
                totalMarks: 345,
                totalMaxMarks: 400,
                percentage: 86.25,
                overallGrade: 'A',
                result: 'Pass',
                mode: 'Regular',
                isPublished: true,
                publishedAt: new Date('2026-07-19')
            });
            await priyaResult.save();
        }

        let priyaCert = await Certificate.findOne({
            $or: [
                { studentId: priya._id },
                { serialNo: '15003' },
                { certificateNo: 'TBF/TALLY/2026/003' }
            ]
        });
        if (!priyaCert) {
            priyaCert = new Certificate({
                studentId: priya._id,
                resultId: priyaResult._id,
                courseId: tallyCourse._id,
                certificateType: 'completion',
                certificateNo: 'TBF/TALLY/2026/003',
                marksheetNo: 'TBF/TALLY/2026/M003',
                serialNo: '15003',
                enrollmentNo: 'UIS2026003',
                session: '2025-2026',
                mode: 'Regular',
                issueDate: new Date('2026-07-19'),
                status: 'issued',
                verificationUrl: 'http://localhost:5000/certificate?certNo=UIS2026003'
            });
            await priyaCert.save();
        } else {
            priyaCert.studentId = priya._id;
            priyaCert.resultId = priyaResult._id;
            priyaCert.courseId = tallyCourse._id;
            priyaCert.certificateNo = 'TBF/TALLY/2026/003';
            priyaCert.marksheetNo = 'TBF/TALLY/2026/M003';
            priyaCert.serialNo = '15003';
            priyaCert.enrollmentNo = 'UIS2026003';
            priyaCert.session = '2025-2026';
            priyaCert.status = 'issued';
            await priyaCert.save();
        }
    }

    // Set Counters safely without regressing backwards
    const initCounters = [
        { name: 'student_2026', min: 3 },
        { name: 'cert_2026_ADCA', min: 1 },
        { name: 'cert_2026_DCA', min: 2 },
        { name: 'cert_2026_TALLY', min: 3 },
        { name: 'cert_serial', min: 3 },
        { name: 'receipt_no', min: 3 }
    ];
    for (const item of initCounters) {
        const c = await Counter.findOne({ name: item.name });
        if (!c) {
            await Counter.create({ name: item.name, seq: item.min });
        } else if (c.seq < item.min) {
            c.seq = item.min;
            await c.save();
        }
    }

    console.log('✅ Canonical 2026 Students (001, 002, 003), results, certificates, and counters initialized.');

    console.log('✅ Student records, published results and certificates seeded');
    console.log('✅ Seeding completed successfully.');
}

if (require.main === module) {
    seedMasterData()
        .then(() => mongoose.disconnect())
        .catch(err => {
            console.error('❌ Seeding error:', err);
            process.exit(1);
        });
}

module.exports = seedMasterData;
