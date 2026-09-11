const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { readCompletedCrawl } = require('./src/utils/savedCrawl');
const { normalizeProgramsArray } = require('./src/utils/normalizeProgramData');

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'saved-crawl-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const institutionDir = path.join(root, 'output', 'New Zealand', 'ais');
    const programDir = path.join(institutionDir, 'programs', 'tourism');
    fs.mkdirSync(programDir, { recursive: true });
    fs.writeFileSync(path.join(institutionDir, 'metadata.json'), JSON.stringify({ url: 'https://www.ais.ac.nz/' }));
    fs.writeFileSync(path.join(programDir, 'structured-data.json'), JSON.stringify({ degree_name: 'Bachelor of Tourism', url: 'https://www.ais.ac.nz/tourism' }));
    return root;
}

function controller(root, crawlStatus, crawlerCalls = [], crawlerData = null, existingPrograms = []) {
    const institution = { website: 'https://www.ais.ac.nz/', crawlStatus, save: async () => {} };
    const module = { exports: {} };
    const dependencies = {
        fs, path,
        '../models/Institution': { findById: () => Object.assign(Promise.resolve(institution), {
            populate: async () => ({ ...institution, country: { name: 'New Zealand' } }),
        }) },
        axios: { post: (url, body) => {
            crawlerCalls.push({ url, body });
            if (crawlerData) return Promise.resolve({ status: 200, data: crawlerData });
            return new Promise(() => {});
        } },
        '../models/Program': {
            countDocuments: () => { throw new Error('Must not read database program counts'); },
            find: () => ({ select: () => ({ lean: async () => existingPrograms }) }),
        },
        mongoose: { Types: { ObjectId: { isValid: () => true } } },
        '../utils/savedCrawl': { readCompletedCrawl },
        '../utils/normalizeProgramData': { normalizeProgramsArray },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'src/controllers/institutionController.js'), 'utf8'), {
        module,
        require: (name) => dependencies[name] || {},
        __dirname: path.join(root, 'backend/src/controllers'),
        process: { env: { CRAWL_OUTPUT_DIR: path.join(root, 'output') } },
        console: { log() {}, error() {} },
    });
    return module.exports;
}

function response() {
    return { status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
}

test('reads individual local results without a final checkpoint or aggregate file', (t) => {
    const root = fixture(t);
    const output = path.join(root, 'output');
    assert.equal(readCompletedCrawl(output, 'https://ais.ac.nz'), null);
    assert.equal(readCompletedCrawl(output, 'https://ais.ac.nz', { includePartial: true }).length, 1);
    assert.equal(readCompletedCrawl(output, 'https://other.ac.nz', { includePartial: true }), null);
});

for (const state of ['in_progress', 'completed']) {
    test(`import uses local results despite ${state} database status`, async (t) => {
        const root = fixture(t);
        const res = response();
        await controller(root, state).crawlAndAddPrograms({ params: { institutionId: 'ais' }, body: { websiteUrl: 'https://www.ais.ac.nz/', availableOnly: true } }, res);
        assert.equal(res.code, 200);
        assert.equal(res.data.crawlStatus, 'pending_review');
        assert.equal(res.data.programCount, 1);
    });
}

test('status recovers local results and makes them available for review without database counts', async (t) => {
    const root = fixture(t);
    const api = controller(root, 'in_progress');
    const req = { params: { institutionId: 'ais' }, query: { availableOnly: 'true' } };
    const status = response();
    await api.getCrawlStatus(req, status);
    assert.equal(status.code, 200);
    assert.equal(status.data.status, 'pending_review');
    assert.equal(status.data.programCount, 1);
    const review = response();
    await api.getPendingPrograms(req, review);
    assert.equal(review.code, 200);
    assert.equal(review.data.programs[0].degree_name, 'Bachelor of Tourism');
});

test('Add Institution resumes missing extraction instead of importing partial results', async (t) => {
    const root = fixture(t);
    const calls = [];
    const api = controller(root, 'in_progress', calls);
    const res = response();
    await api.crawlAndAddPrograms({ params: { institutionId: 'ais' }, body: { websiteUrl: 'https://www.ais.ac.nz/' } }, res);
    assert.equal(res.code, 202);
    await new Promise(setImmediate);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.checkStructuredData, true);
    const status = response();
    await api.getCrawlStatus({ params: { institutionId: 'ais' } }, status);
    assert.equal(status.data.status, 'in_progress');
    assert.equal(status.data.programCount, 0);
    assert.equal(fs.existsSync(path.join(root, 'backend/temp-crawls/ais.json')), false);
});

test('available-only import does not start a crawl when no local files exist', async (t) => {
    const root = fixture(t);
    const calls = [];
    const res = response();
    await controller(root, 'pending', calls).crawlAndAddPrograms({
        params: { institutionId: 'ais' },
        body: { websiteUrl: 'https://other.ac.nz/', availableOnly: true },
    }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.programCount, 0);
    assert.equal(res.data.shouldCrawl, false);
    assert.equal(calls.length, 0);
});

test('Add Institution rejects partial crawler results instead of opening review', async (t) => {
    const root = fixture(t);
    const api = controller(root, 'pending', [], {
        success: true,
        steps: [{ step: 5, status: 'incomplete' }],
        data: [{ degree_name: 'Only finished program' }],
    });
    const req = { params: { institutionId: 'ais' }, body: { websiteUrl: 'https://www.ais.ac.nz/' } };
    const res = response();
    await api.crawlAndAddPrograms(req, res);
    await new Promise(setImmediate);
    const status = response();
    await api.getCrawlStatus(req, status);
    assert.equal(status.data.status, 'failed');
    assert.equal(fs.existsSync(path.join(root, 'backend/temp-crawls/ais.json')), false);
});

test('Programs tab import runs extraction before reviewing only programs missing from the database', async (t) => {
    const root = fixture(t);
    const calls = [];
    const api = controller(root, 'pending_review', calls, {
        success: true,
        complete: true,
        data: [
            { degree_name: 'Bachelor of Tourism', url: 'https://www.ais.ac.nz/tourism' },
            { degree_name: 'Newly extracted program', url: 'https://www.ais.ac.nz/new-program' },
        ],
    }, [{ degree_name: 'Bachelor of Tourism' }]);
    const req = {
        params: { institutionId: 'ais' },
        body: { websiteUrl: 'https://www.ais.ac.nz/', importMissingOnly: true, availableOnly: false },
    };
    const res = response();
    await api.crawlAndAddPrograms(req, res);
    assert.equal(res.code, 202);
    await new Promise(setImmediate);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.checkStructuredData, true);
    const review = response();
    await api.getPendingPrograms(req, review);
    assert.equal(review.code, 200);
    assert.equal(review.data.programs.length, 1);
    assert.equal(review.data.programs[0].degree_name, 'Newly extracted program');
});
