const { test } = require('node:test');
const assert = require('node:assert/strict');
const score = require('./applicantAcademicScore');

test('GPA and percentage produce the same filtering threshold', () => {
    assert.equal(score({ gpa: '3' }), score({ percentage: '75' }));
    assert.equal(score({ percentage: '62.5' }), 2.5);
    assert.equal(score({ percentage: '100' }), 4);
    assert.equal(score({ percentage: '0' }), 0);
    assert.equal(score({}), null);
    assert.equal(score({ gpa: '0' }), null);
});

test('invalid, conflicting and out-of-range scores are rejected', () => {
    for (const value of ['', ' ', 'abc', 'Infinity', '-1', [], {}]) {
        assert.throws(() => score({ percentage: value }));
        assert.throws(() => score({ gpa: value }));
    }
    assert.throws(() => score({ percentage: '101' }));
    assert.throws(() => score({ gpa: '4.1' }));
    assert.throws(() => score({ gpa: '3', percentage: '75' }));
});
