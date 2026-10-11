const mongoose = require('mongoose');

const documentRegisterSchema = new mongoose.Schema({
    docType: { 
        type: String, 
        enum: ['certificate', 'marksheet', 'admit_card', 'id_card', 'receipt', 'bonafide', 'character_certificate'], 
        required: true 
    },
    docNumber: { type: String, required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String },
    enrollmentNo: { type: String },
    course: { type: String },
    issueDate: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Valid', 'Revoked', 'Reissued'], default: 'Valid' },
    revokedReason: { type: String },
    verificationUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DocumentRegister', documentRegisterSchema);
