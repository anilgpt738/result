const mongoose = require('mongoose');

// Paper / Module Schema
const paperSchema = new mongoose.Schema({
    code: { type: String, default: "" },
    name: { type: String, default: "" },
    theoryMarks: { type: Number, default: 0 },
    practicalMarks: { type: Number, default: 0 }
});

const installmentScheduleSchema = new mongoose.Schema({
    installmentNo: { type: Number, required: true },
    title: { type: String, default: 'Monthly Installment' },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Partially Paid', 'Overdue'], default: 'Pending' },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
});

const studentSchema = new mongoose.Schema({
    appNo: { type: String, default: "", index: true },
    registrationNo: { type: String, default: "", index: true },
    rollNo: { type: String, default: "", index: true },
    admissionNo: { type: String, sparse: true, index: true },
    enrollmentNo: { type: String, sparse: true, index: true },
    
    name: { type: String, required: true, trim: true },
    nameHindi: { type: String, default: "" },
    fatherName: { type: String, default: "", trim: true },
    motherName: { type: String, default: "", trim: true },
    dob: { type: String, default: "" },
    gender: { type: String, default: "Male" },
    category: { type: String, default: "General" },
    mobile: { type: String, default: "", index: true },
    altMobile: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    state: { type: String, default: "Uttar Pradesh" },
    district: { type: String, default: "Mau" },
    pincode: { type: String, default: "221705" },
    qualification: { type: String, default: "12th" },
    bloodGroup: { type: String, default: "" },
    aadhaarNum: { type: String, default: "" },
    apaarId: { type: String, default: "" },

    course: { type: String, default: "ADCA" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    batch: { type: String, default: "Morning Batch" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    session: { type: String, default: "2023-2024" },
    examCycle: { type: String, default: "Annual Exam" },
    admissionDate: { type: Date, default: Date.now },
    joiningDate: { type: Date, default: Date.now },

    // Status: Applied, Approved, Enrolled, Active, Completed, Dropped, Suspended
    status: { 
        type: String, 
        enum: ['applied', 'approved', 'enrolled', 'admitted', 'active', 'completed', 'dropped', 'suspended'], 
        default: 'applied',
        index: true
    },
    
    // Fee ledger
    fee: { type: String, default: "" },
    totalFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountReason: { type: String, default: "" },
    discountApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    netFee: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    installments: [installmentScheduleSchema],

    // Photos & documents
    photo: { type: String, default: "/assets/images/default-student.jpeg" },
    signature: { type: String, default: "" },
    thumb: { type: String, default: "" },
    idProof: { type: String, default: "" },

    // ID Card status
    idCardStatus: { 
        type: String, 
        enum: ['Not Requested', 'Requested', 'Printed', 'Issued', 'Lost', 'Reissued'], 
        default: 'Not Requested' 
    },
    idCardNumber: { type: String, sparse: true },
    idCardIssuedAt: { type: Date },

    // Credentials
    password: { type: String },
    mustChangePassword: { type: Boolean, default: false },

    // Papers / Exam marks
    papers: [paperSchema],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);