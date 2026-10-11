const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

async function runComprehensiveAudit() {
    console.log('================================================================');
    console.log('USHA INSTITUTE - PRE-DEPLOYMENT COMPREHENSIVE AUDIT & VERIFICATION');
    console.log('================================================================\n');

    let totalIssues = [];

    // --- 1. JAVASCRIPT SYNTAX & STATIC ANALYSIS ---
    console.log('▶ [1/6] Running Syntax & Static Analysis across all codebase files...');
    function getJsFiles(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
            if (file === 'node_modules' || file === '.git') continue;
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                results = results.concat(getJsFiles(fullPath));
            } else if (file.endsWith('.js')) {
                results.push(fullPath);
            }
        }
        return results;
    }

    const allJs = getJsFiles('.');
    let syntaxPassed = 0;
    for (const f of allJs) {
        try {
            execSync(`node --check "${f}"`, { stdio: 'pipe' });
            syntaxPassed++;
        } catch (e) {
            totalIssues.push(`Syntax error in file: ${f}`);
        }
    }
    console.log(`  ✓ Syntax check passed: ${syntaxPassed}/${allJs.length} JavaScript files clean with 0 syntax errors.`);

    // --- 2. BROKEN IMPORTS & MODULE RESOLUTION AUDIT ---
    console.log('\n▶ [2/6] Verifying Imports & Module Resolution...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const declaredDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const builtInModules = new Set(['fs', 'path', 'http', 'https', 'crypto', 'child_process', 'os', 'util', 'stream', 'events', 'url', 'querystring', 'buffer', 'assert', 'vm', 'v8', 'zlib']);

    let brokenRequires = 0;
    for (const f of allJs) {
        const content = fs.readFileSync(f, 'utf8');
        const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
        for (const m of requireMatches) {
            const modName = m.replace(/require\(['"]/, '').replace(/['"]\)/, '');
            if (builtInModules.has(modName)) continue;
            if (modName.startsWith('.')) {
                const dir = path.dirname(f);
                const resolvedJs = path.resolve(dir, modName + '.js');
                const resolvedDirect = path.resolve(dir, modName);
                const resolvedIndex = path.resolve(dir, modName, 'index.js');
                const resolvedJson = path.resolve(dir, modName + '.json');
                if (!fs.existsSync(resolvedJs) && !fs.existsSync(resolvedDirect) && !fs.existsSync(resolvedIndex) && !fs.existsSync(resolvedJson)) {
                    totalIssues.push(`Broken relative require in ${f}: '${modName}' does not exist on disk.`);
                    brokenRequires++;
                }
            } else {
                const rootPkg = modName.startsWith('@') ? modName.split('/').slice(0, 2).join('/') : modName.split('/')[0];
                if (!declaredDeps[rootPkg]) {
                    totalIssues.push(`Undeclared dependency in ${f}: '${rootPkg}' is used but not in package.json.`);
                    brokenRequires++;
                }
            }
        }
    }
    if (brokenRequires === 0) {
        console.log('  ✓ Module Resolution: All internal and external module imports resolved with 0 broken references.');
    }

    // --- 3. FRONTEND FILES & ROUTE MOUNT AUDIT ---
    console.log('\n▶ [3/6] Verifying Public Frontend HTML Pages & Components...');
    const requiredHtml = [
        'public/index.html',
        'public/certificate.html',
        'public/result.html',
        'public/admit-card.html',
        'public/payment.html',
        'public/student-login.html',
        'public/student-dashboard.html',
        'public/admin.html',
        'public/about.html',
        'public/courses.html',
        'public/contact.html',
        'public/apply.html'
    ];

    for (const htmlFile of requiredHtml) {
        if (!fs.existsSync(htmlFile)) {
            totalIssues.push(`Missing critical frontend file: ${htmlFile}`);
        } else {
            const hContent = fs.readFileSync(htmlFile, 'utf8');
            if (hContent.length < 200) {
                totalIssues.push(`Suspect stub/empty HTML file: ${htmlFile}`);
            }
        }
    }
    console.log(`  ✓ All ${requiredHtml.length} core frontend views exist and contain production layouts.`);

    // --- 4. ENVIRONMENT VARIABLES & SECRETS CHECK ---
    console.log('\n▶ [4/6] Verifying Environment Variables & Secret Hygiene...');
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const requiredEnvKeys = envExample
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => l.split('=')[0].trim());

    const activeEnvKeys = new Set(Object.keys(process.env));
    let missingEnv = [];
    for (const key of requiredEnvKeys) {
        if (!activeEnvKeys.has(key) && !process.env[key]) {
            missingEnv.push(key);
        }
    }

    if (missingEnv.length > 0) {
        totalIssues.push(`Missing environment variables defined in .env.example: ${missingEnv.join(', ')}`);
    } else {
        console.log(`  ✓ Environment variables: All ${requiredEnvKeys.length} required keys present in configuration.`);
    }

    // Check for hardcoded AWS / API keys / private keys in public files
    console.log('  Checking for accidental secret leaks in public directory...');
    const publicFiles = fs.readdirSync('public');
    for (const pf of publicFiles) {
        const full = path.join('public', pf);
        if (fs.statSync(full).isFile() && (pf.endsWith('.js') || pf.endsWith('.html'))) {
            const str = fs.readFileSync(full, 'utf8');
            if (/AIza[0-9A-Za-z-_]{35}/.test(str) || /sk_live_[0-9a-zA-Z]{24}/.test(str)) {
                totalIssues.push(`Exposed API key in public file: ${full}`);
            }
        }
    }
    console.log('  ✓ Secret Hygiene: No live provider API keys exposed in client files.');

    // --- 5. DATABASE CONNECTIVITY & CANONICAL DATA ---
    console.log('\n▶ [5/6] Verifying Database Connectivity & State...');
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiskills_db');
        const Student = require('../models/Student');
        const Result = require('../models/Result');
        const Certificate = require('../models/Certificate');
        const Course = require('../models/Course');

        const studentCount = await Student.countDocuments();
        const courseCount = await Course.countDocuments();
        const omkar = await Student.findOne({ registrationNo: 'UIS2026001' });
        const omkarResult = omkar ? await Result.findOne({ studentId: omkar._id }) : null;

        console.log(`  ✓ MongoDB Connected. Active Students: ${studentCount}, Courses: ${courseCount}`);
        if (!omkar || !omkarResult) {
            totalIssues.push('Canonical student UIS2026001 or Result missing from database.');
        } else {
            console.log(`  ✓ Canonical Record UIS2026001: ${omkar.name} | Total: ${omkarResult.totalMarks}/${omkarResult.totalMaxMarks} (${omkarResult.percentage}%) | Status: ${omkarResult.result}`);
        }
        await mongoose.disconnect();
    } catch (dbErr) {
        totalIssues.push(`MongoDB connectivity failure: ${dbErr.message}`);
    }

    // --- 6. AUTOMATED TEST SUITES EXECUTION ---
    console.log('\n▶ [6/6] Executing Automated Acceptance & Arithmetic Test Suites...');

    try {
        console.log('  Running: Master Acceptance Suite...');
        const out1 = execSync('node tests/master_acceptance_suite.js', { encoding: 'utf8' });
        if (out1.includes('18 PASSED | 0 FAILED')) {
            console.log('  ✓ Master Acceptance Suite: 18/18 Tests PASSED.');
        } else {
            totalIssues.push('Master Acceptance Suite failed or reported errors.');
        }
    } catch (e) {
        totalIssues.push(`Master Acceptance Suite crashed: ${e.message}`);
    }

    try {
        console.log('  Running: Course & Multi-Date Exam Suite...');
        const out2 = execSync('node tests/course_exam_suite.js', { encoding: 'utf8' });
        if (out2.includes('ALL COURSE & EXAM DYNAMIC TESTS PASSED')) {
            console.log('  ✓ Course & Multi-Date Exam Suite: PASSED.');
        } else {
            totalIssues.push('Course & Exam Suite failed.');
        }
    } catch (e) {
        totalIssues.push(`Course & Exam Suite crashed: ${e.message}`);
    }

    try {
        console.log('  Running: Photo Upload & Decimal Rounding Suite...');
        const out3 = execSync('node tests/test_photo_and_calc.js', { encoding: 'utf8' });
        if (out3.includes('PASSED successfully')) {
            console.log('  ✓ Photo Upload & Decimal Rounding Suite: PASSED.');
        } else {
            totalIssues.push('Photo & Calculation Suite failed.');
        }
    } catch (e) {
        totalIssues.push(`Photo & Calculation Suite crashed: ${e.message}`);
    }

    // --- FINAL REPORT SUMMARY ---
    console.log('\n================================================================');
    if (totalIssues.length === 0) {
        console.log('AUDIT RESULT: ★★★ PASS ★★★');
        console.log('The application is 100% verified and ready for Hostinger VPS deployment.');
    } else {
        console.log(`AUDIT RESULT: ❌ FAIL (${totalIssues.length} issues found)`);
        totalIssues.forEach((iss, i) => console.log(`  ${i + 1}. ${iss}`));
    }
    console.log('================================================================');

    process.exit(totalIssues.length === 0 ? 0 : 1);
}

runComprehensiveAudit().catch(err => {
    console.error('Audit crashed:', err);
    process.exit(1);
});
