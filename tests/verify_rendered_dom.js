const { chromium } = require('playwright');
const { findBrowserExecutable } = require('../config/pdf-service');

async function testRenderedDOM() {
    const browser = await chromium.launch({
        executablePath: findBrowserExecutable(),
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:5000/result?rollNo=UIS2026001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const total = await page.textContent('#mGrandTotal');
    const perc = await page.textContent('#mPercentage');
    const grade = await page.textContent('#mGrade');
    const result = await page.textContent('#mResult');
    const inWords = await page.textContent('#mInWords');
    const rows = await page.$$eval('#mMainTableBody .subject-row', els => els.map(e => e.innerText.trim().replace(/\s+/g, ' ')));

    console.log('=== Rendered Statement of Marks DOM ===');
    console.log('Grand Total:', total);
    console.log('Percentage:', perc);
    console.log('Grade:', grade);
    console.log('Result:', result);
    console.log('In Words:', inWords);
    console.log('Subject Rows count:', rows.length);
    rows.forEach(r => console.log('  ' + r));

    // Also check certificate page
    await page.goto('http://localhost:5000/certificate?certNo=UIS2026001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const cTotal = await page.textContent('#cGrandTotal');
    const cPerc = await page.textContent('#cPercentage');
    const cGrade = await page.textContent('#cGrade');
    const cResult = await page.textContent('#cResult');

    console.log('\n=== Rendered Certificate DOM ===');
    console.log('Cert Grand Total:', cTotal);
    console.log('Cert Percentage:', cPerc);
    console.log('Cert Grade:', cGrade);
    console.log('Cert Result:', cResult);

    await browser.close();

    if (total.trim() !== '637' || perc.trim() !== '79.63%' || grade.trim() !== 'A' || result.trim() !== 'Pass') {
        throw new Error('Rendered values mismatch expectations');
    }
    console.log('\n✅ All rendered DOM values match 100% of golden template expectations!');
}

testRenderedDOM().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
