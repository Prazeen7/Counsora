// Nepal calendar dates, independent of the server's local timezone.
const OFFSET = 345 * 60 * 1000;
const DAY = 86400000;
function calendarStart(now) {
    const local = new Date(now.getTime() + OFFSET);
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}
function createSubscription({ value, unit, endDate }, now = new Date()) {
    const start = calendarStart(now);
    let end;
    if (unit === 'date') {
        if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error('Choose a valid last-access date');
        const date = new Date(`${endDate}T00:00:00.000Z`);
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== endDate || date < start) throw new Error('Last-access date must be today or later');
        end = new Date(date.getTime() + DAY);
        value = (end - start) / DAY;
        unit = 'days';
    } else {
        if (!Number.isSafeInteger(value) || value < 1 || !['days', 'months', 'years'].includes(unit)) throw new Error('Enter a positive whole number of days, months, or years');
        end = new Date(start);
        if (unit === 'days') end.setUTCDate(end.getUTCDate() + value);
        else {
            const day = end.getUTCDate();
            end.setUTCDate(1);
            end.setUTCMonth(end.getUTCMonth() + value * (unit === 'years' ? 12 : 1));
            const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
            end.setUTCDate(Math.min(day, lastDay));
        }
    }
    if (!Number.isFinite(end.getTime()) || end.getUTCFullYear() > 9999) throw new Error('Subscription duration is too large');
    return { subscriptionDuration: { value, unit }, subscriptionStartsAt: now, subscriptionExpiresAt: new Date(end.getTime() - OFFSET) };
}
function subscriptionError(user, now = new Date()) {
    if (user.role === 'superAdmin') return null;
    if (!user.subscriptionExpiresAt) return { code: 'SUBSCRIPTION_REQUIRED', error: 'No subscription is assigned to your account. Please contact your superadmin.' };
    if (!(new Date(user.subscriptionExpiresAt).getTime() > now.getTime())) return { code: 'SUBSCRIPTION_EXPIRED', error: 'Your subscription has expired. Please contact your superadmin to renew access.' };
    return null;
}
module.exports = { createSubscription, subscriptionError };
