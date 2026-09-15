const { createRequire } = require('node:module');
const requireBackend = createRequire(require('node:path').resolve(__dirname, '../backend/package.json'));
requireBackend('dotenv').config({ path: require('node:path').resolve(__dirname, '../backend/.env'), quiet: true });
const mongoose = requireBackend('mongoose');
const replacements = new Map([
  ['Passport photograph', 'MRP photograph meeting immigration photograph requirements.'],
  ['Police report', 'Provide a valid police report no more than 3 months old.'],
  ['Handwritten Statement of Purpose', 'Provide an SOP handwritten by the student personally.'],
  ['Pre-medical examination evidence', 'Complete the examination after receiving the offer and submit the results with the visa application. Providers include Norvic, TMMC, Nepal Mendicity and IOM.'],
  ['Loan sanction letter and mortgage deed', 'Submit a loan sanction letter and mortgage deed from Nabil or Nepal SBI Bank with the visa application for loan-funded cases.'],
  ['Funds and liquid savings evidence', 'Provide evidence of 60 lakhs in funds and around 10 lakhs in liquid funds, including evidence of the relevant funding sources. Currency is unspecified.'],
  ['Sponsor relationship verification and citizenship', 'Provide relationship verification documents and sponsors’ citizenship certificates. Sponsors should be immediate family members or siblings.'],
  ['Form INZ 1226', 'Provide Form INZ 1226.'],
  ['Income certificate', 'Provide an income certificate from the ward, with supporting evidence for the applicable income sources.'],
  ['Business income evidence (if applicable)', 'Provide PAN, renewed business registration, TDS for 3 years, statements and an audit report from an auditor authorised in IRRC.'],
  ['Agricultural income evidence (if applicable)', 'Provide a ward certificate with tax exemption and supporting documents. Agricultural income must be below 4 lakhs; currency and period are unspecified.'],
  ['Clarification and declaration letters (if requested)', 'Provide clarification or declaration letters and supporting evidence when requested to satisfy the visa officer. Submitted documents may be digitally verified or investigated for authenticity.'],
  ['Fee payment proof after Approval in Principle', 'After receiving Approval in Principle (AIP), transfer funds to the education provider as invoiced and provide payment proof. Use the same original funding source: loan funds for a loan case or bank balance for a balance-funded case. Payment proof is usually requested within 7 days.'],
]);
(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const country = await mongoose.connection.collection('countries').findOne({ name: /^new zealand$/i });
  if (!country) throw Error('Country missing');
  const collection = mongoose.connection.collection('documents');
  const records = await collection.find({ country: country._id }, { projection: { previewData: 0, preview: 0 } }).toArray();
  const edits = [...replacements].map(([title, details]) => {
    const matches = records.filter(record => record.title === title);
    if (matches.length !== 1) throw Error('Expected one record: ' + title);
    return { record: matches[0], details };
  });
  require('node:fs').writeFileSync(require('node:path').join(__dirname, 'nz-document-wording-backup.json'), JSON.stringify(edits, null, 2));
  for (const { record, details } of edits) {
    const result = await collection.updateOne({ _id: record._id, country: country._id, details: record.details }, { $set: { details, updatedAt: new Date() } });
    if (result.matchedCount !== 1) throw Error('Record changed before update: ' + record.title);
  }
  const updated = await collection.find({ country: country._id }, { projection: { title: 1, details: 1 } }).toArray();
  for (const [title, details] of replacements) {
    if (!updated.some(record => record.title === title && record.details === details)) throw Error('Verification failed: ' + title);
  }
  if (updated.some(record => /checklist|supplied|as listed|it states|it lists/i.test(record.details))) throw Error('Reference wording remains');
  console.log('Updated and verified ' + edits.length + ' New Zealand entries; no checklist references remain.');
})().catch(error => { console.error(error.message.replace(/mongodb[^ ]*/gi, '[redacted]')); process.exitCode = 1; }).finally(() => mongoose.disconnect());
