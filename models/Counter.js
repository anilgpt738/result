const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

counterSchema.statics.getNextSequence = async function(counterName) {
    const counter = await this.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
