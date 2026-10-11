const mongoose = require('mongoose');
require('./Student');
require('./Course');
require('./Result');

const certificateSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateType: { type: String, enum: ['completion', 'marksheet'], required: true },
    certificateNo: { type: String, required: true, unique: true },
    marksheetNo: { type: String, unique: true, sparse: true },
    serialNo: { type: String, required: true, unique: true },
    enrollmentNo: { type: String },
    session: { type: String },
    issueDate: { type: Date, default: Date.now },
    mode: { type: String, default: 'Regular' },
    status: { type: String, enum: ['draft', 'issued', 'revoked'], default: 'draft' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokedReason: { type: String },
    qrCodeData: { type: String },
    verificationUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
