const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { findBrowserExecutable } = require('../config/pdf-service');

const rootDir = path.resolve(__dirname, '..');
const targetDir = path.join(__dirname);
const baselinesDir = path.join(targetDir, 'baselines');
fs.mkdirSync(baselinesDir, { recursive: true });

const rootUri = 'file:///' + rootDir.replace(/\\/g, '/') + '/';

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
  // Inject base href so relative files resolve to project root
  content = content.replace('<head>', `<head><base href="${rootUri}">`);
  return content;
}

async function generateBaselines() {
  console.log('🚀 Rendering Golden Baseline Images & PDFs...');
  const executablePath = findBrowserExecutable();
  console.log('Using browser executable:', executablePath);

  const browser = await chromium.launch({
    executablePath: executablePath || undefined,
    headless: true
  });

  // 1. Certificate (Landscape 1580x1100)
  console.log('1. Rendering Certificate Baseline...');
  const certHtml = renderTemplate(path.join(targetDir, 'certificate.template.html'), sampleData);
  const certHtmlPath = path.join(baselinesDir, 'rendered_sample_certificate.html');
  fs.writeFileSync(certHtmlPath, certHtml);

  const certPage = await browser.newPage({
    viewport: { width: 1580, height: 1100 }
  });
  await certPage.goto('file:///' + certHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await certPage.waitForTimeout(1500);

  const certEl = await certPage.$('#print') || certPage;
  await certEl.screenshot({ path: path.join(baselinesDir, 'baseline_certificate.png') });
  await certPage.pdf({
    path: path.join(baselinesDir, 'baseline_certificate.pdf'),
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });
  console.log('✅ Saved baseline_certificate.png & .pdf');
  await certPage.close();

  // 2. Marksheet (Portrait 720x1041)
  console.log('2. Rendering Marksheet Baseline...');
  const marksheetHtml = renderTemplate(path.join(targetDir, 'marksheet.template.html'), sampleData);
  const marksheetHtmlPath = path.join(baselinesDir, 'rendered_sample_marksheet.html');
  fs.writeFileSync(marksheetHtmlPath, marksheetHtml);

  const marksheetPage = await browser.newPage({
    viewport: { width: 720, height: 1041 }
  });
  await marksheetPage.goto('file:///' + marksheetHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await marksheetPage.waitForTimeout(1500);

  const marksheetEl = await marksheetPage.$('#print') || marksheetPage;
  await marksheetEl.screenshot({ path: path.join(baselinesDir, 'baseline_marksheet.png') });
  await marksheetPage.pdf({
    path: path.join(baselinesDir, 'baseline_marksheet.pdf'),
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });
  console.log('✅ Saved baseline_marksheet.png & .pdf');
  await marksheetPage.close();

  // 3. Admit Card (Portrait 850x1100)
  console.log('3. Rendering Admit Card Baseline...');
  const admitHtml = renderTemplate(path.join(targetDir, 'admit_card.template.html'), sampleData);
  const admitHtmlPath = path.join(baselinesDir, 'rendered_sample_admit_card.html');
  fs.writeFileSync(admitHtmlPath, admitHtml);

  const admitPage = await browser.newPage({
    viewport: { width: 850, height: 1100 }
  });
  await admitPage.goto('file:///' + admitHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await admitPage.waitForTimeout(1500);

  const admitEl = await admitPage.$('.admit-card') || admitPage;
  await admitEl.screenshot({ path: path.join(baselinesDir, 'baseline_admit_card.png') });
  await admitPage.pdf({
    path: path.join(baselinesDir, 'baseline_admit_card.pdf'),
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });
  console.log('✅ Saved baseline_admit_card.png & .pdf');
  await admitPage.close();

  await browser.close();
  console.log('🎉 All Baseline Renders Successfully Generated in frozen_templates/baselines/');
}

generateBaselines().catch(console.error);
