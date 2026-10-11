const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Counter = require('../models/Counter');
const AuditLog = require('../models/AuditLog');
const { generateReceiptNo } = require('../config/number-generator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Upload directory for payment proof screenshots
const proofDir = path.join(__dirname, '../public/uploads/proofs');
if (!fs.existsSync(proofDir)) {
    fs.mkdirSync(proofDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, proofDir),
    filename: (req, file, cb) => cb(null, `PROOF-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Public Route: GET /api/payments/student/:identifier
 * Retrieve student fee summary and pending installments
 */
router.get('/student/:identifier', async (req, res) => {
    try {
        const id = req.params.identifier.trim();
        const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pattern = new RegExp(`^${escapeRegex(id)}$`, 'i');

        const student = await Student.findOne({
            $or: [
                { enrollmentNo: pattern },
                { appNo: pattern },
                { registrationNo: pattern },
                { rollNo: pattern }
            ]
        }).select('name fatherName course totalFee paidAmount pendingAmount installments status enrollmentNo appNo');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student record not found for this identifier' });
        }

        // Get past receipts
        const receipts = await Payment.find({ studentId: student._id, status: 'success' })
            .select('receiptNo amount method feeHead paidAt upiRefNo')
            .sort({ paidAt: -1 });

        return res.json({
            success: true,
            data: {
                student,
                receipts
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Public Route: POST /api/payments/submit-proof
 * Submit 4-field UPI payment proof:
 *   1. UTR / UPI Ref (12 digits numeric)
 *   2. Transaction Date/Time
 *   3. Payer Name / UPI ID
 *   4. Screenshot upload
 */
router.post('/submit-proof', upload.single('screenshot'), async (req, res) => {
    try {
        const {
            identifier, amount, upiRefNo, transactionDate, payerName, feeHead, installmentNo
        } = req.body;

        if (!identifier || !identifier.trim()) {
            return res.status(400).json({ success: false, message: 'Student enrollment or application number is required' });
        }
        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
        }
        if (!upiRefNo || !upiRefNo.trim()) {
            return res.status(400).json({ success: false, message: '12-digit UPI Reference Number (UTR) is required' });
        }

        const cleanUtr = upiRefNo.trim();
        if (!/^\d{12}$/.test(cleanUtr)) {
            return res.status(400).json({ success: false, message: 'UTR must be exactly 12 numeric digits' });
        }

        // Check if UTR already exists in system (Unique constraint across all payments)
        const existingPayment = await Payment.findOne({ upiRefNo: cleanUtr });
        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: `This UTR (${cleanUtr}) has already been submitted on ${new Date(existingPayment.createdAt).toLocaleDateString()}. Duplicate submissions are rejected.`
            });
        }

        // Resolve student
        const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pattern = new RegExp(`^${escapeRegex(identifier.trim())}$`, 'i');
        const student = await Student.findOne({
            $or: [
                { enrollmentNo: pattern },
                { appNo: pattern },
                { registrationNo: pattern },
                { rollNo: pattern }
            ]
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student record not found for this identifier' });
        }

        const screenshotPath = req.file ? `/uploads/proofs/${req.file.filename}` : '';
        const tempReceiptNo = `PENDING-${Date.now().toString().slice(-6)}`;

        const payment = new Payment({
            studentId: student._id,
            receiptNo: tempReceiptNo, // Replaced with official UICE/R receipt on approval
            feeHead: feeHead || 'monthly_installment',
            installmentNo: installmentNo ? Number(installmentNo) : undefined,
            amount: Number(amount),
            currency: 'INR',
            method: 'upi',
            upiRefNo: cleanUtr,
            transactionId: cleanUtr,
            screenshot: screenshotPath,
            status: 'pending',
            remarks: `Payer: ${payerName || 'N/A'}, Date: ${transactionDate || new Date().toISOString()}`,
            paidAt: transactionDate ? new Date(transactionDate) : new Date()
        });

        await payment.save();

        // Audit Log
        await AuditLog.create({
            action: 'UPI_PROOF_SUBMITTED',
            resource: 'Payment',
            resourceId: payment._id.toString(),
            details: {
                student: student.name,
                enrollmentNo: student.enrollmentNo || student.appNo,
                utr: cleanUtr,
                amount
            },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.status(201).json({
            success: true,
            message: 'UPI payment proof submitted successfully! Verification takes 2-4 business hours.',
            data: {
                paymentId: payment._id,
                utr: cleanUtr,
                amount,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Submit Proof Error:', error);
        return res.status(500).json({ success: false, message: 'Server error saving proof: ' + error.message });
    }
});

/**
 * Public Route: GET /api/payments/receipt/:receiptNo
 * Printable Fee Receipt lookup
 */
router.get('/receipt/:receiptNo', async (req, res) => {
    try {
        const payment = await Payment.findOne({ receiptNo: req.params.receiptNo.trim(), status: 'success' })
            .populate('studentId', 'name fatherName enrollmentNo rollNo course mobile session');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Official receipt not found or not yet approved' });
        }

        return res.json({ success: true, data: payment });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Protected Admin Route: GET /api/payments/pending-proofs
 * List all pending UPI proofs for accountant reconciliation
 */
router.get('/pending-proofs', authenticateToken, authorizeRoles('superadmin', 'admin', 'accountant'), async (req, res) => {
    try {
        const pendingPayments = await Payment.find({ status: 'pending' })
            .populate('studentId', 'name fatherName enrollmentNo appNo rollNo course mobile')
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: pendingPayments.length,
            data: pendingPayments
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Protected Admin Route: POST /api/payments/:id/verify-proof
 * Reconcile and approve UPI payment, atomically issuing official UICE/R receipt number
 */
router.post('/:id/verify-proof', authenticateToken, authorizeRoles('superadmin', 'admin', 'accountant'), async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }
        if (payment.status === 'success') {
            return res.status(400).json({ success: false, message: 'Payment is already approved' });
        }

        const student = await Student.findById(payment.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student record not found' });
        }

        // Generate official financial year receipt number
        // e.g. FY 2025-26 -> '2026'
        const currentYear = new Date().getFullYear();
        const fy = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
        let receiptSeq = await Counter.getNextSequence('receipt_no');
        let officialReceiptNo = generateReceiptNo(fy, receiptSeq);
        while (await Payment.exists({ receiptNo: officialReceiptNo })) {
            receiptSeq = await Counter.getNextSequence('receipt_no');
            officialReceiptNo = generateReceiptNo(fy, receiptSeq);
        }

        payment.receiptNo = officialReceiptNo;
        payment.status = 'success';
        payment.verifiedBy = req.user.id;
        payment.verifiedAt = new Date();
        payment.receiptGenerated = true;
        await payment.save();

        // Update student fee ledger
        student.paidAmount = (student.paidAmount || 0) + payment.amount;
        student.pendingAmount = Math.max(0, (student.totalFee || 7000) - student.paidAmount);

        // Update corresponding installment if exists
        if (student.installments && student.installments.length > 0) {
            let remainingCredit = payment.amount;
            for (const inst of student.installments) {
                if (inst.status !== 'Paid' && remainingCredit > 0) {
                    const need = inst.amount - (inst.paidAmount || 0);
                    if (remainingCredit >= need) {
                        inst.paidAmount = inst.amount;
                        inst.status = 'Paid';
                        inst.paidAt = new Date();
                        inst.receiptId = payment._id;
                        remainingCredit -= need;
                    } else {
                        inst.paidAmount = (inst.paidAmount || 0) + remainingCredit;
                        inst.status = 'Partially Paid';
                        remainingCredit = 0;
                    }
                }
            }
        }

        await student.save();

        // Audit Log
        await AuditLog.create({
            userId: req.user.id,
            userName: req.user.name || 'Accountant',
            role: req.user.role,
            action: 'APPROVE_UPI_PAYMENT',
            resource: 'Payment',
            resourceId: payment._id.toString(),
            details: {
                receiptNo: officialReceiptNo,
                student: student.name,
                utr: payment.upiRefNo,
                amount: payment.amount
            },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.json({
            success: true,
            message: `Payment verified successfully! Receipt Number: ${officialReceiptNo}`,
            data: {
                payment,
                receiptNo: officialReceiptNo,
                studentBalance: {
                    totalFee: student.totalFee,
                    paidAmount: student.paidAmount,
                    pendingAmount: student.pendingAmount
                }
            }
        });

    } catch (error) {
        console.error('Verify Proof Error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

/**
 * Protected Admin Route: POST /api/payments/:id/reject-proof
 */
router.post('/:id/reject-proof', authenticateToken, authorizeRoles('superadmin', 'admin', 'accountant'), async (req, res) => {
    try {
        const { reason } = req.body;
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        payment.status = 'failed';
        payment.rejectionReason = reason || 'Bank transaction mismatch';
        payment.updatedAt = new Date();
        await payment.save();

        await AuditLog.create({
            userId: req.user.id,
            userName: req.user.name || 'Accountant',
            role: req.user.role,
            action: 'REJECT_UPI_PAYMENT',
            resource: 'Payment',
            resourceId: payment._id.toString(),
            details: { utr: payment.upiRefNo, reason },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.json({ success: true, message: 'Payment rejected', data: payment });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Protected Admin Route: POST /api/payments/record-cash
 * Record in-person cash payment at institute counter
 */
router.post('/record-cash', authenticateToken, authorizeRoles('superadmin', 'admin', 'accountant'), async (req, res) => {
    try {
        const { studentId, amount, feeHead, remarks } = req.body;

        if (!studentId || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Student ID and valid amount required' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const currentYear = new Date().getFullYear();
        const fy = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
        let receiptSeq = await Counter.getNextSequence('receipt_no');
        let officialReceiptNo = generateReceiptNo(fy, receiptSeq);
        while (await Payment.exists({ receiptNo: officialReceiptNo })) {
            receiptSeq = await Counter.getNextSequence('receipt_no');
            officialReceiptNo = generateReceiptNo(fy, receiptSeq);
        }

        const payment = new Payment({
            studentId: student._id,
            receiptNo: officialReceiptNo,
            feeHead: feeHead || 'monthly_installment',
            amount: Number(amount),
            currency: 'INR',
            method: 'cash',
            status: 'success',
            paidAt: new Date(),
            verifiedBy: req.user.id,
            verifiedAt: new Date(),
            receiptGenerated: true,
            remarks: remarks || 'Cash collected at institute counter'
        });

        await payment.save();

        student.paidAmount = (student.paidAmount || 0) + Number(amount);
        student.pendingAmount = Math.max(0, (student.totalFee || 7000) - student.paidAmount);
        await student.save();

        await AuditLog.create({
            userId: req.user.id,
            userName: req.user.name || 'Accountant',
            role: req.user.role,
            action: 'RECORD_CASH_PAYMENT',
            resource: 'Payment',
            resourceId: payment._id.toString(),
            details: { receiptNo: officialReceiptNo, amount, student: student.name },
            ip: req.ip || req.connection.remoteAddress
        });

        return res.status(201).json({
            success: true,
            message: `Cash receipt ${officialReceiptNo} recorded successfully!`,
            data: payment
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
