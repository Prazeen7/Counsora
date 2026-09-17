const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sendMail, validateMailConfig } = require('./mailDelivery');

function configure(t) {
    const before = { ...process.env };
    Object.assign(process.env, { EMAIL_PROVIDER: 'gmail-api', GMAIL_CLIENT_ID: 'client', GMAIL_CLIENT_SECRET: 'secret', GMAIL_REFRESH_TOKEN: 'refresh' });
    delete process.env.SMTP_HOST;
    t.after(() => {
        for (const key of ['EMAIL_PROVIDER', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'SMTP_HOST']) {
            if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
        }
    });
}
const message = { from: 'sender@example.com', to: 'recipient@example.com', subject: 'Verify', text: 'Verify link', html: '<img src="cid:logo">', attachments: [{ filename: 'logo.png', content: Buffer.from('image'), cid: 'logo' }] };

test('Gmail API sends MIME with attachment over HTTPS without SMTP configuration', async t => {
    configure(t);
    validateMailConfig();
    let calls = 0;
    t.mock.method(global, 'fetch', async (url, options) => {
        calls++;
        if (url === 'https://oauth2.googleapis.com/token') {
            assert.equal(options.body.get('grant_type'), 'refresh_token');
            assert.equal(options.body.get('refresh_token'), 'refresh');
            return { ok: true, json: async () => ({ access_token: 'access' }) };
        }
        assert.equal(url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
        assert.equal(options.headers.Authorization, 'Bearer access');
        const raw = JSON.parse(options.body).raw;
        assert.match(raw, /^[A-Za-z0-9_-]+$/);
        const mime = Buffer.from(raw, 'base64url').toString();
        assert.match(mime, /To: recipient@example.com/);
        assert.match(mime, /Content-ID: <logo>/);
        assert.match(mime, /Verify link/);
        return { ok: true, json: async () => ({ id: 'sent-id' }) };
    });
    assert.deepEqual(await sendMail(message), { messageId: 'sent-id' });
    assert.equal(calls, 2);
});

test('invalid refresh tokens fail safely without retries or SMTP fallback', async t => {
    configure(t);
    const mock = t.mock.method(global, 'fetch', async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant', error_description: 'private details' }) }));
    await assert.rejects(sendMail(message), error => error.code === 'GMAIL_AUTH' && !error.message.includes('private details'));
    assert.equal(mock.mock.callCount(), 1);
});

test('temporary Gmail failures retry the same MIME payload', async t => {
    configure(t);
    const payloads = [];
    t.mock.method(global, 'fetch', async (url, options) => {
        if (url.includes('oauth2')) return { ok: true, json: async () => ({ access_token: 'access' }) };
        payloads.push(options.body);
        return payloads.length === 1 ? { ok: false, status: 503, json: async () => ({}) } : { ok: true, json: async () => ({ id: 'sent' }) };
    });
    await sendMail(message, { wait: async () => {} });
    assert.equal(payloads.length, 2);
    assert.equal(payloads[0], payloads[1]);
});

test('missing Gmail configuration fails before network access', async t => {
    configure(t);
    delete process.env.GMAIL_REFRESH_TOKEN;
    const mock = t.mock.method(global, 'fetch', async () => assert.fail('Unexpected request'));
    await assert.rejects(sendMail(message), { code: 'EMAIL_CONFIG' });
    assert.equal(mock.mock.callCount(), 0);
});
