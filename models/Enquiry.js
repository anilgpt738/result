const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    course: { type: String, default: 'ADCA' },
    source: { type: String, enum: ['Direct Visit', 'Website', 'Referral', 'Social Media', 'Other'], default: 'Website' },
    followUpDate: { type: Date },
    status: { type: String, enum: ['New', 'Follow-up', 'Converted', 'Lost'], default: 'New' },
    notes: { type: String },
    convertedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
