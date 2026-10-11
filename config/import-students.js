const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Student = require('../models/Student');
const Course = require('../models/Course');

async function importStudentsFromCsv(filePath) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiskills_db');
    const targetFile = filePath || path.join(__dirname, '..', 'students-import.csv');

    if (!fs.existsSync(targetFile)) {
        console.log(`CSV file not found at ${targetFile}. Generating a sample CSV template...`);
        const sampleHeader = "name,fatherName,mobile,course,dob,gender,address\nRahul Kumar,Indal Kumar,9876543210,ADCA,2002-05-15,Male,Pahasa Bazar Mau\n";
        fs.writeFileSync(targetFile, sampleHeader, 'utf8');
        console.log(`Sample CSV template created at ${targetFile}`);
        return;
    }

    const content = fs.readFileSync(targetFile, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
        console.log('No student records found in CSV.');
        return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim());
        const data = {};
        headers.forEach((h, idx) => { data[h] = row[idx] || ''; });

        if (!data.name || !data.mobile) continue;

        const year = new Date().getFullYear();
        const randSeq = Math.floor(10000 + Math.random() * 90000);
        const appNo = `APP${year}${randSeq}`;
        const enrollNo = `UIS${year}${randSeq}`;

        const existing = await Student.findOne({ mobile: data.mobile, name: data.name });
        if (!existing) {
            const student = new Student({
                appNo,
                registrationNo: enrollNo,
                enrollmentNo: enrollNo,
                rollNo: `ROLL${randSeq}`,
                name: data.name,
                fatherName: data.fathername || data.father_name || '',
                mobile: data.mobile,
                course: (data.course || 'ADCA').toUpperCase(),
                dob: data.dob || '2000-01-01',
                gender: data.gender || 'Male',
                address: data.address || 'Mau, UP',
                status: 'enrolled'
            });
            await student.save();
            imported++;
        }
    }

    console.log(`✅ Successfully imported ${imported} students from CSV.`);
}

if (require.main === module) {
    importStudentsFromCsv(process.argv[2])
        .then(() => mongoose.disconnect())
        .catch(err => {
            console.error(err);
            mongoose.disconnect();
        });
}

module.exports = importStudentsFromCsv;
