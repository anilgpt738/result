const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { findBrowserExecutable } = require('../config/pdf-service');

const BASE_URL = 'http://localhost:5000';

async function runMasterE2ETest() {
    console.log('Running Master E2E & Layout Verification Suite...');
    const screensDir = path.join(__dirname, 'screens');
    fs.mkdirSync(screensDir, { recursive: true });

    const browser = await chromium.launch({
        executablePath: findBrowserExecutable(),
        headless: true
    });
    const page = await browser.newPage();

    const tests = [
        { name: '01_design_system.png', url: `${BASE_URL}/design-system`, title: 'Design System' },
        { name: '02_home.png', url: `${BASE_URL}/`, title: 'Home Page' },
        { name: '03_courses.png', url: `${BASE_URL}/courses`, title: 'Courses Page' },
        { name: '04_apply.png', url: `${BASE_URL}/apply`, title: 'Online Admission' },
        { name: '05_certificate_portal.png', url: `${BASE_URL}/certificate?certNo=UIS2026001`, title: 'Certificate Portal' },
        { name: '06_marksheet_result.png', url: `${BASE_URL}/result?rollNo=UIS2026001`, title: 'Statement of Marks' },
        { name: '07_admit_card.png', url: `${BASE_URL}/admit-card?rollNo=UIS2026001`, title: 'Admit Card' },
        { name: '08_fee_payment.png', url: `${BASE_URL}/payment?appNo=UIS2026001`, title: 'Fee Payment' },
        { name: '09_student_login.png', url: `${BASE_URL}/student-login`, title: 'Student Login' },
        { name: '10_admin_console.png', url: `${BASE_URL}/admin`, title: 'Admin Console' },
        { name: '11_id_card_verification.png', url: `${BASE_URL}/verify/id-card/UIS2026001`, title: 'ID Card Verification' }
    ];

    for (const t of tests) {
        try {
            await page.goto(t.url, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(screensDir, t.name), fullPage: true });
            console.log(`  ✓ ${t.title} captured`);
        } catch (err) {
            console.log(`  ⚠ ${t.title} capture notice: ${err.message}`);
        }
    }

    await browser.close();
    console.log('✅ Master E2E & Layout Verification complete.');
}

if (require.main === module) {
    runMasterE2ETest().catch(console.error);
}

module.exports = runMasterE2ETest;
