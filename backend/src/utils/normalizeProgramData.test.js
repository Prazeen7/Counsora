const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Program = require('../models/Program');
const { normalizeProgramsArray } = require('./normalizeProgramData');

function normalize(fees) {
    const { normalized, errors } = normalizeProgramsArray([{
        degree_name: 'Master of Chemistry', url: 'https://example.edu/chemistry', tuition_fees: fees
    }]);
    assert.deepEqual(errors, []);
    return normalized[0];
}

test('foreign-currency fees survive crawl normalization, approval normalization and database casting', async () => {
    const fees = [{ display_text: 'NZ$72,250 for the full programme', credits: '180 points', annual_fee_eur: null }];
    const review = normalize(fees);
    const approval = normalize(review.tuition_fees);
    const document = new Program({ ...approval, institutionId: new mongoose.Types.ObjectId() });
    await document.validate();
    assert.deepEqual(document.toObject().tuition_fees, fees);
    const hydrated = Program.hydrate(document.toObject());
    assert.deepEqual(hydrated.toObject().tuition_fees, fees);
});

test('preserves EUR fees and legacy numeric-only fee records', () => {
    const fees = [
        { display_text: 'EUR 12,000 per year', credits: '120 ECTS', annual_fee_eur: 12000 },
        { credits: '60 ECTS', annual_fee_eur: 8000 }
    ];
    assert.deepEqual(normalize(fees).tuition_fees, [fees[0], { display_text: null, ...fees[1] }]);
});

test('preserves review fee text without inventing an EUR amount', () => {
    assert.deepEqual(normalize('NZ$72,250 for the full programme').tuition_fees, [
        { display_text: 'NZ$72,250 for the full programme', credits: null, annual_fee_eur: null }
    ]);
    assert.deepEqual(normalize(['  ', null]).tuition_fees, []);
});
