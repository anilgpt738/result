const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runBackup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiskills_db');
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  const backupDir = path.join(__dirname, '..', 'backups', 'backup_' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('Backing up collections to', backupDir);
  for (const c of cols) {
    const docs = await db.collection(c.name).find({}).toArray();
    fs.writeFileSync(path.join(backupDir, c.name + '.json'), JSON.stringify(docs, null, 2));
    console.log('Backed up', c.name, ':', docs.length, 'records');
  }
  console.log('Backup finished successfully.');
}

if (require.main === module) {
    runBackup()
        .then(() => mongoose.disconnect())
        .catch(err => {
            console.error('Backup error:', err);
            mongoose.disconnect();
        });
}

module.exports = runBackup;
