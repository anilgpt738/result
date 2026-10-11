const mongoose = require('mongoose');

const idCardSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    cardNo: { type: String, required: true, unique: true },
    templateName: { type: String, default: 'Torchlight Standard' },
    issueDate: { type: Date, default: Date.now },
    validTill: { type: Date },
    status: { type: String, enum: ['Active', 'Lost', 'Invalidated', 'Reissued'], default: 'Active', index: true },
    reissueReason: { type: String },
    reissueFeeReceiptNo: { type: String },
    qrVerificationUrl: { type: String },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IdCard', idCardSchema);
