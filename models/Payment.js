const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    receiptNo: { type: String, required: true, unique: true, index: true },
    feeHead: { 
        type: String, 
        enum: ['registration', 'admission_fee', 'full_course_fee', 'monthly_installment', 'exam_fee', 'material_fee', 'id_card_fee', 'duplicate_cert_fee', 'late_fee', 'tuition', 'other'],
        default: 'monthly_installment'
    },
    paymentType: { type: String, default: 'tuition' }, // legacy compatibility
    installmentNo: { type: Number },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['cash', 'upi'], required: true },
    
    // UPI Reconciliation fields
    upiRefNo: { type: String, sparse: true, index: true }, // UTR 12 digits unique
    transactionId: { type: String },
    screenshot: { type: String }, // uploaded proof
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded', 'void'], default: 'pending', index: true },
    
    paidAt: { type: Date, default: Date.now },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    
    // Void / Refund audit trail (no hard deletes)
    isVoid: { type: Boolean, default: false },
    voidedAt: { type: Date },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String },

    receiptGenerated: { type: Boolean, default: true },
    remarks: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
