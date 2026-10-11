const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, trim: true },
    mobile: { type: String },
    // 4 Authorized Roles: Super Admin, Accountant, Teacher/Operator, Student
    role: { 
        type: String, 
        enum: ['superadmin', 'admin', 'accountant', 'teacher', 'student'], 
        required: true,
        default: 'superadmin',
        index: true
    },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLogin: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
