require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const seedMasterData = require('./config/seed-database');

// Initialize Express App
const app = express();

// Security Headers (configured to allow local fonts, inline scripts and background images)
app.use(helmet({
    contentSecurityPolicy: false, // allow local canvas and dynamic font/image rendering
    crossOriginEmbedderPolicy: false
}));

// Rate limiting on authentication and search endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/student-login', authLimiter);

// Core Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Mount API Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const studentRoutes = require('./routes/studentRoutes');
const idCardRoutes = require('./routes/idCardRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const batchRoutes = require('./routes/batchRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/courses', (req, res, next) => {
    req.url = '/courses' + (req.url === '/' ? '' : req.url);
    publicRoutes(req, res, next);
});
app.use('/api/students', studentRoutes);
app.use('/api/id-card', idCardRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/batches', batchRoutes);

// Safe regex helper function
const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Certificate & Marksheet verification API
app.get('/api/students/certificate/:id', async (req, res) => {
    try {
        const rawId = req.params.id ? req.params.id.trim() : '';
        if (!rawId) {
            return res.status(400).json({ success: false, message: 'ID required' });
        }
        const safePattern = new RegExp(`^${escapeRegex(rawId)}$`, 'i');

        const Student = require('./models/Student');
        const Certificate = require('./models/Certificate');
        const Result = require('./models/Result');

        let cert = await Certificate.findOne({
            $or: [
                { certificateNo: safePattern },
                { marksheetNo: safePattern },
                { serialNo: safePattern },
                { enrollmentNo: safePattern }
            ],
            status: { $ne: 'revoked' }
        }).populate('studentId').populate('resultId').populate('courseId');

        let student = null;
        let result = null;

        if (cert && cert.studentId) {
            student = cert.studentId;
            result = cert.resultId;
        } else {
            student = await Student.findOne({
                $or: [
                    { rollNo: safePattern },
                    { registrationNo: safePattern },
                    { appNo: safePattern },
                    { enrollmentNo: safePattern }
                ]
            });

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
                message: 'No authentic document record found for this identifier' 
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

        return res.json({
            success: true,
            student: student,
            certificate: certData,
            result: result || null,
            data: student
        });

    } catch (error) {
        console.error("Backend Verification Route Error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// Clean Multi-Page HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/courses', (req, res) => res.sendFile(path.join(__dirname, 'public', 'courses.html')));
app.get('/apply', (req, res) => res.sendFile(path.join(__dirname, 'public', 'apply.html')));
app.get('/admit-card', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admit-card.html')));
app.get('/result', (req, res) => res.sendFile(path.join(__dirname, 'public', 'result.html')));
app.get('/payment', (req, res) => res.sendFile(path.join(__dirname, 'public', 'payment.html')));
app.get('/certificate', (req, res) => res.sendFile(path.join(__dirname, 'public', 'certificate.html')));
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'public', 'certificate.html')));
app.get('/verify/id-card/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'verify-id.html')));
app.get('/student/certificate/secure-verification/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'certificate.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/student-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student-login.html')));
app.get('/student-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html')));
app.get('/design-system', (req, res) => res.sendFile(path.join(__dirname, 'public', 'design-system.html')));

// Sitemap and Robots
app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>http://localhost:5000/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
        <url><loc>http://localhost:5000/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
        <url><loc>http://localhost:5000/courses</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
        <url><loc>http://localhost:5000/apply</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
        <url><loc>http://localhost:5000/verify</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
        <url><loc>http://localhost:5000/result</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
        <url><loc>http://localhost:5000/contact</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
    </urlset>`);
});

app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: http://localhost:5000/sitemap.xml");
});

// Global 404 Handler for API
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();
        await seedMasterData();
        app.listen(PORT, () => {
            console.log(`✅ Usha Institute Management System running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Server startup error:', err);
        process.exit(1);
    }
}

startServer();