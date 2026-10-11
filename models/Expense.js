const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseNo: { type: String, required: true, unique: true },
    category: { 
        type: String, 
        enum: ['rent', 'electricity', 'salary', 'internet', 'stationery', 'maintenance', 'other'], 
        required: true 
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: ['cash', 'upi'], default: 'cash' },
    billFile: { type: String },
    payeeName: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
