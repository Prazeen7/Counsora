const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const jwt = require('jsonwebtoken');
const secret = 'test-only-auth-secret';
const id = '507f1f77bcf86cd799439011';
const res = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
function load(name, dependencies, extra = {}) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/middleware', name), 'utf8'), {
        module, require: key => dependencies[key], ...extra,
    });
    return module.exports;
}
function setup(overrides = {}) {
    let reads = 0;
    const user = { role: 'counselor', sessionToken: 'session', isVerified: true, isApproved: true, ...overrides };
    const { authMiddleware } = load('authMiddleware.js', { jsonwebtoken: jwt, '../models/User': { async findById() { reads++; return user; } } }, { process: { env: { JWT_SECRET: secret } } });
    return { authMiddleware, reads: () => reads };
}
test('API gate only exempts exact POST authentication bootstrap routes', () => {
    let guarded = 0, passed = 0;
    const { apiAuthMiddleware } = load('apiAuthMiddleware.js', { './authMiddleware': { authMiddleware() { guarded++; } } });
    for (const route of ['/auth/signup', '/auth/login', '/auth/verify-email', '/auth/verification-status', '/auth/resend-verification', '/auth/verification-email']) apiAuthMiddleware({ method: 'POST', path: route }, {}, () => passed++);
    for (const [method, route] of [['GET', '/auth/login'], ['GET', '/auth/me'], ['POST', '/auth/login/extra'], ['GET', '/study-guides'], ['DELETE', '/country/123'], ['POST', '/new-future-endpoint']]) apiAuthMiddleware({ method, path: route }, {}, () => passed++);
    assert.equal(passed, 6);
    assert.equal(guarded, 6);
});
test('API gate is mounted before all API routes and request body parsing', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
    const gate = source.indexOf("app.use('/api',");
    assert.ok(gate > 0 && gate < source.indexOf('app.use(express.json'));
    assert.ok(gate < source.indexOf('app.use("/api/auth"'));
});
test('missing, malformed, expired and forged tokens return 401 without reading users', async () => {
    const api = setup();
    const expired = jwt.sign({ id, sessionToken: 'session' }, secret, { expiresIn: -1 });
    const forged = jwt.sign({ id, sessionToken: 'session' }, 'wrong-secret');
    for (const authorization of [undefined, '', 'Bearer ', 'Basic abc', 'Bearer abc extra', 'Bearer abc,def', 'Bearer null', 'Bearer ' + expired, 'Bearer ' + forged]) {
        const response = res();
        await api.authMiddleware({ headers: { authorization } }, response, () => assert.fail('Must reject'));
        assert.equal(response.statusCode, 401);
    }
    assert.equal(api.reads(), 0);
});
test('sessionless signed tokens and stale sessions cannot access protected routes', async () => {
    for (const payload of [{ id }, { id, sessionToken: '' }, { id, sessionToken: 'old-session' }]) {
        const response = res();
        await setup().authMiddleware({ headers: { authorization: 'Bearer ' + jwt.sign(payload, secret) } }, response, () => assert.fail('Must reject'));
        assert.equal(response.statusCode, 401);
    }
});
test('valid approved sessions pass and repeated guards do not repeat database queries', async () => {
    const api = setup();
    const request = { headers: { authorization: 'Bearer ' + jwt.sign({ id, sessionToken: 'session' }, secret) } };
    let passed = 0;
    await api.authMiddleware(request, res(), () => passed++);
    await api.authMiddleware(request, res(), () => passed++);
    assert.equal(passed, 2);
    assert.equal(api.reads(), 1);
});
test('unapproved or unverified users still cannot access protected routes', async () => {
    for (const overrides of [{ isApproved: false }, { isVerified: false }]) {
        const response = res();
        await setup(overrides).authMiddleware({ headers: { authorization: 'Bearer ' + jwt.sign({ id, sessionToken: 'session' }, secret) } }, response, () => assert.fail('Must reject'));
        assert.equal(response.statusCode, 403);
    }
});
