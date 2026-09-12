const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const Document = require("./src/models/Document");
const Country = require("./src/models/Country");
const User = require("./src/models/User");
const controller = require("./src/controllers/documentController");
const upload = require("./src/middleware/documentUpload");

const country = "507f1f77bcf86cd799439011";
const id = "507f1f77bcf86cd799439012";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, set(headers) { this.headers = headers; return this; }, send(body) { this.body = body; return this; } });

test("documents require country, type and title, and do not serialize preview bytes", () => {
    const empty = new Document().validateSync();
    for (const field of ["country", "type", "title"]) assert.ok(empty.errors[field]);
    for (const type of ["required_documents", "process_flow"]) {
        const record = new Document({ country, type, title: "Passport", previewData: Buffer.from("private") });
        assert.equal(record.validateSync(), undefined);
        assert.equal(record.toJSON().previewData, undefined);
    }
    assert.ok(new Document({ country, type: "unknown", title: "Example" }).validateSync().errors.type);
    assert.ok(new Document({ country, type: "process_flow", title: "Example", order: 1.5 }).validateSync().errors.order);
});

test("create associates an existing country and saves image metadata without returning bytes", async (t) => {
    t.mock.method(Country, "exists", async (query) => { assert.equal(String(query._id), country); return { _id: country }; });
    t.mock.method(Document.prototype, "save", async function () { await this.validate(); return this; });
    t.mock.method(Document.prototype, "populate", async function () { return this; });
    const res = response();
    await controller.saveDocument({ params: {}, body: { country, type: "required_documents", title: "Passport", section: " Personal Documents ", source: "Applicant", details: "Copy", timeline: "discard" },
        file: { originalname: "sample.png", mimetype: "image/png", size: 8, buffer: Buffer.alloc(8) } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.timeline, "");
    assert.equal(res.body.section, "Personal Documents");
    assert.equal(res.body.preview.name, "sample.png");
    assert.equal(res.body.toJSON().previewData, undefined);
});

test("editing preserves an attachment unless removed, and switching type clears the old field", async (t) => {
    const record = new Document({ country, type: "required_documents", title: "Passport", source: "Applicant", preview: { name: "a.pdf", mimeType: "application/pdf", size: 5 }, previewData: Buffer.from("%PDF-") });
    t.mock.method(Document, "findById", async () => record);
    t.mock.method(Country, "exists", async () => ({ _id: country }));
    t.mock.method(record, "save", async () => record);
    t.mock.method(record, "populate", async () => record);
    const res = response();
    await controller.saveDocument({ params: { id }, body: { type: "process_flow", title: "Apply", timeline: "2 weeks", order: "2" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(record.source, "");
    assert.equal(record.timeline, "2 weeks");
    assert.equal(record.preview.name, "a.pdf");
    await controller.saveDocument({ params: { id }, body: { removePreview: "true" } }, response());
    assert.equal(record.preview, null);
    assert.equal(record.previewData, undefined);
});

test("invalid identifiers, missing countries and invalid types are rejected", async (t) => {
    t.mock.method(Country, "exists", async () => null);
    for (const body of [{ country, type: "required_documents", title: "Passport" }, { country, type: "bad", title: "Passport" }]) {
        const res = response();
        await controller.saveDocument({ params: {}, body }, res);
        assert.equal(res.statusCode, 400);
    }
    for (const query of [{ country: "bad" }, { type: "bad" }]) {
        const res = response();
        await controller.listDocuments({ query }, res);
        assert.equal(res.statusCode, 400);
    }
});

test("country and type filters are combined, with ordered process results", async (t) => {
    const records = [{ title: "Apply" }, { title: "Attend appointment" }];
    t.mock.method(Document, "find", (query) => {
        assert.deepEqual(query, { country, type: "process_flow" });
        return { populate() { return this; }, sort(order) { assert.deepEqual(order, { order: 1, createdAt: 1, _id: 1 }); return this; }, lean: async () => records };
    });
    const res = response();
    await controller.listDocuments({ query: { country, type: "process_flow" } }, res);
    assert.deepEqual(res.body.documents, records);
});

test("preview returns bytes with the correct media type, or 404 when absent", async (t) => {
    let record = { preview: { name: "sample.pdf", mimeType: "application/pdf" }, previewData: Buffer.from("%PDF-1.7") };
    t.mock.method(Document, "findById", () => ({ select: async () => record }));
    const res = response();
    await controller.previewDocument({ params: { id } }, res);
    assert.equal(res.headers["Content-Type"], "application/pdf");
    assert.equal(res.headers["Cache-Control"], "private, no-store");
    assert.equal(res.body.toString(), "%PDF-1.7");
    record = null;
    const missing = response();
    await controller.previewDocument({ params: { id } }, missing);
    assert.equal(missing.statusCode, 404);
});

async function serve(t, app) {
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    return `http://127.0.0.1:${server.address().port}`;
}

test("multipart uploads accept all four extensions and reject spoofed and oversized files", async (t) => {
    const app = express();
    app.post("/", upload, (req, res) => res.json({ mimeType: req.file.mimetype }));
    const url = await serve(t, app);
    const cases = [
        ["sample.jpg", "image/jpeg", Buffer.from([255, 216, 255]), 200],
        ["sample.jpeg", "image/jpeg", Buffer.from([255, 216, 255]), 200],
        ["sample.png", "image/png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 200],
        ["sample.pdf", "application/pdf", Buffer.from("%PDF-1.7"), 200],
        ["fake.pdf", "application/pdf", Buffer.from("<html>bad</html>"), 400],
        ["bad.svg", "image/svg+xml", Buffer.from("<svg/>"), 400],
        ["large.pdf", "application/pdf", Buffer.alloc(5 * 1024 * 1024 + 1), 400],
    ];
    for (const [name, type, data, status] of cases) {
        const body = new FormData();
        body.append("preview", new Blob([data], { type }), name);
        const res = await fetch(url, { method: "POST", body });
        assert.equal(res.status, status, name);
        await res.json();
    }
});

test("document routes require login and reject counselor mutations", async (t) => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "documents-test-only";
    t.after(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });
    t.mock.method(User, "findById", async () => ({ role: "counselor", sessionToken: "session", isVerified: true, isApproved: true }));
    const app = express();
    app.use("/documents", require("./src/routes/documentRoutes"));
    const url = await serve(t, app);
    const noAuth = await fetch(`${url}/documents`);
    assert.equal(noAuth.status, 401);
    await noAuth.json();
    const token = jwt.sign({ id, sessionToken: "session" }, process.env.JWT_SECRET);
    for (const method of ["POST", "PUT", "DELETE"]) {
        const res = await fetch(`${url}/documents${method === "POST" ? "" : `/${id}`}`, { method, headers: { Authorization: `Bearer ${token}` } });
        assert.equal(res.status, 403);
        await res.json();
    }
});
