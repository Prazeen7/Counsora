const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const mongoose = require('mongoose');
const StudyGuide = require('../src/models/StudyGuide');
const country = '507f1f77bcf86cd799439011';
const response = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
function controller(model = StudyGuide, exists = async () => true) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/studyGuideController.js'), 'utf8'), {
        module, require: name => ({ mongoose, '../models/StudyGuide': model, '../models/Country': { exists } })[name],
    });
    return module.exports;
}
test('seed topics validate and retain all nine expandable sections', async () => {
    const entries = require('../import-data/germany-study-guide.json');
    assert.equal(entries.length, 4);
    assert.equal(entries.reduce((n, entry) => n + entry.sections.length, 0), 9);
    for (const entry of entries) await new StudyGuide({ ...entry, country }).validate();
    await assert.rejects(new StudyGuide({ country, label: 'Test', title: 'Test', sections: [{ title: '', content: 'Text' }] }).validate());
});
test('listing requires an explicit valid country', async () => {
    for (const value of [undefined, 'bad', { $ne: null }]) {
        const res = response();
        await controller().listStudyGuides({ query: { country: value } }, res);
        assert.equal(res.statusCode, 400);
    }
});
test('listing filters by country and returns ordered topics', async () => {
    const res = response();
    const model = { find(query) {
        assert.equal(query.country, country);
        assert.equal(Object.keys(query).length, 1);
        return { populate() { return this; }, sort(order) { assert.equal(order.order, 1); return this; }, async lean() { return [{ label: 'First' }]; } };
    } };
    await controller(model).listStudyGuides({ query: { country } }, res);
    assert.equal(res.body.guides[0].label, 'First');
});
test('create rejects unknown fields, malformed sections, invalid order and empty content', async () => {
    const base = { country, title: 'Test', label: 'Test', introduction: 'Content' };
    for (const changes of [{ admin: true }, { country: 'bad' }, { order: -1 }, { order: 1.5 }, { order: '2' }, { sections: [{}] }, { sections: [{ title: 'x', content: 'y', html: 'z' }] }, { introduction: '', sections: [] }]) {
        const res = response();
        await controller().saveStudyGuide({ params: {}, body: { ...base, ...changes } }, res);
        assert.equal(res.statusCode, 400, JSON.stringify(changes));
    }
});
test('create refuses nonexistent country references', async () => {
    const res = response();
    await controller(StudyGuide, async () => false).saveStudyGuide({ params: {}, body: { country, label: 'Test', title: 'Test', introduction: 'Text' } }, res);
    assert.equal(res.statusCode, 400);
});
test('update saves edited sections and populates country', async () => {
    const record = { country, introduction: 'Old', sections: [], async save() { this.saved = true; }, async populate(field) { assert.equal(field, 'country'); } };
    const res = response();
    await controller({ findById: async () => record }).saveStudyGuide({ params: { id: country }, body: { introduction: 'Updated', sections: [{ title: 'Next', content: '- A\n- B' }], order: 2 } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(record.saved, true);
    assert.equal(record.sections[0].title, 'Next');
    assert.equal(record.introduction, 'Updated');
});
test('missing records return 404 and duplicate labels return 409', async () => {
    const res = response();
    await controller({ findById: async () => null }).saveStudyGuide({ params: { id: country }, body: {} }, res);
    assert.equal(res.statusCode, 404);
    const record = { country, introduction: 'Text', sections: [], async save() { throw { code: 11000 }; } };
    const duplicate = response();
    await controller({ findById: async () => record }).saveStudyGuide({ params: { id: country }, body: {} }, duplicate);
    assert.equal(duplicate.statusCode, 409);
});
test('delete validates ID and reports missing records', async () => {
    const api = controller({ findByIdAndDelete: async () => null });
    for (const [id, status] of [['bad', 400], [country, 404]]) {
        const res = response();
        await api.deleteStudyGuide({ params: { id } }, res);
        assert.equal(res.statusCode, status);
    }
});
test('all writes are protected by admin middleware and reads require authentication', () => {
    const router = require('../src/routes/studyGuideRoutes');
    const { authMiddleware } = require('../src/middleware/authMiddleWare');
    const { adminMiddleware } = require('../src/middleware/adminMiddleware');
    assert.equal(router.stack[0].handle, authMiddleware);
    for (const layer of router.stack.filter(layer => layer.route && !layer.route.methods.get)) assert.equal(layer.route.stack[0].handle, adminMiddleware);
    const res = response();
    adminMiddleware({ user: { role: 'counselor' } }, res, () => assert.fail('Counselor cannot write'));
    assert.equal(res.statusCode, 403);
});
