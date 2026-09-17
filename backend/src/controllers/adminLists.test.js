const { test } = require('node:test');
const assert = require('node:assert/strict');
const Country = require('../models/Country');
const User = require('../models/User');
const { getAllCountries } = require('./countryController');
const userRouter = require('../routes/userRoutes');
const getUsers = userRouter.stack.find(layer => layer.route?.path === '/' && layer.route.methods.get).route.stack.at(-1).handle;

function response() {
    return { statusCode: 200, status(code) { this.statusCode = code; return this; }, set() { return this; }, json(body) { this.body = body; return this; } };
}

for (const [name, Model, handler, fields, key] of [
    ['countries', Country, getAllCountries, ['name', 'code', 'currency'], 'countries'],
    ['users', User, getUsers, ['name', 'email', 'organizationName'], 'users'],
]) {
    test(`${name} apply search and pagination in the database with a matching total`, async t => {
        const expected = { $or: fields.map(field => ({ [field]: { $regex: 'A\\+B', $options: 'i' } })) };
        if (name === 'users') Object.assign(expected, { role: 'counselor', organizationName: 'Agency' });
        let selected = false;
        t.mock.method(Model, 'find', filter => {
            assert.deepEqual(filter, expected);
            return {
                select(value) { selected = true; assert.ok(!value.includes('password')); assert.ok(!value.includes('sessionToken')); return this; },
                sort(value) { assert.deepEqual(value, name === 'countries' ? { name: 1, _id: 1 } : { createdAt: -1, _id: -1 }); return this; },
                skip(value) { assert.equal(value, 20); return this; },
                limit(value) { assert.equal(value, 10); return this; },
                lean: async () => [{ name: 'A+B' }],
            };
        });
        t.mock.method(Model, 'countDocuments', async filter => { assert.deepEqual(filter, expected); return 21; });
        if (name === 'users') t.mock.method(User, 'distinct', async () => ['Agency']);
        const res = response();
        await handler({ query: { page: '3', limit: '10', search: 'A+B', view: 'counselor', organization: 'Agency' } }, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.total, 21);
        assert.equal(res.body.page, 3);
        assert.equal(res.body.limit, 10);
        assert.deepEqual(res.body[key], [{ name: 'A+B' }]);
        if (name === 'users') assert.ok(selected);
    });

    test(`${name} reject invalid pagination before querying the database`, async t => {
        const find = t.mock.method(Model, 'find', () => { throw Error('Must not query'); });
        for (const query of [{ limit: '101' }, { page: '-2' }, { search: { $ne: '' } }]) {
            const res = response();
            await handler({ query }, res);
            assert.equal(res.statusCode, 400);
        }
        assert.equal(find.mock.callCount(), 0);
    });
}
