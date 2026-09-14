const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(initial, { failShift = false } = {}) {
    let rows = structuredClone(initial);
    let shifts = 0;
    const session = {};
    const matches = (row, query) => row.country === query.country && (!query._id || row._id !== query._id.$ne) &&
        (typeof query.order === 'number' ? row.order === query.order : '$gt' in query.order ? row.order > query.order.$gt : row.order >= query.order.$gte);
    const module = { exports: {} };
    const deps = {
        mongoose: { connection: { async transaction(callback) {
            const previous = structuredClone(rows);
            try { await callback(session); } catch (error) { rows = previous; throw error; }
        } } },
        '../models/Country': { async updateOne(query, update, options) {
            assert.equal(options.session, session);
            assert.ok(query._id);
            assert.equal(update.$inc.__v, 1);
            return { matchedCount: 1 };
        } },
        '../models/StudyGuide': {
            findById(id) { return { async session(value) { assert.equal(value, session); return rows.find(row => row._id === id); } }; },
            async deleteOne(query, options) {
                assert.equal(options.session, session);
                rows = rows.filter(row => row._id !== query._id);
            },
            exists(query) { return { async session(value) { assert.equal(value, session); return rows.some(row => matches(row, query)); } }; },
            async updateMany(query, update, options) {
                assert.equal(options.session, session);
                if (failShift) throw Error('Shift failed');
                shifts++;
                rows.forEach(row => { if (matches(row, query)) row.order += update.$inc.order; });
            },
        },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/utils/saveOrderedStudyGuide.js'), 'utf8'), { module, require: name => deps[name] });
    return {
        rows: () => rows,
        shifts: () => shifts,
        remove: id => module.exports.deleteOrderedStudyGuide(id),
        save(fields, { invalid = false, failSave = false } = {}) {
            return module.exports.saveOrderedStudyGuide({
                ...fields,
                async validate() { if (invalid) throw Error('Invalid content'); },
                async save(options) {
                    assert.equal(options.session, session);
                    if (failSave) throw Error('Duplicate label');
                    rows = [...rows.filter(row => row._id !== fields._id), { ...fields }];
                },
            });
        },
    };
}
const initial = [
    { _id: 'a', country: 'DE', order: 1 },
    { _id: 'b', country: 'DE', order: 2 },
    { _id: 'c', country: 'DE', order: 3 },
    { _id: 'n', country: 'NZ', order: 2 },
];
const orders = fixture => Object.fromEntries(fixture.rows().map(row => [row._id, row.order]));

test('creating at an occupied order shifts that and later topics only in the same country', async () => {
    const data = fixture(initial);
    await data.save({ _id: 'new', country: 'DE', order: 2 });
    assert.deepEqual(orders(data), { a: 1, b: 3, c: 4, n: 2, new: 2 });
});
test('editing to an occupied position excludes the edited topic from the shift', async () => {
    const data = fixture(initial);
    await data.save({ _id: 'c', country: 'DE', order: 1 });
    assert.deepEqual(orders(data), { a: 2, b: 3, n: 2, c: 1 });
});
test('saving at the same order without another occupant leaves other topics unchanged', async () => {
    const data = fixture(initial);
    await data.save(initial[1]);
    assert.deepEqual(orders(data), { a: 1, c: 3, n: 2, b: 2 });
    assert.equal(data.shifts(), 0);
});
test('an unoccupied order does not shift later topics', async () => {
    const data = fixture(initial);
    await data.save({ _id: 'new', country: 'DE', order: 0 });
    assert.deepEqual(orders(data), { a: 1, b: 2, c: 3, n: 2, new: 0 });
    assert.equal(data.shifts(), 0);
});
test('country changes shift only the destination country', async () => {
    const data = fixture(initial);
    await data.save({ _id: 'a', country: 'NZ', order: 2 });
    assert.deepEqual(orders(data), { b: 2, c: 3, n: 3, a: 2 });
});
test('validation failures never shift and failed saves roll back shifts', async () => {
    const data = fixture(initial);
    await assert.rejects(data.save({ _id: 'new', country: 'DE', order: 2 }, { invalid: true }));
    assert.equal(data.shifts(), 0);
    await assert.rejects(data.save({ _id: 'new', country: 'DE', order: 2 }, { failSave: true }));
    assert.deepEqual(data.rows(), initial);
});
test('shifts cannot exceed the safe integer limit', async () => {
    const data = fixture([...initial, { _id: 'max', country: 'DE', order: Number.MAX_SAFE_INTEGER }]);
    await assert.rejects(data.save({ _id: 'new', country: 'DE', order: 2 }), /too large/);
    assert.equal(data.shifts(), 0);
});

test('deleting a middle topic closes the gap within its country', async () => {
    const data = fixture(initial);
    await data.remove('b');
    assert.deepEqual(orders(data), { a: 1, c: 2, n: 2 });
});
test('deleting first, last and only topics preserves valid indexes', async () => {
    const data = fixture(initial);
    await data.remove('a');
    assert.deepEqual(orders(data), { b: 1, c: 2, n: 2 });
    await data.remove('c');
    assert.deepEqual(orders(data), { b: 1, n: 2 });
    await data.remove('b');
    assert.deepEqual(orders(data), { n: 2 });
});
test('missing deletes do not shift anything and failed shifts roll back deletion', async () => {
    const data = fixture(initial);
    await assert.rejects(data.remove('missing'), error => error.status === 404);
    assert.deepEqual(data.rows(), initial);
    const failing = fixture(initial, { failShift: true });
    await assert.rejects(failing.remove('b'), /Shift failed/);
    assert.deepEqual(failing.rows(), initial);
});
