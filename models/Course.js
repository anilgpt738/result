const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    code: { type: String },
    name: { type: String, required: true },
    theoryMax: { type: Number, default: 70 },
    practicalMax: { type: Number, default: 30 },
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 40 }
});

const courseSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true }, // alias for backward-compatibility
    shortName: { type: String, trim: true },
    duration: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    eligibility: { type: String, default: '10th / 12th Pass or Equivalent' },
    status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Active' },
    isActive: { type: Boolean, default: true },
    
    // Explicit fee plan components (validated to sum to totalFee)
    feePlan: {
        registrationFee: { type: Number, required: true, default: 0 },
        installmentCount: { type: Number, required: true, default: 1 },
        installmentAmount: { type: Number, required: true, default: 0 },
        examMaterialFee: { type: Number, required: true, default: 0 },
        otherFee: { type: Number, default: 0 },
        totalFee: { type: Number, required: true, default: 0 }
    },
    fee: { type: Number, required: true, default: 0 }, // mirror of totalFee
    
    syllabus: [{ type: String }],
    subjects: [subjectSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-validate hook: Ensure title/name and feePlan defaults before schema validation
courseSchema.pre('validate', function() {
    if (!this.name && this.title) this.name = this.title;
    if (!this.title && this.name) this.title = this.name;
    const totalFee = Number(this.fee) || (this.feePlan ? Number(this.feePlan.totalFee) || 0 : 0);
    if (!this.feePlan) {
        this.feePlan = {
            registrationFee: 0,
            installmentCount: 1,
            installmentAmount: totalFee,
            examMaterialFee: 0,
            otherFee: 0,
            totalFee: totalFee
        };
    } else {
        const calculatedTotal = (this.feePlan.registrationFee || 0) + 
            ((this.feePlan.installmentCount || 0) * (this.feePlan.installmentAmount || 0)) + 
            (this.feePlan.examMaterialFee || 0) + 
            (this.feePlan.otherFee || 0);
        if (!this.feePlan.totalFee || this.feePlan.totalFee === 0) {
            this.feePlan.totalFee = calculatedTotal || totalFee;
        }
    }
    this.fee = this.feePlan.totalFee;
    this.updatedAt = new Date();
});

module.exports = mongoose.model('Course', courseSchema);
