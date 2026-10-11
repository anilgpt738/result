const http = require('http');

const BASE = 'http://localhost:5000';

function fetchUrl(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch(e) {}
                resolve({ status: res.statusCode, headers: res.headers, body: data, json: parsed });
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function verifyAllEndpoints() {
    console.log('Testing All Frontend & Backend Endpoints...\n');
    let failures = 0;

    // 1. Frontend Route Checks
    const frontendRoutes = [
        '/',
        '/about',
        '/courses',
        '/apply',
        '/certificate',
        '/result',
        '/admit-card',
        '/payment',
        '/student-login',
        '/student-dashboard',
        '/admin',
        '/contact',
        '/design-system',
        '/verify/id-card/UIS2026001'
    ];

    console.log('--- 1. Frontend HTML Views ---');
    for (const route of frontendRoutes) {
        const res = await fetchUrl(route);
        if (res.status === 200 && res.body.length > 200) {
            console.log(`  ✓ GET ${route} -> Status: 200 OK (${res.body.length} bytes)`);
        } else {
            console.error(`  ❌ GET ${route} -> Failed: Status ${res.status}`);
            failures++;
        }
    }

    // 2. Public Verification APIs
    console.log('\n--- 2. Public Search & Verification APIs ---');
    const publicApis = [
        { path: '/api/courses', expectedField: 'data' },
        { path: '/api/public/courses', expectedField: 'data' },
        { path: '/api/students/result/UIS2026001', expectedField: 'student' },
        { path: '/api/students/certificate/UIS2026001', expectedField: 'certificate' },
        { path: '/api/students/admit-card/UIS2026001', expectedField: 'student' }
    ];

    for (const api of publicApis) {
        const res = await fetchUrl(api.path);
        if (res.status === 200 && res.json && res.json.success && res.json[api.expectedField]) {
            console.log(`  ✓ GET ${api.path} -> Status: 200 OK (Verified ${api.expectedField})`);
        } else {
            console.error(`  ❌ GET ${api.path} -> Failed: Status ${res.status}`);
            failures++;
        }
    }

    // 3. Authentication & Authorization Checks
    console.log('\n--- 3. Authentication & Role-Based Authorization ---');
    
    // Check unauthenticated rejection
    const unauthRes = await fetchUrl('/api/admin/dashboard');
    if (unauthRes.status === 401) {
        console.log('  ✓ GET /api/admin/dashboard (Without Token) -> Correctly returned 401 Unauthorized.');
    } else {
        console.error(`  ❌ Authorization Guard failed: Expected 401, got ${unauthRes.status}`);
        failures++;
    }

    // Check login
    const loginPayload = JSON.stringify({ username: 'superadmin', password: 'UshaAdmin@2026#Secure' });
    const loginRes = await fetchUrl('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginPayload)
        },
        body: loginPayload
    });

    if (loginRes.status === 200 && loginRes.json && loginRes.json.data && loginRes.json.data.token) {
        console.log('  ✓ POST /api/auth/login -> Authentication succeeded, JWT issued.');
        const token = loginRes.json.data.token;

        // Check protected admin APIs with token
        const adminApis = [
            '/api/admin/dashboard',
            '/api/admin/students',
            '/api/admin/courses',
            '/api/admin/exams',
            '/api/admin/certificates',
            '/api/admin/payments'
        ];

        for (const aRoute of adminApis) {
            const aRes = await fetchUrl(aRoute, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (aRes.status === 200 && aRes.json && aRes.json.success) {
                console.log(`  ✓ Protected GET ${aRoute} -> 200 OK`);
            } else {
                console.error(`  ❌ Protected GET ${aRoute} -> Failed: ${aRes.status}`);
                failures++;
            }
        }
    } else {
        console.error('  ❌ Admin Login Failed:', loginRes.body);
        failures++;
    }

    console.log(`\nEndpoint Verification Summary: ${failures === 0 ? 'ALL ENDPOINTS PASSED (0 failures)' : failures + ' FAILURES'}`);
    process.exit(failures === 0 ? 0 : 1);
}

verifyAllEndpoints().catch(err => {
    console.error('Fatal endpoint testing error:', err);
    process.exit(1);
});
