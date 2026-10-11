const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'System' },
    role: { type: String, default: 'superadmin' },
    action: { type: String, required: true }, // e.g. "CREATE_STUDENT", "APPROVE_UPI", "ISSUE_CERTIFICATE", "VOID_PAYMENT"
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
