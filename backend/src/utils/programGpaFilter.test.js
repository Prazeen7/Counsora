const { test } = require('node:test');
const assert = require('node:assert/strict');
const filter = require('./programGpaFilter');
const applicantScore = require('./applicantAcademicScore');

test('MongoDB compares GPA and percentages, scales, overrides and inherited scores', {
    skip: process.env.RUN_MONGO_FILTER_TESTS !== '1',
}, async () => {
    require('dotenv').config({ quiet: true });
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    try {
        const direct = (id, score, score_type, scale) => ({ _id: id, level: 'Bachelor',
            entry_requirements: { academic: { score, score_type, scale } } });
        const inherited = (id, score, type, scale) => ({ _id: id, level: 'Bachelor',
            gpaInstitution: [{ entryRequirements: { undergraduate: { gpa: { score, type, scale } } } }] });
        const fixtures = [
            direct('percentage-equal', 75, 'Percentage'),
            direct('percentage-higher', 76, 'Percentage'),
            direct('gpa-equal', 3, 'GPA', 4),
            direct('gpa-higher', 3.1, 'GPA', 4),
            direct('ten-point', 7.5, 'GPA', 10),
            inherited('inherited-percentage', '70', 'Percentage', '100'),
            inherited('inherited-ten-point', '7.5', 'GPA', '10'),
            inherited('inherited-higher', '80', 'Percentage', '100'),
            { ...inherited('override', '90', 'Percentage'), entry_requirements: { academic: { score: 70, score_type: 'Percentage' } } },
            { _id: 'unknown', level: 'Bachelor' },
        ];
        for (const query of [{ gpa: '3' }, { percentage: '75' }]) {
            // Use literal documents and omit lookup: no database writes or application records.
            const rows = await mongoose.connection.db.aggregate([
                { $documents: fixtures }, ...filter(applicantScore(query)).slice(1),
            ]).toArray();
            assert.deepEqual(rows.map(row => row._id).sort(), [
                'percentage-equal', 'gpa-equal', 'ten-point', 'inherited-percentage',
                'inherited-ten-point', 'override', 'unknown',
            ].sort());
        }
    } finally {
        await mongoose.disconnect();
    }
});
