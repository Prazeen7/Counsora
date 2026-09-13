const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ valid = true, found = true, failPrograms = false } = {}) {
    const session = {};
    const calls = [];
    const mocks = {
        '../models/Institution': {
            async findByIdAndDelete(id, options) {
                assert.equal(options.session, session);
                calls.push(['institution', id]);
                return found ? { _id: id } : null;
            },
        },
        '../models/Program': {
            async deleteMany(filter, options) {
                assert.equal(options.session, session);
                assert.deepEqual(Object.keys(filter), ['institutionId']);
                calls.push(['programs', filter.institutionId]);
                if (failPrograms) throw new Error('Database failure');
                return { deletedCount: 3 };
            },
        },
        mongoose: {
            Types: { ObjectId: { isValid: () => valid } },
            connection: {
                async transaction(callback) {
                    try {
                        const result = await callback(session);
                        calls.push(['commit']);
                        return result;
                    } catch (error) {
                        calls.push(['rollback']);
                        throw error;
                    }
                },
            },
        },
    };
    const context = {
        require: (name) => mocks[name] || {},
        module: { exports: {} },
        process: { env: {} },
        console: { error() {} },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/institutionController.js'), 'utf8'), context);
    const response = {
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
    return { run: () => context.module.exports.deleteInstitution({ params: { id: 'institution-1' } }, response), response, calls };
}

test('deletes institution and all its programs in the same transaction', async () => {
    const { run, response, calls } = setup();
    await run();
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.deletedProgramCount, 3);
    assert.deepEqual(calls, [['institution', 'institution-1'], ['programs', 'institution-1'], ['commit']]);
});

test('invalid institution IDs do not touch the database', async () => {
    const { run, response, calls } = setup({ valid: false });
    await run();
    assert.equal(response.statusCode, 400);
    assert.deepEqual(calls, []);
});

test('missing institutions return 404 without deleting programs', async () => {
    const { run, response, calls } = setup({ found: false });
    await run();
    assert.equal(response.statusCode, 404);
    assert.equal(calls.some(([operation]) => operation === 'programs'), false);
});

test('program deletion failures propagate out of the transaction for rollback', async () => {
    const { run, response, calls } = setup({ failPrograms: true });
    await run();
    assert.equal(response.statusCode, 500);
    assert.deepEqual(calls.at(-1), ['rollback']);
    assert.equal(calls.some(([operation]) => operation === 'commit'), false);
});
