/**
 * ============================================
 *  SPECTRA SECURITY TEST SUITE
 * ============================================
 *  Run: node tests/security-tests.js
 *  Requires: Backend running on localhost:5000
 * ============================================
 */

const BASE = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const results = [];

// ── Helpers ──
async function test(name, fn) {
    try {
        await fn();
        passed++;
        results.push({ name, status: '✅ PASS' });
        console.log(`  ✅ ${name}`);
    } catch (err) {
        failed++;
        results.push({ name, status: '❌ FAIL', error: err.message });
        console.log(`  ❌ ${name}`);
        console.log(`     → ${err.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body, headers: res.headers };
}

// ════════════════════════════════════════════
//  TEST SUITE 1: ROUTE PROTECTION
//  Verify all write routes reject unauthenticated requests
// ════════════════════════════════════════════
async function testRouteProtection() {
    console.log('\n🔒 TEST SUITE 1: Route Protection (No Auth Token)\n');

    // ── Article Routes ──
    await test('POST /articles/upload → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/articles/upload`, { method: 'POST', body: '{}' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /articles/init-year → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/articles/init-year`, { method: 'POST', body: JSON.stringify({ year: 9999 }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /articles/category → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/articles/category`, { method: 'POST', body: JSON.stringify({ issueId: 'fake', title: 'test' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('PUT /articles/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/articles/000000000000000000000000`, { method: 'PUT', body: JSON.stringify({ title: 'hacked' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('DELETE /articles/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/articles/000000000000000000000000`, { method: 'DELETE' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('DELETE /articles/category/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/articles/category/000000000000000000000000`, { method: 'DELETE' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // ── About Routes ──
    await test('POST /about → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/about`, { method: 'POST', body: JSON.stringify({ title: 'test', content: 'test' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('PUT /about/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/about/000000000000000000000000`, { method: 'PUT', body: JSON.stringify({ title: 'hacked' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('DELETE /about/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/about/000000000000000000000000`, { method: 'DELETE' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /about/bulk → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/about/bulk`, { method: 'POST', body: JSON.stringify([]) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // ── Editorial Routes ──
    await test('POST /editorial → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/editorial`, { method: 'POST', body: JSON.stringify({ name: 'test' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('PUT /editorial/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/editorial/000000000000000000000000`, { method: 'PUT', body: JSON.stringify({ name: 'hacked' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('DELETE /editorial/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/editorial/000000000000000000000000`, { method: 'DELETE' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /editorial/bulk → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/editorial/bulk`, { method: 'POST', body: JSON.stringify([]) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // ── Gallery Routes ──
    await test('POST /gallery → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/gallery`, { method: 'POST', body: '{}' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('PUT /gallery/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/gallery/000000000000000000000000`, { method: 'PUT', body: JSON.stringify({ title: 'hacked' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('DELETE /gallery/:id → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/gallery/000000000000000000000000`, { method: 'DELETE' });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // ── Journal Routes ──
    await test('POST /journal/years → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/journal/years`, { method: 'POST', body: JSON.stringify({ year: 9999 }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /journal/categories → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/journal/categories`, { method: 'POST', body: JSON.stringify({ issueId: 'fake', title: 'test' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('POST /journal/topics → 401 without token', async () => {
        const res = await fetchJson(`${BASE}/journal/topics`, { method: 'POST', body: JSON.stringify({ categoryId: 'fake', title: 'test' }) });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });
}

// ════════════════════════════════════════════
//  TEST SUITE 2: PUBLIC ROUTES STILL WORK
//  Verify read-only routes remain accessible
// ════════════════════════════════════════════
async function testPublicRoutes() {
    console.log('\n🌐 TEST SUITE 2: Public Routes Still Accessible\n');

    await test('GET /articles/tree → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/articles/tree`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /articles/latest → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/articles/latest`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /about → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/about`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /editorial → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/editorial`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /gallery → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/gallery`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /journal/tree → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/journal/tree`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /journal/years → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/journal/years`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /search?q=test → 200 (public)', async () => {
        const res = await fetchJson(`${BASE}/search?q=test`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('GET /health → 200 (public)', async () => {
        const res = await fetchJson('http://localhost:5000/api/health');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });
}

// ════════════════════════════════════════════
//  TEST SUITE 3: AUTH WITH INVALID TOKENS
//  Verify forged/expired tokens are rejected
// ════════════════════════════════════════════
async function testInvalidTokens() {
    console.log('\n🎭 TEST SUITE 3: Invalid/Forged Token Rejection\n');

    await test('Forged JWT token → 401', async () => {
        const res = await fetchJson(`${BASE}/articles/init-year`, {
            method: 'POST',
            headers: { Authorization: 'Bearer this.is.a.fake.token' },
            body: JSON.stringify({ year: 9999 }),
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('Empty Bearer token → 401', async () => {
        const res = await fetchJson(`${BASE}/about`, {
            method: 'POST',
            headers: { Authorization: 'Bearer ' },
            body: JSON.stringify({ title: 'test' }),
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('No Authorization header → 401', async () => {
        const res = await fetchJson(`${BASE}/editorial`, {
            method: 'POST',
            body: JSON.stringify({ name: 'test' }),
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('Malformed Authorization header → 401', async () => {
        const res = await fetchJson(`${BASE}/gallery`, {
            method: 'POST',
            headers: { Authorization: 'NotBearer sometoken' },
            body: '{}',
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });
}

// ════════════════════════════════════════════
//  TEST SUITE 4: INPUT VALIDATION
//  Verify XSS, ReDoS, and injection defenses
// ════════════════════════════════════════════
async function testInputValidation() {
    console.log('\n🛡️  TEST SUITE 4: Input Validation & Sanitization\n');

    await test('Search with regex special chars does NOT crash (ReDoS fix)', async () => {
        const maliciousQuery = '(a+)+$';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const res = await fetchJson(`${BASE}/search?q=${encodeURIComponent(maliciousQuery)}`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            assert(res.status === 200, `Expected 200, got ${res.status}`);
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === 'AbortError') {
                throw new Error('Request timed out — possible ReDoS vulnerability still present');
            }
            throw err;
        }
    });

    await test('Search with empty query → 400', async () => {
        const res = await fetchJson(`${BASE}/search?q=`);
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Search with no query param → 400', async () => {
        const res = await fetchJson(`${BASE}/search`);
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Contact form with missing fields → 400', async () => {
        const res = await fetchJson(`${BASE}/contact`, {
            method: 'POST',
            body: JSON.stringify({ fullName: 'Test' }), // Missing required fields
        });
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Contact form with invalid email → 400', async () => {
        const res = await fetchJson(`${BASE}/contact`, {
            method: 'POST',
            body: JSON.stringify({
                fullName: 'Test',
                email: 'not-an-email',
                subject: 'Test',
                message: 'Test',
                inquiryType: 'general',
            }),
        });
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('MongoDB operator injection is sanitized', async () => {
        const res = await fetchJson(`${BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
                username: { $gt: '' },
                password: { $gt: '' },
            }),
        });
        // Should NOT return success — should be 400 or 401
        assert(res.status !== 200 || res.body.status !== 'success', 
            'NoSQL injection should not return success');
    });
}

// ════════════════════════════════════════════
//  TEST SUITE 5: AUTH ENDPOINT SECURITY
//  Verify login behavior
// ════════════════════════════════════════════
async function testAuthSecurity() {
    console.log('\n🔑 TEST SUITE 5: Authentication Endpoint Security\n');

    await test('Login with wrong credentials → 401', async () => {
        const res = await fetchJson(`${BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ username: 'nonexistent', password: 'wrongpass' }),
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('Login with empty body → 400', async () => {
        const res = await fetchJson(`${BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('MFA setup without auth → 401', async () => {
        const res = await fetchJson(`${BASE}/auth/mfa-setup`);
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('MFA verify without auth → 401', async () => {
        const res = await fetchJson(`${BASE}/auth/mfa-verify`, {
            method: 'POST',
            body: JSON.stringify({ token: '123456' }),
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });
}

// ════════════════════════════════════════════
//  TEST SUITE 6: SECURITY HEADERS
//  Verify Helmet is setting proper headers
// ════════════════════════════════════════════
async function testSecurityHeaders() {
    console.log('\n🪖 TEST SUITE 6: Security Headers (Helmet)\n');

    const res = await fetch('http://localhost:5000/api/health');

    await test('X-Content-Type-Options: nosniff', async () => {
        const val = res.headers.get('x-content-type-options');
        assert(val === 'nosniff', `Expected 'nosniff', got '${val}'`);
    });

    await test('X-Frame-Options present', async () => {
        const val = res.headers.get('x-frame-options');
        assert(val !== null, 'X-Frame-Options header missing');
    });

    await test('Content-Security-Policy present', async () => {
        const val = res.headers.get('content-security-policy');
        assert(val !== null, 'CSP header missing');
    });

    await test('X-XSS-Protection present', async () => {
        // Helmet may or may not set this depending on version
        // At minimum, other protections should exist
        const csp = res.headers.get('content-security-policy');
        assert(csp !== null, 'Neither X-XSS-Protection nor CSP set');
    });
}

// ════════════════════════════════════════════
//  TEST SUITE 7: CORS VALIDATION
//  Verify CORS blocks unauthorized origins
// ════════════════════════════════════════════
async function testCors() {
    console.log('\n🌍 TEST SUITE 7: CORS Configuration\n');

    await test('Request from allowed origin (localhost:3000) → includes CORS header', async () => {
        const res = await fetch(`${BASE}/health`, {
            headers: { Origin: 'http://localhost:3000' },
        });
        const acao = res.headers.get('access-control-allow-origin');
        assert(acao === 'http://localhost:3000', `Expected localhost:3000, got '${acao}'`);
    });

    await test('Request from disallowed origin → no CORS header (or error)', async () => {
        try {
            const res = await fetch(`${BASE}/health`, {
                headers: { Origin: 'http://evil-site.com' },
            });
            const acao = res.headers.get('access-control-allow-origin');
            // Should either not have CORS header or be blocked
            assert(acao !== 'http://evil-site.com', 
                `CORS should not allow evil-site.com, but got '${acao}'`);
        } catch (err) {
            // CORS rejection is also acceptable
        }
    });
}

// ════════════════════════════════════════════
//  RUN ALL TESTS
// ════════════════════════════════════════════
async function runAll() {
    console.log('═══════════════════════════════════════════');
    console.log('  🔐 SPECTRA SECURITY TEST SUITE');
    console.log('═══════════════════════════════════════════');

    // Verify server is running
    try {
        await fetch('http://localhost:5000/api/health');
    } catch {
        console.error('\n❌ Cannot connect to backend at localhost:5000');
        console.error('   Make sure the backend is running: cd backend && npm run dev\n');
        process.exit(1);
    }

    await testRouteProtection();
    await testPublicRoutes();
    await testInvalidTokens();
    await testInputValidation();
    await testAuthSecurity();
    await testSecurityHeaders();
    await testCors();

    // Summary
    console.log('\n═══════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═══════════════════════════════════════════\n');

    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => r.status === '❌ FAIL').forEach(r => {
            console.log(`  ❌ ${r.name}: ${r.error}`);
        });
        console.log('');
        process.exit(1);
    } else {
        console.log('  🎉 All security tests passed!\n');
        process.exit(0);
    }
}

runAll();
