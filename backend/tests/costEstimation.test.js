const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateEstimate, validateCostSheet } = require('../src/utils/costEstimation');
const { convertCostEstimate } = require('../src/utils/convertCostEstimate');
const sheet = require('../scripts/data/new-zealand-cost-sheet.json');
const find = (estimate, key) => estimate.stages.flatMap(s => s.items).find(i => i.key === key);
const rates = [{ currency: { iso3: 'NZD', unit: 1 }, sell: 80, buy: 79 }];

test('loan defaults produce a processing expense, not a second principal expense', () => {
    validateCostSheet(sheet, { countryCurrency: 'NZD' });
    const result = calculateEstimate(sheet);
    assert.equal(find(result, 'bank_processing_fee').amount, 0.75);
    assert.equal(find(result, 'bank_processing_cost').amount, 56250);
    assert.equal(find(result, 'disbursement_amount_npr').amount, 7500000);
    assert.equal(find(result, 'interest_rate').amount, 8);
    assert.equal(result.stages.find(s => s.key === 'visa_documentation').subtotal, 80250);
    assert.equal(find(result, 'education_tax').amount, null);
});

test('changed loan and tuition inputs recalculate across stages and convert costs only', () => {
    const result = calculateEstimate(sheet, { application_cost: 100, tuition_fee_amount: 20000, payment_company_fees: 1000, loan_term_months: 120 });
    assert.equal(find(result, 'education_tax').amount, 600);
    assert.equal(result.isComplete, true);
    assert.equal(convertCostEstimate(result, rates).totalNpr, 1890745);
    const changed = calculateEstimate(sheet, { bank_loan_amount_npr: 4000000, bank_processing_fee: 1, tuition_fee_amount: 30000 });
    assert.equal(find(changed, 'bank_processing_cost').amount, 40000);
    assert.equal(find(changed, 'disbursement_amount_npr').amount, 4000000);
    assert.equal(find(changed, 'education_tax').amount, 900);
});

test('zero values work and derived amounts cannot be forged', () => {
    const result = calculateEstimate(sheet, { bank_loan_amount_npr: 0, tuition_fee_amount: 0 });
    assert.equal(find(result, 'bank_processing_cost').amount, 0);
    assert.equal(find(result, 'disbursement_amount_npr').amount, 0);
    assert.equal(find(result, 'education_tax').amount, 0);
    assert.throws(() => calculateEstimate(sheet, { education_tax: 1 }), /cannot be overridden/);
    assert.throws(() => calculateEstimate(sheet, { interest_rate: 101 }), /Percentage/);
});

test('unavailable foreign exchange never becomes a fake NPR subtotal', () => {
    const result = convertCostEstimate(calculateEstimate(sheet, { tuition_fee_amount: 10000 }), []);
    assert.equal(result.totalNpr, null);
    assert.equal(result.stages.find(s => s.key === 'visa_lodgement').subtotalNpr, null);
    assert.equal(result.stages.find(s => s.key === 'visa_documentation').subtotalNpr, 80250);
});

test('formula validation rejects missing, cyclic, and cross-currency dependencies', () => {
    for (const mutate of [
        item => { item.calculation.baseKey = 'missing'; },
        item => { item.calculation.baseKey = 'education_tax'; },
        item => { item.currency = 'NPR'; },
    ]) {
        const invalid = structuredClone(sheet);
        mutate(find(invalid, 'education_tax'));
        assert.throws(() => validateCostSheet(invalid, { countryCurrency: 'NZD' }));
    }
});

test('ordinary sheets retain their existing calculation behavior', () => {
    const ordinary = { title: 'Other country', stages: [{ key: 'first', title: 'First', items: [{ key: 'fee', label: 'Fee', amount: 100, currency: 'NPR' }] }] };
    validateCostSheet(ordinary);
    assert.equal(calculateEstimate(ordinary, { fee: 50 }).total, 50);
});

