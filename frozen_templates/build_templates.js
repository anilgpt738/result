const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname);

// 1. Certificate Template
let certHtml = fs.readFileSync(path.join(targetDir, 'v1_certificate_raw.html'), 'utf8');

// Precise replacements without touching structure or styles
certHtml = certHtml
  .replace('<title>Certificate of OMKAR VISHWAKARMA</title>', '<title>Certificate of {{STUDENT_NAME}}</title>')
  .replace('<strong class="col-red">Serial No.: </strong> <span class="col-red">15579</span>', '<strong class="col-red">Serial No.: </strong> <span class="col-red">{{SERIAL_NO}}</span>')
  .replace(
    `                <div class="st-name col-red">
                    <span style="">
                        OMKAR VISHWAKARMA <br>
                        S/o
                        RAMESH VISHWAKARMA                    </span>
                </div>`,
    `                <div class="st-name col-red">
                    <span style="">
                        {{STUDENT_NAME}} <br>
                        S/o
                        {{FATHER_NAME}}                    </span>
                </div>`
  )
  .replace('Advance Diploma in Computer Application (ADCA)', '{{COURSE_NAME}} ({{COURSE_CODE}})')
  .replace('<span class="col-red">2023-2024</span>', '<span class="col-red">{{SESSION}}</span>')
  .replace('<span class="col-red">12 Months</span>', '<span class="col-red">{{DURATION}}</span>')
  .replace('Certificate No:-</span> TBF/ADCA/2024/31158', 'Certificate No:-</span> {{CERTIFICATE_NO}}')
  .replace('Mode:-</span> Regular', 'Mode:-</span> {{MODE}}')
  .replace('Date Of Issue:-</span> 19 Jul 2024', 'Date Of Issue:-</span> {{DATE_OF_ISSUE}}')
  .replace('Grand Total:-</span> 637 / 800', 'Grand Total:-</span> {{GRAND_TOTAL}}')
  .replace('Enrollment No:-</span> 202536924646', 'Enrollment No:-</span> {{ENROLLMENT_NO}}')
  .replace('Result:-</span> Pass', 'Result:-</span> {{RESULT}}')
  .replace('Grade:-</span> A', 'Grade:-</span> {{GRADE}}')
  .replace('Percentage:-</span> 79.63%', 'Percentage:-</span> {{PERCENTAGE}}')
  .replace('src="./certificate_files/19371787653366.jpeg"', 'src="{{STUDENT_PHOTO_URL}}"')
  .replace('src="./certificate_files/202536924646-221871866204532.png"', 'src="{{QR_CODE_URL}}"');

fs.writeFileSync(path.join(targetDir, 'certificate.template.html'), certHtml);
console.log('✅ Created certificate.template.html (size:', certHtml.length, 'bytes)');

// 2. Marksheet Template
let marksheetHtml = fs.readFileSync(path.join(targetDir, 'v1_marksheet_raw.html'), 'utf8');

