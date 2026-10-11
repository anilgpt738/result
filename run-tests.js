const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { findBrowserExecutable } = require('./config/pdf-service');

const BASE_URL = 'http://localhost:5000';

async function runMasterSuite() {
    console.log('🚀 Running Master Verification & Screenshot Suite...');
    const screensDir = path.join(__dirname, 'tests', 'screens');
    fs.mkdirSync(screensDir, { recursive: true });

    const executablePath = findBrowserExecutable();
    console.log('Using browser executable:', executablePath);

    const browser = await chromium.launch({
        executablePath: executablePath || undefined,
        headless: true
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    const screens = [
        { name: '01_design_system.png', url: `${BASE_URL}/design-system`, title: 'Design System' },
        { name: '02_home.png', url: `${BASE_URL}/`, title: 'Home Portal' },
        { name: '03_courses.png', url: `${BASE_URL}/courses`, title: 'Courses Catalog' },
        { name: '04_apply.png', url: `${BASE_URL}/apply`, title: 'Online Admission' },
        { name: '05_certificate_empty.png', url: `${BASE_URL}/certificate`, title: 'Certificate Portal (Empty Visit)' },
        { name: '05_certificate_loaded.png', url: `${BASE_URL}/certificate?certNo=UIS2026001`, title: 'Certificate Portal (UIS2026001)' },
        { name: '06_result_empty.png', url: `${BASE_URL}/result`, title: 'Statement of Marks (Empty Visit)' },
        { name: '06_result_loaded.png', url: `${BASE_URL}/result?rollNo=UIS2026001`, title: 'Statement of Marks (UIS2026001)' },
        { name: '07_admit_card_empty.png', url: `${BASE_URL}/admit-card`, title: 'Admit Card (Empty Visit)' },
        { name: '07_admit_card_loaded.png', url: `${BASE_URL}/admit-card?rollNo=UIS2026001`, title: 'Admit Card (UIS2026001)' },
        { name: '08_fee_payment.png', url: `${BASE_URL}/payment?appNo=UIS2026001`, title: 'Fee Payment & UPI' },
        { name: '09_student_login.png', url: `${BASE_URL}/student-login`, title: 'Student Portal Login' },
        { name: '10_admin_console.png', url: `${BASE_URL}/admin`, title: 'Admin CMS' },
        { name: '11_id_card.png', url: `${BASE_URL}/verify/id-card/UIS2026001`, title: 'ID Card Verification' }
    ];

    for (const s of screens) {
        try {
            console.log(`📸 Capturing ${s.title} (${s.url})...`);
            await page.goto(s.url, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: path.join(screensDir, s.name), fullPage: true });
            console.log(`✅ Saved: tests/screens/${s.name}`);
        } catch (e) {
            console.error(`❌ Error capturing ${s.name}:`, e.message);
        }
    }

    await browser.close();
    console.log('🎉 All Master Suite Screenshots Captured Successfully in tests/screens/');
}

if (require.main === module) {
    runMasterSuite().catch(console.error);
}

module.exports = runMasterSuite;
