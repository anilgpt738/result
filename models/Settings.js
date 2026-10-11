const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    category: { type: String, enum: ['institute', 'payment', 'certificate', 'exam', 'general'], default: 'general' },
    description: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

settingsSchema.statics.getSetting = async function(key) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : null;
};

settingsSchema.statics.setSetting = async function(key, value, category = 'general', description = '') {
    return await this.findOneAndUpdate(
        { key },
        { value, category, description, updatedAt: Date.now() },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('Settings', settingsSchema);
