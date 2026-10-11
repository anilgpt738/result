/**
 * Usha Institute of Computer Education - Number Generation & Validation Engine
 * Implements Section 5 of Master Build Prompt
 */

const crypto = require('crypto');

/**
 * Calculates Luhn check digit for an 11-digit string to produce a 12-digit number.
 * Conforms to Golden Test Vectors:
 *   - 20250100001 -> check digit 4 -> 202501000014
 *   - 20250100002 -> check digit 2 -> 202501000022
 */
function calculateLuhnCheckDigit(payload11) {
  if (typeof payload11 !== 'string' || payload11.length !== 11 || !/^\d{11}$/.test(payload11)) {
    throw new Error('Luhn payload must be exactly 11 numeric digits');
  }

  let sum = 0;
  const digits = payload11.split('').map(Number);
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    // Position from right (1-indexed) where the check digit would be position 0
    if ((digits.length - i) % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Validates a 12-digit enrollment number against Luhn check digit.
 * Legacy numbers bypass Luhn check if flagged as legacy.
 */
function validateEnrollmentNo(enrollmentNo, isLegacy = false) {
  if (!enrollmentNo || typeof enrollmentNo !== 'string') {
    return { valid: false, message: 'Enrollment number is required' };
  }

  const clean = enrollmentNo.trim();
  if (!/^\d{12}$/.test(clean)) {
    return { valid: false, message: 'Enrollment number must be exactly 12 numeric digits' };
  }

  if (isLegacy) {
    return { valid: true, isLegacy: true, enrollmentNo: clean };
  }

  const payload = clean.slice(0, 11);
  const expectedK = calculateLuhnCheckDigit(payload);
  const actualK = parseInt(clean.slice(11), 10);

  if (expectedK !== actualK) {
    return { valid: false, message: `Invalid check digit: expected ${expectedK}, found ${actualK}` };
  }

  return {
    valid: true,
    isLegacy: false,
    enrollmentNo: clean,
    year: clean.slice(0, 4),
    courseCode: clean.slice(4, 6),
    sequence: parseInt(clean.slice(6, 11), 10),
    checkDigit: actualK
  };
}

/**
 * Generates official 12-digit enrollment number (Section 5.1).
 * @param {number|string} year - 4 digit year
 * @param {string} courseCode2Digit - 2 digit course identifier (e.g. '01')
 * @param {number} seqNumber - Running sequence number for year and course
 */
function generateEnrollmentNo(year, courseCode2Digit, seqNumber) {
  const yyyy = String(year);
  const cc = String(courseCode2Digit).padStart(2, '0');
  const nnnnn = String(seqNumber).padStart(5, '0');
  const payload11 = `${yyyy}${cc}${nnnnn}`;
  const k = calculateLuhnCheckDigit(payload11);
  return `${payload11}${k}`;
}

/**
 * Generates Marksheet Number (Section 5.2):
 * Pattern: {PREFIX}/{COURSE}/{YYYY}/{SEQ}{SUFFIX}
 * Default: TBF/ADCA/2024/4887S
 */
function generateMarksheetNo(courseCode, year, sequence, suffix = 'S', prefix = 'TBF') {
  return `${prefix}/${courseCode.toUpperCase()}/${year}/${sequence}${suffix}`;
}

/**
 * Generates Certificate Number (Section 5.2):
 * Pattern: {PREFIX}/{COURSE}/{YYYY}/{SEQ}
 * Default: TBF/ADCA/2024/31158
 */
function generateCertificateNo(courseCode, year, sequence, prefix = 'TBF') {
  return `${prefix}/${courseCode.toUpperCase()}/${year}/${sequence}`;
}

/**
 * Generates Register Serial Number (S.No):
 * Plain integer, never resets.
 */
function generateSerialNo(sequence) {
  return Number(sequence);
}

/**
 * Generates Application Number:
 * UICE/A/{YYYY}/{6 digits}
 */
function generateApplicationNo(year, sequence) {
  return `UICE/A/${year}/${String(sequence).padStart(6, '0')}`;
}

/**
 * Generates Receipt Number:
 * UICE/R/{FY}/{6 digits}
 */
function generateReceiptNo(financialYear, sequence) {
  return `UICE/R/${financialYear}/${String(sequence).padStart(6, '0')}`;
}

/**
 * Generates a 128-bit cryptographically secure random verification token.
 */
function generateVerificationToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Computes SHA-256 hash of immutable document snapshot.
 */
function computeContentHash(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = {
  calculateLuhnCheckDigit,
  validateEnrollmentNo,
  generateEnrollmentNo,
  generateMarksheetNo,
  generateCertificateNo,
  generateSerialNo,
  generateApplicationNo,
  generateReceiptNo,
  generateVerificationToken,
  computeContentHash
};
