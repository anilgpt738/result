const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    console.log('⚠️ WARNING: Resetting database collections...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiskills_db');
    
    const db = mongoose.connection.db;
    const collectionsToDrop = [
        'certificates', 'results', 'exams', 'payments', 
        'batches', 'attendances', 'expenses', 'enquiries', 
        'idcards', 'documentregisters', 'auditlogs',
        'students', 'courses', 'counters', 'settings', 'users'
    ];

    for (const c of collectionsToDrop) {
        try {
            await db.collection(c).drop();
            console.log(`Dropped collection: ${c}`);
        } catch (e) {
            // collection might not exist, ignore
        }
    }

    console.log('Database reset complete. Now re-running master seeds...');

    const seedMasterData = require('./seed-database');
    await seedMasterData();
    console.log('✅ Database reset & re-seeded cleanly.');
}

if (require.main === module) {
    resetDatabase()
        .then(() => mongoose.disconnect())
        .catch(err => {
            console.error('Reset error:', err);
            mongoose.disconnect();
        });
}

module.exports = resetDatabase;