marksheetHtml = marksheetHtml
  .replace(
    `    <title>Certificate of
        OMKAR VISHWAKARMA    </title>`,
    `    <title>Marksheet of {{STUDENT_NAME}}</title>`
  )
  .replace('TBF/ADCA/2024/4887', '{{MARKSHEET_NO}}')
  .replace('S.No:- 6387', 'S.No:- {{SERIAL_NO}}')
  .replace(
    `                                    <div style="flex:1;">
                                        <strong>
                                            OMKAR VISHWAKARMA <br> S/o <br>
                                            RAMESH VISHWAKARMA                                        </strong>
                                    </div>`,
    `                                    <div style="flex:1;">
                                        <strong>
                                            {{STUDENT_NAME}} <br> S/o <br>
                                            {{FATHER_NAME}}                                        </strong>
                                    </div>`
  )
  .replace(
    `                                <strong style="color:#29426b;">Course Name With Duration</strong> <br>
                                Advance Diploma in Computer Application <br>
                                12 Months`,
    `                                <strong style="color:#29426b;">Course Name With Duration</strong> <br>
                                {{COURSE_NAME}} <br>
                                {{DURATION}}`
  )
  .replace(
    `                                        <strong style="color:#29426b;">Session</strong> <br>
                                        2023-2024`,
    `                                        <strong style="color:#29426b;">Session</strong> <br>
                                        {{SESSION}}`
  )
  .replace(
    `                                        <strong style="color:#29426b;">Enrollment No.</strong> <br>
                                        202536924646                                    </div>`,
    `                                        <strong style="color:#29426b;">Enrollment No.</strong> <br>
                                        {{ENROLLMENT_NO}}                                    </div>`
  )
  .replace('Grand Total : 637 / 800', 'Grand Total : {{GRAND_TOTAL}}')
  .replace('Six Hundred   Thirty Seven', '{{GRAND_TOTAL_WORDS}}')
  .replace(
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Date
                                    Of Issue</strong>
                                19 Jul 2024                            </td>`,
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Date
                                    Of Issue</strong>
                                {{DATE_OF_ISSUE}}                            </td>`
  )
  .replace(
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Mode</strong>
                                Regular`,
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Mode</strong>
                                {{MODE}}`
  )
  .replace(
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Result</strong>
                                Pass`,
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Result</strong>
                                {{RESULT}}`
  )
  .replace(
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Percentage</strong>
                                79.63%`,
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Percentage</strong>
                                {{PERCENTAGE}}`
  )
  .replace(
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Grade</strong>
                                A                            </td>`,
    `                                <strong style="border-bottom:2px solid #29426b;width:100%;display:block; color:#29426b;">Grade</strong>
                                {{GRADE}}                            </td>`
  )
  .replace('src="./result_files/19371787653366.jpeg"', 'src="{{STUDENT_PHOTO_URL}}"')
  .replace('src="./result_files/202536924646-170854020731761.png"', 'src="{{QR_CODE_URL}}"');

fs.writeFileSync(path.join(targetDir, 'marksheet.template.html'), marksheetHtml);
console.log('✅ Created marksheet.template.html (size:', marksheetHtml.length, 'bytes)');

// 3. Admit Card Template
let admitHtml = fs.readFileSync(path.join(targetDir, 'v1_admit_card_raw.html'), 'utf8');
admitHtml = admitHtml
  .replace('<title>Admit Card - OMKAR VISHWAKARMA</title>', '<title>Admit Card - {{STUDENT_NAME}}</title>')
  .replace('<td class="value">OMKAR VISHWAKARMA</td>', '<td class="value">{{STUDENT_NAME}}</td>')
  .replace('<td class="value">RAMESH VISHWAKARMA</td>', '<td class="value">{{FATHER_NAME}}</td>')
  .replace('<td class="value">202536924646</td>', '<td class="value">{{ENROLLMENT_NO}}</td>')
  .replace('<td class="value">24ADCA0012</td>', '<td class="value">{{ROLL_NO}}</td>')
  .replace('Admit Card No: TBF/AC/2024/00842', 'Admit Card No: {{ADMIT_CARD_NO}}')
  .replace('Date of Issue: 19 Jul 2024', 'Date of Issue: {{DATE_OF_ISSUE}}')
  .replace('Exam Session: 2023-2024', 'Exam Session: {{SESSION}}')
  .replace('<td class="value">2023-2024</td>', '<td class="value">{{SESSION}}</td>')
  .replace('https://center.pmkvyedu.com/upload/student/19371787653366.jpeg', '{{STUDENT_PHOTO_URL}}')
  .replace('https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFIED-OMKAR-2024', '{{QR_CODE_URL}}');

fs.writeFileSync(path.join(targetDir, 'admit_card.template.html'), admitHtml);
console.log('✅ Created admit_card.template.html (size:', admitHtml.length, 'bytes)');
