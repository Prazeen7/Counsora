import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup(token = 'current-token', status = 200) {
    const stored = new Map(token === null ? [] : [['token', token], ['user', '{}']]);
    const calls = [];
    const window = { location: { origin: 'https://app.example', href: '/study-guide' } };
    const source = fs.readFileSync(new URL('./authenticatedFetch.js', import.meta.url), 'utf8')
        .replace('import.meta.env.VITE_BACKEND_URL', "'https://api.example/api'")
        .replace('export async function', 'async function');
    const context = vm.createContext({ URL, Headers, FormData, window,
        localStorage: { getItem: key => stored.get(key) ?? null, removeItem: key => stored.delete(key) },
        sessionStorage: { setItem() {} },
        fetch: async (url, options) => { calls.push({ url, options }); return new Response('{}', { status }); },
    });
    vm.runInContext(source, context);
    return { request: context.apiFetch, calls, stored, window };
}
test('custom headers cannot remove or override the session token', async () => {
    const api = setup();
    await api.request('https://api.example/api/study-guides', { headers: { authorization: 'Bearer wrong', 'X-Example': 'preserved' } });
    assert.equal(api.calls[0].options.headers.get('authorization'), 'Bearer current-token');
    assert.equal(api.calls[0].options.headers.get('x-example'), 'preserved');
});
test('tokenless protected requests never reach fetch', async () => {
    for (const token of [null, '', 'null', 'undefined', '   ']) {
        const api = setup(token);
        await assert.rejects(api.request('https://api.example/api/study-guides'), /token is missing/);
        assert.equal(api.calls.length, 0);
        assert.equal(api.window.location.href, '/login');
    }
});
test('login works without a token and rejected credentials do not redirect', async () => {
    const api = setup(null, 401);
    const response = await api.request('https://api.example/api/auth/login', { method: 'POST' });
    assert.equal(response.status, 401);
    assert.equal(api.calls.length, 1);
    assert.equal(api.window.location.href, '/study-guide');
    await assert.rejects(api.request('https://api.example/api/auth/login', { method: 'GET' }), /token is missing/);
});
test('uploads include authentication and let the browser generate the multipart boundary', async () => {
    const api = setup();
    const body = new FormData(); body.append('title', 'Example');
    await api.request('https://api.example/api/documents', { method: 'POST', body, headers: { 'Content-Type': 'multipart/form-data' } });
    assert.equal(api.calls[0].options.headers.get('authorization'), 'Bearer current-token');
    assert.equal(api.calls[0].options.headers.has('content-type'), false);
    assert.equal(api.calls[0].options.body, body);
});
test('invalid session responses clear stored credentials', async () => {
    const api = setup('expired', 401);
    await api.request('https://api.example/api/auth/me');
    assert.equal(api.stored.has('token'), false);
    assert.equal(api.stored.has('user'), false);
    assert.equal(api.window.location.href, '/login');
});
test('tokens cannot be sent to other origins or outside the backend API prefix', async () => {
    const api = setup();
    for (const url of ['https://other.example/api/program', 'https://api.example/api-other/program']) await assert.rejects(api.request(url), /configured backend/);
    assert.equal(api.calls.length, 0);
});
