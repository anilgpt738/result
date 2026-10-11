const fs = require('fs');
const path = require('path');
const { generateQrDataUrl } = require('./pdf-service');

/**
 * Render golden landscape certificate from certificate.html template
 */
async function renderGoldenCertificate(data) {
    const certPath = path.join(__dirname, '..', 'certificate.html');
    let template = fs.readFileSync(certPath, 'utf8');

    const qrDataUrl = await generateQrDataUrl(data.verificationUrl || `http://localhost:5000/certificate?certNo=${encodeURIComponent(data.enrollmentNo || data.certificateNo)}`);

    // Dynamic replacements
    template = template
        .replace(/id="cSerialNo">.*?<\/span>/, `id="cSerialNo">${data.serialNo || '15580'}</span>`)
        .replace(/id="cCandidateName">.*?<\/span>/, `id="cCandidateName">${data.name || 'STUDENT NAME'}</span>`)
        .replace(/id="cFatherName">.*?<\/span>/, `id="cFatherName">${data.fatherName || 'FATHER NAME'}</span>`)
        .replace(/id="cCourseName">.*?<\/span>/, `id="cCourseName">${data.courseTitle || data.course || 'Advanced Diploma in Computer Applications'}</span>`)
        .replace(/id="cSession">.*?<\/span>/, `id="cSession">${data.session || '2023-2024'}</span>`)
        .replace(/id="cDuration">.*?<\/span>/, `id="cDuration">${data.duration || '12 Months'}</span>`)
        .replace(/id="cCertNo">.*?<\/span>/, `id="cCertNo">${data.certificateNo || 'TBF/ADCA/2026/00001'}</span>`)
        .replace(/id="cEnrollmentNo">.*?<\/span>/, `id="cEnrollmentNo">${data.enrollmentNo || 'UIS202600001'}</span>`)
        .replace(/id="cGrade">.*?<\/span>/, `id="cGrade">${data.grade || 'A'}</span>`)
        .replace(/id="cPercentage">.*?<\/span>/, `id="cPercentage">${data.percentage || '80.00%'}</span>`)
        .replace(/id="cGrandTotal">.*?<\/span>/, `id="cGrandTotal">${data.totalMarks || 640} / ${data.totalMaxMarks || 800}</span>`)
        .replace(/id="cIssueDate">.*?<\/span>/, `id="cIssueDate">${data.issueDate || new Date().toLocaleDateString('en-GB')}</span>`)
        .replace(/src="[^"]*1787653813\.png"/g, 'src="/assets/images/logo.png"')
        .replace(/src="[^"]*1787653881\.png"/g, 'src="/assets/images/seal.png"')
        .replace(/src="[^"]*signature\.png"/g, 'src="/assets/images/signature.png"')
        .replace(/id="cPhoto"[^>]*src="[^"]*"/, `id="cPhoto" src="${data.photo || '/assets/images/default-student.jpeg'}"`)
        .replace(/id="cQrCode"[^>]*src="[^"]*"/, `id="cQrCode" src="${qrDataUrl}"`)
        .replace(/background-image:\s*url\("[^"]*semester-certificate_design_9\.jpeg"\)/g, 'background-image: url("/assets/backgrounds/cert-bg.jpeg")')
        .replace(/url\("https:\/\/center\.pmkvyedu\.com\/upload\/semester_certificate\/semester-certificate_design_9\.jpeg"\)/g, 'url("/assets/backgrounds/cert-bg.jpeg")');

    return template;
}

/**
 * Render golden portrait marksheet from result.html template
 */
async function renderGoldenMarksheet(data) {
    const marksPath = path.join(__dirname, '..', 'result.html');
    let template = fs.readFileSync(marksPath, 'utf8');

    const qrDataUrl = await generateQrDataUrl(data.verificationUrl || `http://localhost:5000/result?rollNo=${encodeURIComponent(data.rollNo || data.enrollmentNo)}`);

    // Build subject rows dynamically
    const subjects = data.marks || [
        { subjectName: 'Computer Fundamentals & IT', maxMarks: 100, marksObtained: 75, grade: 'A' },
        { subjectName: 'MS Office & Automation', maxMarks: 100, marksObtained: 80, grade: 'A' }
    ];

    let subjectsHtml = '';
    subjects.forEach((s, idx) => {
        subjectsHtml += `
        <tr>
            <td style="border-right: 2px solid #29426b; border-bottom: 1px solid #cbd5e1; text-align: center; padding: 4px;">${idx + 1}.</td>
            <td style="border-right: 2px solid #29426b; border-bottom: 1px solid #cbd5e1; text-align: left; padding: 4px 8px; font-weight: 600;">${s.subjectName}</td>
            <td style="border-right: 2px solid #29426b; border-bottom: 1px solid #cbd5e1; text-align: center; padding: 4px;">${s.maxMarks || 100}</td>
            <td style="border-right: 2px solid #29426b; border-bottom: 1px solid #cbd5e1; text-align: center; padding: 4px; font-weight: 700;">${s.marksObtained}</td>
            <td style="border-bottom: 1px solid #cbd5e1; text-align: center; padding: 4px; font-weight: 700;">${s.grade || 'A'}</td>
        </tr>`;
    });

    template = template
        .replace(/id="dispName">.*?<\/div>/, `id="dispName">${data.name || 'STUDENT NAME'}</div>`)
        .replace(/id="dispRoll">.*?<\/div>/, `id="dispRoll">${data.rollNo || data.enrollmentNo || 'UIS202600001'}</div>`)
        .replace(/id="dispFather">.*?<\/div>/, `id="dispFather">${data.fatherName || 'FATHER NAME'}</div>`)
        .replace(/id="dispCourse">.*?<\/div>/, `id="dispCourse">${data.courseTitle || data.course || 'Advanced Diploma in Computer Applications'}</div>`)
        .replace(/id="dispDob">.*?<\/div>/, `id="dispDob">${data.dob || '01 Jan 2000'}</div>`)
        .replace(/id="dispSession">.*?<\/span>/, `id="dispSession">${data.session || '2023-2024'}</span>`)
        .replace(/id="dispTotalObt">.*?<\/div>/, `id="dispTotalObt">${data.totalMarks || 640}</div>`)
        .replace(/id="dispTotalMax">.*?<\/div>/, `id="dispTotalMax">${data.totalMaxMarks || 800}</div>`)
        .replace(/id="dispPercentage">.*?<\/div>/, `id="dispPercentage">${data.percentage || '80.00%'}</div>`)
        .replace(/id="dispGrade">.*?<\/div>/, `id="dispGrade">${data.grade || 'A'}</div>`)
        .replace(/id="footGrandTotal">.*?<\/span>/, `id="footGrandTotal">${data.totalMarks || 640} / ${data.totalMaxMarks || 800}</span>`)
        .replace(/id="footInWords">.*?<\/span>/, `id="footInWords">${data.inWords || 'Six Hundred Forty Only'}</span>`)
        .replace(/<tbody id="subjectsBody">[\s\S]*?<\/tbody>/, `<tbody id="subjectsBody">${subjectsHtml}</tbody>`)
        .replace(/src="[^"]*1787653813\.png"/g, 'src="/assets/images/logo.png"')
        .replace(/src="[^"]*1787653881\.png"/g, 'src="/assets/images/seal.png"')
        .replace(/src="[^"]*signature\.png"/g, 'src="/assets/images/signature.png"')
        .replace(/id="dispPhoto"[^>]*src="[^"]*"/, `id="dispPhoto" src="${data.photo || '/assets/images/default-student.jpeg'}"`)
        .replace(/background-image:\s*url\("[^"]*semester-marksheet_design_9\.jpeg"\)/g, 'background-image: url("/assets/backgrounds/marks-bg.jpeg")')
        .replace(/url\("https:\/\/center\.pmkvyedu\.com\/upload\/semester_certificate\/semester-marksheet_design_9\.jpeg"\)/g, 'url("/assets/backgrounds/marks-bg.jpeg")');

    return template;
}

module.exports = {
    renderGoldenCertificate,
    renderGoldenMarksheet
};
