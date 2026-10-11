const mongoose = require('mongoose');

const examSubjectSchema = new mongoose.Schema({
    subjectName: { type: String, required: true },
    paperCode: { type: String },
    maxMarks: { type: Number, default: 100 },
    examDate: { type: Date },
    examDateStr: { type: String }, // formatted date string e.g. "15 Jan 2027"
    startTime: { type: String },
    endTime: { type: String },
    timeSlot: { type: String, default: '10:00 AM - 01:00 PM' },
    shift: { type: String, default: 'Morning Shift' },
    venue: { type: String, default: 'Lab 1 / Center Examination Hall' }
});

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    examCycle: { type: String, required: true },
    session: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    subjects: [examSubjectSchema],
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'results_published'], default: 'scheduled' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
