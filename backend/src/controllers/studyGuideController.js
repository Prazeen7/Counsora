const mongoose = require('mongoose');
const StudyGuide = require('../models/StudyGuide');
const Country = require('../models/Country');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const respondError = (res, error) => {
    if (error.code === 11000) return res.status(409).json({ error: 'A topic with this navigation label already exists for this country.' });
    const status = error.status || (['ValidationError', 'CastError'].includes(error.name) ? 400 : 500);
    return res.status(status).json({ error: status < 500 ? error.message : 'Unable to complete the study guide request.' });
};

async function listStudyGuides(req, res) {
    try {
        if (!mongoose.isObjectIdOrHexString(req.query.country)) throw fail('Choose a valid country.');
        const guides = await StudyGuide.find({ country: req.query.country }).populate('country', 'name code').sort({ order: 1, createdAt: 1, _id: 1 }).lean();
        res.json({ guides });
    } catch (error) { respondError(res, error); }
}

async function saveStudyGuide(req, res) {
    try {
        const updating = Boolean(req.params.id);
        if (updating && !mongoose.isObjectIdOrHexString(req.params.id)) throw fail('Invalid study guide ID.');
        const body = req.body || {};
        const textFields = ['country', 'label', 'title', 'description', 'category', 'introduction'];
        if (Object.keys(body).some(key => ![...textFields, 'sections', 'order'].includes(key))) throw fail('Unsupported study guide field.');
        const record = updating ? await StudyGuide.findById(req.params.id) : new StudyGuide();
        if (!record) throw fail('Study guide not found.', 404);
        for (const field of textFields) {
            if (body[field] !== undefined) {
                if (typeof body[field] !== 'string') throw fail(`${field} must be text.`);
                if (field === 'country' && !mongoose.isObjectIdOrHexString(body[field])) throw fail('Choose a valid country.');
                record[field] = body[field].trim();
            }
        }
        if (!record.country || !(await Country.exists({ _id: record.country }))) throw fail('Country not found.');
        if (body.order !== undefined) {
            if (!Number.isSafeInteger(body.order) || body.order < 0) throw fail('Display order must be a non-negative whole number.');
            record.order = body.order;
        }
        if (body.sections !== undefined) {
            if (!Array.isArray(body.sections) || body.sections.length > 50 || body.sections.some(section =>
                !section || typeof section !== 'object' || Array.isArray(section) ||
                Object.keys(section).some(key => !['title', 'content'].includes(key)) ||
                typeof section.title !== 'string' || typeof section.content !== 'string')) throw fail('Provide up to 50 sections with a title and content.');
            record.sections = body.sections;
        }
        if (!record.introduction?.trim() && !record.sections.length) throw fail('Add an introduction or at least one section.');
        await record.save();
        await record.populate('country', 'name code');
        res.status(updating ? 200 : 201).json(record);
    } catch (error) { respondError(res, error); }
}

async function deleteStudyGuide(req, res) {
    try {
        if (!mongoose.isObjectIdOrHexString(req.params.id)) throw fail('Invalid study guide ID.');
        if (!(await StudyGuide.findByIdAndDelete(req.params.id))) throw fail('Study guide not found.', 404);
        res.json({ message: 'Study guide topic deleted.' });
    } catch (error) { respondError(res, error); }
}
module.exports = { listStudyGuides, saveStudyGuide, deleteStudyGuide };
