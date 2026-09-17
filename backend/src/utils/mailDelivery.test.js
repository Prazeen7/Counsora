const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendMail } = require('./mailDelivery');

test('temporary SMTP failures retry with the same verification message', async t => {
    let attempts = 0;
    let closed = 0;
    const waits = [];
    const message = { to: 'test@example.com', text: 'same link', messageId: 'same-id' };
    t.mock.method(nodemailer, 'createTransport', () => ({
        async sendMail(value) {
            assert.equal(value, message);
            if (++attempts < 3) throw Object.assign(new Error('Temporary failure'), { code: 'ETIMEDOUT' });
            return { accepted: ['test@example.com'] };
        },
        close() { closed++; },
    }));
    const result = await sendMail(message, { wait: async ms => waits.push(ms) });
    assert.equal(result.accepted.length, 1);
    assert.equal(attempts, 3);
    assert.equal(closed, 3);
    assert.deepEqual(waits, [1000, 2000]);
});

test('authentication and permanent recipient failures are not retried', async t => {
    for (const detail of [{ code: 'EAUTH', responseCode: 535 }, { code: 'EENVELOPE', responseCode: 550 }]) {
        let attempts = 0;
        t.mock.method(nodemailer, 'createTransport', () => ({
            async sendMail() { attempts++; throw Object.assign(new Error('Failure'), detail); }, close() {},
        }));
        await assert.rejects(sendMail({}, { wait: async () => assert.fail('Should not retry') }));
        assert.equal(attempts, 1);
    }
});

test('temporary provider errors stop after three attempts', async t => {
    let attempts = 0;
    t.mock.method(nodemailer, 'createTransport', () => ({
        async sendMail() { attempts++; throw Object.assign(new Error('Busy'), { responseCode: 451 }); }, close() {},
    }));
    await assert.rejects(sendMail({}, { wait: async () => {} }));
    assert.equal(attempts, 3);
});
