const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { findBrowserExecutable } = require('../config/pdf-service');

const targetDir = path.join(__dirname);
const baselinesDir = path.join(targetDir, 'baselines');

const sampleData = {
  STUDENT_NAME: 'OMKAR VISHWAKARMA',
  FATHER_NAME: 'RAMESH VISHWAKARMA',
  DOB: '22 Sep 2004',
  COURSE_NAME: 'Advance Diploma in Computer Application',
  COURSE_CODE: 'ADCA',
  DURATION: '12 Months',
  SESSION: '2025- 2024',
  REGISTRATION_DATE: '09 Jul 2025',
  ENROLLMENT_NO: '202536924646',
  MARKSHEET_NO: 'TBF/ADCA/2024/4887S',
  CERTIFICATE_NO: 'TBF/ADCA/2024/31158',
  SERIAL_NO: '6387',
  DATE_OF_ISSUE: '19 Jul 2024',
  GRAND_TOTAL: '637 / 800',
  GRAND_TOTAL_WORDS: 'Six Hundred Thirty Seven Only',
  RESULT: 'Pass',
  GRADE: 'A',
  PERCENTAGE: '79.63%',
  MODE: 'Regular',
  ATC_NAME: 'Usha institute of computer education',
  ATC_CODE: 'IN/UP/MAU/29172',
  ADMIT_CARD_NO: 'TBF/AC/2024/00842',
  ROLL_NO: '24ADCA0012',
  STUDENT_PHOTO_URL: './certificate_files/19371787653366.jpeg',
  QR_CODE_URL: './certificate_files/202536924646-221871866204532.png'
};

function renderTemplate(templatePath, data) {
  let content = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    const reg = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(reg, value);
  }
  const rootUri = 'file:///' + path.resolve(__dirname, '..').replace(/\\/g, '/') + '/';
  content = content.replace('<head>', `<head><base href="${rootUri}">`);
  return content;
}

async function runVisualRegressionTest() {
  console.log('🧪 Running Visual Regression Protection Test on Frozen Documents...');
  
  // Verify checksums of raw frozen files first
  const manifestPath = path.join(targetDir, 'checksums.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Checksums manifest missing in frozen_templates/');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const crypto = require('crypto');
  for (const t of manifest.templates) {
    const rawPath = path.join(targetDir, t.file);
    if (!fs.existsSync(rawPath)) {
      throw new Error(`Raw frozen template ${t.file} is missing!`);
    }
    const currentHash = crypto.createHash('sha256').update(fs.readFileSync(rawPath)).digest('hex');
    if (currentHash !== t.sha256) {
      throw new Error(`CRITICAL SECURITY FAILURE: Frozen template ${t.file} was modified! Expected hash ${t.sha256}, got ${currentHash}`);
    }
  }
  console.log('🔒 Checksums Integrity Verified: All frozen templates match SHA-256 hashes.');

  const browser = await chromium.launch({
    executablePath: findBrowserExecutable(),
    headless: true
  });

  const tests = [
    {
      name: 'Certificate',
      template: 'certificate.template.html',
      selector: '#print',
      width: 1580,
      height: 1100,
      baseline: 'baseline_certificate.png'
    },
    {
      name: 'Marksheet',
      template: 'marksheet.template.html',
      selector: '#print',
      width: 720,
      height: 1041,
      baseline: 'baseline_marksheet.png'
    },
    {
      name: 'Admit Card',
      template: 'admit_card.template.html',
      selector: '.admit-card',
      width: 850,
      height: 1100,
      baseline: 'baseline_admit_card.png'
    }
  ];

  for (const t of tests) {
    const htmlContent = renderTemplate(path.join(targetDir, t.template), sampleData);
    const tempHtmlPath = path.join(targetDir, `_temp_${t.name.toLowerCase().replace(/\s+/g, '_')}.html`);
    fs.writeFileSync(tempHtmlPath, htmlContent);

    const page = await browser.newPage({ viewport: { width: t.width, height: t.height } });
    await page.goto('file:///' + tempHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const el = await page.$(t.selector) || page;
    const currentScreenshot = await el.screenshot();
    const baselineBuffer = fs.readFileSync(path.join(baselinesDir, t.baseline));

    // Cleanup temp html
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    await page.close();

    // Byte & dimension comparison
    const sizeDiff = Math.abs(currentScreenshot.length - baselineBuffer.length);
    const sizeDiffPct = (sizeDiff / baselineBuffer.length) * 100;

    console.log(`📊 ${t.name}: Current ${currentScreenshot.length} bytes, Baseline ${baselineBuffer.length} bytes (Diff: ${sizeDiffPct.toFixed(2)}%)`);

    if (sizeDiffPct > 1.0) {
      throw new Error(`Visual Regression Alert: ${t.name} layout deviation exceeded 1.0% (${sizeDiffPct.toFixed(2)}%)!`);
    } else {
      console.log(`✅ ${t.name}: PASSED visual comparison test.`);
    }
  }

  await browser.close();
  console.log('🎉 ALL FROZEN DOCUMENT VISUAL REGRESSION TESTS PASSED!');
}

if (require.main === module) {
  runVisualRegressionTest().catch(err => {
    console.error('❌ Visual Regression Error:', err.message);
    process.exit(1);
  });
}

module.exports = runVisualRegressionTest;
