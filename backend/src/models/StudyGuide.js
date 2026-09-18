const mongoose = require('mongoose');
const { isSourceUrl } = require('../utils/studyGuideSources');

const sourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 300 },
    url: { type: String, required: true, trim: true, maxlength: 2048, validate: isSourceUrl },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true, trim: true, maxlength: 20000 },
}, { _id: false });

const studyGuideSchema = new mongoose.Schema({
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    category: { type: String, trim: true, default: '', maxlength: 100 },
    introduction: { type: String, trim: true, default: '', maxlength: 20000 },
    sections: { type: [sectionSchema], default: [], validate: value => value.length <= 50 },
    sources: { type: [sourceSchema], default: [], validate: value => value.length <= 20 },
    order: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
}, { timestamps: true });
studyGuideSchema.index({ country: 1, label: 1 }, { unique: true });
studyGuideSchema.index({ country: 1, order: 1 });
module.exports = mongoose.model('StudyGuide', studyGuideSchema);
