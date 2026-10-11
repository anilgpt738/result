const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], default: 'Present' },
    remarks: { type: String }
});

const attendanceSchema = new mongoose.Schema({
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    date: { type: Date, required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    records: [attendanceRecordSchema],
    createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ batchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
