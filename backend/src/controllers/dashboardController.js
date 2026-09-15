const mongoose = require('mongoose');
const { summarizeDocumentCountries } = require('../utils/documentCountrySummary');
const models = {
    institutions: require('../models/Institution'),
    documents: require('../models/Document'),
    costSheets: require('../models/CostSheet'),
    studyGuides: require('../models/StudyGuide'),
};

async function getDashboard(req, res) {
    const country = req.query.country;
    if (country !== undefined && (typeof country !== 'string' || !mongoose.isObjectIdOrHexString(country))) {
        return res.status(400).json({ error: 'Invalid country ID.' });
    }
    const days = req.query.days === undefined ? '30' : req.query.days;
    if (!['7', '30'].includes(days)) {
        return res.status(400).json({ error: 'Choose a 7 or 30 day period.' });
    }
    const filter = country ? { country } : {};
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    try {
        const results = await Promise.all(Object.entries(models).map(async ([key, Model]) => {
            if (key === 'documents') {
                const records = await Model.find(filter).select('country createdAt').populate('country', 'name code').lean();
                return [key, summarizeDocumentCountries(records, since)];
            }
            const [total, addedRecently, latest] = await Promise.all([
                Model.countDocuments(filter),
                Model.countDocuments({ ...filter, createdAt: { $gte: since } }),
                Model.find(filter).select(key === 'institutions' ? 'name country createdAt' : 'title type country createdAt').sort({ createdAt: -1, _id: -1 }).limit(5).populate('country', 'name code').lean(),
            ]);
            return [key, { total, addedRecently, latest }];
        }));
        return res.json({ days: Number(days), since, ...Object.fromEntries(results) });
    } catch {
        return res.status(500).json({ error: 'Unable to load the dashboard.' });
    }
}
module.exports = { getDashboard };
