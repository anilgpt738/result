const assert = require('assert');

async function runCourseExamTests() {
    console.log('Testing Course & Exam Dynamic Features...');
    const baseUrl = 'http://localhost:5000';

    // 1. Authenticate as admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'superadmin', password: 'UshaAdmin@2026#Secure' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true, 'Admin login failed');
    const token = loginData.data.token;
    console.log('✅ 1. Admin authenticated successfully');

    // 2. Fetch all courses
    const coursesRes = await fetch(`${baseUrl}/api/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const coursesData = await coursesRes.json();
    assert.strictEqual(coursesData.success, true);
    assert.ok(coursesData.data.length >= 4, 'Should have at least 4 seeded courses');
    const adca = coursesData.data.find(c => c.code === 'ADCA');
    assert.ok(adca, 'ADCA course must exist');
    assert.strictEqual(adca.subjects.length, 8, 'ADCA should have 8 subjects configured');
    console.log('✅ 2. Dynamic courses retrieved, ADCA has 8 subjects with max & pass marks');

    const testCode = 'TWEB' + Date.now().toString().slice(-4);
    // 3. Create a custom course with subjects
    const newCourseRes = await fetch(`${baseUrl}/api/admin/courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            code: testCode,
            name: 'Web Development Certification',
            shortName: 'WebDev',
            duration: '3 Months',
            durationMonths: 3,
            fee: 3500,
            subjects: [
                { name: 'HTML & CSS Fundamentals', maxMarks: 100, passingMarks: 40 },
                { name: 'JavaScript & DOM', maxMarks: 100, passingMarks: 40 },
                { name: 'Project & Hosting', maxMarks: 100, passingMarks: 40 }
            ]
        })
    });
    const newCourseData = await newCourseRes.json();
    if (!newCourseData.success) console.error('newCourseData error:', newCourseData);
    assert.strictEqual(newCourseData.success, true, 'Failed to create custom course');
    const createdCourseId = newCourseData.data._id;
    console.log('✅ 3. Custom Course created with dynamic subjects');

    // 4. Create an Exam with Multi-Date Timetable
    const examRes = await fetch(`${baseUrl}/api/admin/exams`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'Web Dev March Examination 2027',
            examCycle: 'MARCH 2027',
            session: '2026-2027',
            courseId: createdCourseId,
            status: 'scheduled',
            subjects: [
                { subjectName: 'HTML & CSS Fundamentals', examDate: new Date('2027-03-10'), examDateStr: '10 Mar 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 1' },
                { subjectName: 'JavaScript & DOM', examDate: new Date('2027-03-12'), examDateStr: '12 Mar 2027', timeSlot: '02:00 PM - 05:00 PM', shift: 'Afternoon Shift', venue: 'Lab 1' },
                { subjectName: 'Project & Hosting', examDate: new Date('2027-03-14'), examDateStr: '14 Mar 2027', timeSlot: '10:00 AM - 01:00 PM', shift: 'Morning Shift', venue: 'Lab 2' }
            ]
        })
    });
    const examData = await examRes.json();
    assert.strictEqual(examData.success, true, 'Failed to create exam schedule');
    assert.strictEqual(examData.data.subjects.length, 3, 'Exam must have 3 timetable slots');
    console.log('✅ 4. Exam scheduled with 3 distinct dates, shifts, and venues');

    // 5. Verify Student 001 Admit Card API returns Multi-Date Schedule
    const admitRes = await fetch(`${baseUrl}/api/students/admit-card/UIS2026001`);
    const admitData = await admitRes.json();
    assert.strictEqual(admitData.success, true, 'Admit card retrieval failed');
    const studentObj = admitData.student || (admitData.data && admitData.data.student);
    const examObj = admitData.exam || (admitData.data && admitData.data.exam);
    assert.ok(studentObj, 'Student object must exist in admit card response');
    assert.strictEqual(studentObj.name, 'OMKAR VISHWAKARMA');
    assert.ok(examObj && examObj.subjects && examObj.subjects.length >= 8, 'Admit card must include multi-date exam subjects');
    assert.strictEqual(examObj.subjects[0].examDateStr, '15 Jan 2027');
    assert.strictEqual(examObj.subjects[0].timeSlot, '10:00 AM - 01:00 PM');
    console.log('✅ 5. Student 001 Admit Card returns all 8 multi-date examination slots');

    // 6. Verify Public Certificate & Result Verification for 001, 002, 003
    for (const roll of ['UIS2026001', 'UIS2026002', 'UIS2026003']) {
        const certRes = await fetch(`${baseUrl}/api/public/verify/certificate/${roll}`);
        const certData = await certRes.json();
        assert.strictEqual(certData.success, true, `Certificate verification failed for ${roll}`);
        const cStudent = certData.student || (certData.data && certData.data.student);
        const cCert = certData.certificate || (certData.data && certData.data.certificate);
        const cResult = certData.result || (certData.data && certData.data.result);
        assert.ok(cCert, `Missing certificate for ${roll}`);
        assert.ok(cResult, `Missing result for ${roll}`);
        console.log(`✅ 6. Verified canonical student ${roll}: ${cStudent.name}`);
    }

    // 7. Cleanup created test course and exam
    await fetch(`${baseUrl}/api/admin/exams/${examData.data._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    await fetch(`${baseUrl}/api/admin/courses/${createdCourseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 7. Test course and exam cleaned up');

    console.log('\n🎉 ALL COURSE & EXAM DYNAMIC TESTS PASSED PERFECTLY!\n');
}

runCourseExamTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
