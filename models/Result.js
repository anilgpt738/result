const mongoose = require('mongoose');
require('./Student');
require('./Course');
require('./Exam');

const marksSchema = new mongoose.Schema({
    subjectName: { type: String, required: true },
    maxMarks: { type: Number, default: 100 },
    marksObtained: { type: Number, required: true, min: 0 },
    grade: { type: String },
    status: { type: String, enum: ['pass', 'fail', 'absent', 'withheld'], default: 'pass' }
});

const resultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    session: { type: String, required: true },
    marks: [marksSchema],
    totalMarks: { type: Number },
    totalMaxMarks: { type: Number },
    percentage: { type: Number },
    overallGrade: { type: String },
    result: { type: String, enum: ['Pass', 'Fail', 'Absent', 'Withheld', 'Incomplete'], default: 'Pass' },
    mode: { type: String, default: 'Regular' },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

resultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 75) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 45) return 'C';
    return 'F';
}

resultSchema.pre('save', function() {
    let totalObtained = 0;
    let totalMax = 0;
    let anyFail = false;

    if (this.marks && this.marks.length > 0) {
        this.marks.forEach(m => {
            const obt = Number(m.marksObtained) || 0;
            const max = Number(m.maxMarks) || 100;
            const pass = Number(m.passingMarks) || 40;

            totalObtained += obt;
            totalMax += max;

            let subjectPerc = max > 0 ? (obt / max) * 100 : 0;
            m.grade = getGrade(subjectPerc);

            if (m.status === 'fail' || obt < pass) {
                anyFail = true;
                m.status = 'fail';
            } else {
                m.status = 'pass';
            }
        });
    }

    this.totalMarks = totalObtained;
    this.totalMaxMarks = totalMax;
    
    // Exact half-up rounding for percentage (e.g., 637 / 800 * 100 = 79.625 -> 79.63)
    this.percentage = totalMax > 0 ? Math.floor((totalObtained / totalMax) * 10000 + 0.5) / 100 : 0;

    if (anyFail || this.percentage < 40) {
        this.overallGrade = 'F';
        this.result = 'Fail';
    } else {
        this.overallGrade = getGrade(this.percentage);
        if (this.result !== 'Absent' && this.result !== 'Withheld' && this.result !== 'Incomplete') {
            this.result = 'Pass';
        }
    }
});

module.exports = mongoose.model('Result', resultSchema);
