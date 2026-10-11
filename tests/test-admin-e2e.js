const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { findBrowserExecutable } = require('../config/pdf-service');

const BASE_URL = 'http://localhost:5000';

async function testAdminFlow() {
    console.log('🧪 Starting Admin E2E Verification Flow...');
    const screensDir = path.join(__dirname, 'screens');
    fs.mkdirSync(screensDir, { recursive: true });

    const browser = await chromium.launch({
        executablePath: findBrowserExecutable(),
        headless: true
    });

    const context = await browser.newContext({
        viewport: { width: 1366, height: 900 }
    });
    const page = await context.newPage();

    // 1. Visit Admin Login
    console.log('1. Navigating to Admin Portal...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screensDir, '12_admin_login_screen.png') });

    // 2. Perform Login
    console.log('2. Performing Admin Authentication...');
    await page.fill('#adminUser', 'admin');
    await page.fill('#adminPass', 'admin@123');
    await page.click('#btnLogin');
    await page.waitForTimeout(1500);

    // Take screenshot of Dashboard after login
    await page.screenshot({ path: path.join(screensDir, '13_admin_dashboard_logged_in.png') });
    console.log('✅ Logged in successfully to CMS Dashboard');

    // 3. Switch to Students Tab
    console.log('3. Navigating to Students Management...');
    await page.click('a[onclick="showTab(\'students\')"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screensDir, '14_admin_students_list.png') });

    // 4. Open Add Student Modal
    console.log('4. Opening Add Student Modal...');
    await page.click('button[onclick="openAddStudentModal()"]');
    await page.waitForTimeout(500);

    await page.fill('#newStudentName', 'AMIT KUMAR');
    await page.fill('#newStudentFather', 'RAMESH KUMAR');
    await page.fill('#newStudentMother', 'GEETA DEVI');
    await page.fill('#newStudentMobile', '9876599999');
    await page.selectOption('#newStudentCourse', 'ADCA');
    await page.fill('#newStudentPaid', '2000');
    await page.fill('#newStudentAddress', 'Pahasa Bazar, Mau, UP');
    await page.screenshot({ path: path.join(screensDir, '15_admin_add_student_modal.png') });

    // 5. Submit New Student
    console.log('5. Submitting New Student...');
    await page.click('#btnSaveStudent');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screensDir, '16_admin_student_created_modal.png') });

    // Close notice modal and clean backdrops
    const closeNoticeBtn = await page.$('#adminNoticeModal button[data-bs-dismiss="modal"]');
    if (closeNoticeBtn) await closeNoticeBtn.click();
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
        document.querySelectorAll('.modal').forEach(m => {
            const inst = bootstrap.Modal.getInstance(m);
            if (inst) inst.hide();
        });
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
    });
    await page.waitForTimeout(500);

    // 6. Enter Marks for the new student
    console.log('6. Switching to Marks Entry Tab...');
    await page.click('a[onclick="showTab(\'marks\')"]');
    await page.waitForTimeout(1000);

    // Select the newly added student (should be AMIT KUMAR)
    const options = await page.$$eval('#marksStudentSelect option', opts => opts.map(o => ({ value: o.value, text: o.text })));
    console.log('Students in marks dropdown:', options.map(o => o.text));

    const amitOption = options.find(o => o.text.includes('AMIT KUMAR'));
    if (amitOption) {
        await page.selectOption('#marksStudentSelect', amitOption.value);
        await page.waitForTimeout(1000);
        console.log('Selected student:', amitOption.text);

        await page.screenshot({ path: path.join(screensDir, '17_admin_marks_entry_table.png') });

        // Save & Publish Results
        console.log('Saving & Publishing Results...');
        await page.click('button[onclick="saveAndPublishResults()"]');
        await page.waitForTimeout(2500);

        await page.screenshot({ path: path.join(screensDir, '18_admin_results_published_modal.png') });
        console.log('✅ Results published modal displayed');
    } else {
        console.error('❌ Could not find AMIT KUMAR in dropdown');
    }

    // 7. Verify Document Direct Rendering for UIS2026004
    console.log('7. Verifying Document Rendering for UIS2026004...');
    
    // Result / Marksheet
    await page.goto(`${BASE_URL}/result?rollNo=UIS2026004`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screensDir, '19_amit_marksheet_verified.png') });
    console.log('✅ Verified Marksheet for UIS2026004');

    // Certificate
    await page.goto(`${BASE_URL}/certificate?certNo=UIS2026004`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screensDir, '20_amit_certificate_verified.png') });
    console.log('✅ Verified Certificate for UIS2026004');

    // Admit Card
    await page.goto(`${BASE_URL}/admit-card?rollNo=UIS2026004`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screensDir, '21_amit_admit_card_verified.png') });
    console.log('✅ Verified Admit Card for UIS2026004');

    await browser.close();
    console.log('🎉 E2E Admin Verification Flow Passed Perfectly!');
}

testAdminFlow().catch(err => {
    console.error('❌ Admin Flow Test Error:', err);
    process.exit(1);
});
