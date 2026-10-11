const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Auto-detect system Chromium/Chrome or Edge binary on Windows
function findBrowserExecutable() {
    const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        process.env.CHROME_BIN
    ].filter(Boolean);

    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/**
 * Generate QR code as Base64 Data URL
 */
async function generateQrDataUrl(dataString) {
    try {
        return await QRCode.toDataURL(dataString, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 250,
            color: { dark: '#0B1230', light: '#FFFFFF' }
        });
    } catch (err) {
        console.error('QR code generation error:', err);
        return '';
    }
}

/**
 * Render HTML to PDF buffer using Puppeteer
 */
async function renderHtmlToPdf(htmlContent, options = {}) {
    const executablePath = findBrowserExecutable();
    if (!executablePath) {
        throw new Error('Chrome/Edge executable not found for PDF generation on this server.');
    }

    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfOptions = {
            printBackground: true,
            format: options.format || 'A4',
            landscape: options.landscape || false,
            margin: options.margin || { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        };

        const pdfBuffer = await page.pdf(pdfOptions);
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = {
    findBrowserExecutable,
    generateQrDataUrl,
    renderHtmlToPdf
};