test('live input preview matches the server including defaults and reset', async () => {
    const { resolveCostInputs } = await import('../../frontend/src/utils/costInputs.js');
    const initial = calculateEstimate(sheet).stages.flatMap(s => s.items);
    for (const values of [{}, { bank_loan_amount_npr: '3000000', tuition_fee_amount: '12345.67' }, { bank_loan_amount_npr: 0, tuition_fee_amount: 0 }, { bank_loan_amount_npr: '', tuition_fee_amount: '' }]) {
        const preview = resolveCostInputs(initial, values);
        const numeric = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? '' : Number(v)]));
        for (const item of calculateEstimate(sheet, numeric).stages.flatMap(s => s.items)) assert.equal(preview[item.key], item.amount);
    }
});

test('mongoose retains formula and percent metadata', async () => {
    const mongoose = require('mongoose');
    const Model = require('../src/models/CostSheet');
    const document = new Model({ ...sheet, country: new mongoose.Types.ObjectId() });
    await document.validate();
    assert.deepEqual(find(document.toObject(), 'education_tax').calculation, { type: 'percentage', baseKey: 'tuition_fee_amount', rate: 3 });
});

test('EMI uses principal, annual rate and term without changing upfront totals', () => {
    const result = calculateEstimate(sheet, { bank_loan_amount_npr: 100000, interest_rate: 12, loan_term_months: 12 });
    assert.equal(find(result, 'monthly_emi').amount, 8884.88);
    assert.equal(find(calculateEstimate(sheet, { bank_loan_amount_npr: 120000, interest_rate: 0, loan_term_months: 12 }), 'monthly_emi').amount, 10000);
    const withoutTerm = structuredClone(sheet);
    find(withoutTerm, 'loan_term_months').amount = null;
    assert.equal(find(calculateEstimate(withoutTerm), 'monthly_emi').amount, null);
    assert.throws(() => calculateEstimate(sheet, { loan_term_months: 0 }), /Loan term/);
    assert.throws(() => calculateEstimate(sheet, { loan_term_months: 12.5 }), /Loan term/);
    const a = convertCostEstimate(calculateEstimate(sheet, { loan_term_months: 12 }), rates);
    const b = convertCostEstimate(calculateEstimate(sheet, { loan_term_months: 120 }), rates);
    assert.equal(a.totalNpr, b.totalNpr);
});

test('processing rate and cost display together and EMI preview matches results', async () => {
    const { resolveCostInputs, formCostItems, reportCostItems, reportCostLabel } = await import('../../frontend/src/utils/costInputs.js');
    const result = calculateEstimate(sheet, { loan_term_months: 120 });
    const items = result.stages.flatMap(s => s.items);
    assert.equal(formCostItems(items).some(i => i.key === 'bank_processing_cost'), false);
    assert.equal(reportCostItems(items).some(i => i.key === 'bank_processing_fee'), false);
    assert.match(reportCostLabel(find(result, 'bank_processing_cost'), items, n => `NPR ${n}`), /0.75% \(NPR 56250\)/);
    assert.equal(resolveCostInputs(items, { loan_term_months: 120 }).monthly_emi, find(result, 'monthly_emi').amount);
});

test('loan repayment appears separately only for a loan and tuition is counted once', async () => {
    const { loanRepaymentItems, reportCostItems, formCostItems } = await import('../../frontend/src/utils/costInputs.js');
    const inputs = { tuition_fee_amount: 20000, bank_processing_fee: 0 };
    const loan = convertCostEstimate(calculateEstimate(sheet, inputs), rates);
    const noLoan = convertCostEstimate(calculateEstimate(sheet, { ...inputs, bank_loan_amount_npr: 0 }), rates);
    assert.equal(loan.totalNpr, noLoan.totalNpr);
    assert.equal(loanRepaymentItems(loan.stages).length, 1);
    assert.equal(loanRepaymentItems(noLoan.stages).length, 0);
    const items = loan.stages.flatMap(s => s.items);
    assert.equal(formCostItems(items).some(i => i.key === 'monthly_emi'), false);
    const rows = reportCostItems(items);
    for (const key of ['bank_loan_amount_npr', 'disbursement_amount_npr', 'monthly_emi']) assert.equal(rows.some(i => i.key === key), false);
    assert.equal(rows.filter(i => i.key === 'tuition_fee_amount').length, 1);
});
