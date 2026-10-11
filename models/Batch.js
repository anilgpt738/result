const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    batchCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    timing: { type: String, required: true }, // e.g. "08:00 AM - 10:00 AM"
    teacherName: { type: String, default: 'Anil Kumar Gupta' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: { type: String, default: 'Lab 1' },
    capacity: { type: Number, default: 25 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ['Upcoming', 'Active', 'Completed', 'Cancelled'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);
