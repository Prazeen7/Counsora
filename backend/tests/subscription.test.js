const test = require('node:test');
const assert = require('node:assert/strict');
const { createSubscription, subscriptionError } = require('../src/utils/subscription');

test('one day ends at next Nepal midnight, including when UTC date differs', () => {
    const result = createSubscription({ value: 1, unit: 'days' }, new Date('2026-09-14T20:00:00Z'));
    assert.equal(result.subscriptionExpiresAt.toISOString(), '2026-09-15T18:15:00.000Z');
    const user = { role: 'counselor', ...result };
    assert.equal(subscriptionError(user, new Date('2026-09-15T18:14:59.999Z')), null);
    assert.equal(subscriptionError(user, result.subscriptionExpiresAt).code, 'SUBSCRIPTION_EXPIRED');
});
test('eight days, calendar months and leap years retain exact duration', () => {
    const now = new Date('2024-01-31T06:00:00Z');
    assert.equal(createSubscription({ value: 8, unit: 'days' }, now).subscriptionExpiresAt.toISOString(), '2024-02-07T18:15:00.000Z');
    const month = createSubscription({ value: 1, unit: 'months' }, now);
    assert.deepEqual(month.subscriptionDuration, { value: 1, unit: 'months' });
    assert.equal(month.subscriptionExpiresAt.toISOString(), '2024-02-28T18:15:00.000Z');
    assert.equal(createSubscription({ value: 1, unit: 'years' }, new Date('2024-02-29T06:00:00Z')).subscriptionExpiresAt.toISOString(), '2025-02-27T18:15:00.000Z');
});
test('chosen date remains accessible through the end of that Nepal day', () => {
    const result = createSubscription({ unit: 'date', endDate: '2026-09-22' }, new Date('2026-09-15T06:00:00Z'));
    assert.equal(result.subscriptionExpiresAt.toISOString(), '2026-09-22T18:15:00.000Z');
    assert.deepEqual(result.subscriptionDuration, { value: 8, unit: 'days' });
});
test('invalid durations and dates are rejected', () => {
    for (const value of [0, -1, 1.5, '8', Infinity, Number.MAX_SAFE_INTEGER]) assert.throws(() => createSubscription({ value, unit: 'days' }));
    for (const endDate of ['2026-02-30', 'invalid', '2000-01-01']) assert.throws(() => createSubscription({ unit: 'date', endDate }));
    assert.throws(() => createSubscription({ value: 1, unit: 'weeks' }));
});
test('missing subscriptions block users while superadmins are exempt', () => {
    assert.equal(subscriptionError({ role: 'admin' }).code, 'SUBSCRIPTION_REQUIRED');
    assert.equal(subscriptionError({ role: 'superAdmin' }), null);
});
