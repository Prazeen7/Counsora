const mongoose = require("mongoose");
const Document = require("../models/Document");
const Country = require("../models/Country");

const types = ["required_documents", "process_flow"];
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const respondError = (res, error) => res.status(error.status || (error.name === "ValidationError" ? 400 : 500))
    .json({ error: error.status || error.name === "ValidationError" ? error.message : "Unable to complete the document request." });

async function listDocuments(req, res) {
    try {
        const query = {};
        if (req.query.country) {
            if (!mongoose.isObjectIdOrHexString(req.query.country)) throw fail("Invalid country ID.");
            query.country = req.query.country;
        }
        if (req.query.type) {
            if (!types.includes(req.query.type)) throw fail("Choose Required Documents or Stage / Process Flow.");
            query.type = req.query.type;
        }
        const documents = await Document.find(query).populate("country", "name code")
            .sort({ order: 1, createdAt: 1, _id: 1 }).lean();
        res.json({ documents });
    } catch (error) { respondError(res, error); }
}

async function saveDocument(req, res) {
    try {
        const updating = Boolean(req.params.id);
        if (updating && !mongoose.isObjectIdOrHexString(req.params.id)) throw fail("Invalid document ID.");
        const record = updating ? await Document.findById(req.params.id) : new Document();
        if (!record) throw fail("Document not found.", 404);
        const body = req.body || {};
        const allowed = ["country", "type", "title", "section", "source", "timeline", "details", "order", "removePreview", "removePreviewIndexes"];
        if (Object.keys(body).some((field) => !allowed.includes(field))) throw fail("Unsupported document field.");
        for (const field of ["country", "type", "title", "section", "source", "timeline", "details"]) {
            if (body[field] !== undefined) {
                if (typeof body[field] !== "string") throw fail(`${field} must be text.`);
                record[field] = body[field].trim();
            }
        }
        if (!types.includes(record.type)) throw fail("Choose Required Documents or Stage / Process Flow.");
        if (!record.title?.trim()) throw fail(record.type === "process_flow" ? "Stage is required." : "Document name is required.");
        if (!record.country || !mongoose.isObjectIdOrHexString(record.country)) throw fail("Choose a valid country.");
        if (!(await Country.exists({ _id: record.country }))) throw fail("Country not found.");
        if (body.order !== undefined) {
            if (!/^[0-9]+$/.test(String(body.order)) || !Number.isSafeInteger(Number(body.order))) throw fail("Display order must be a non-negative whole number.");
            record.order = Number(body.order);
        }
        if (body.removePreview !== undefined && ![true, false, "true", "false"].includes(body.removePreview)) throw fail("Invalid removePreview value.");
        if (record.type === "required_documents") record.timeline = "";
        else record.source = "";
        if (body.removePreview === true || body.removePreview === "true") {
            record.preview = [];
            record.previewData = undefined;
        }
        if (body.removePreviewIndexes !== undefined && !req.files?.length) {
            let indexes;
            try { indexes = typeof body.removePreviewIndexes === "string" ? JSON.parse(body.removePreviewIndexes) : body.removePreviewIndexes; } catch { throw fail("Invalid preview removal list."); }
            if (!Array.isArray(indexes) || indexes.some((index) => !Number.isInteger(Number(index)) || Number(index) < 0)) throw fail("Invalid preview removal list.");
            const remove = new Set(indexes.map(Number));
            const previews = Array.isArray(record.preview) ? record.preview : (record.preview ? [record.preview] : []);
            const buffers = Array.isArray(record.previewData) ? record.previewData : (record.previewData ? [record.previewData] : []);
            record.preview = previews.filter((_preview, index) => !remove.has(index));
            record.previewData = buffers.filter((_buffer, index) => !remove.has(index));
        }
        if (req.files?.length) {
            record.preview = req.files.map((file) => ({ name: file.originalname, mimeType: file.mimetype, size: file.size }));
            record.previewData = req.files.map((file) => file.buffer);
        }
        await record.save();
        await record.populate("country", "name code");
        res.status(updating ? 200 : 201).json(record);
    } catch (error) { respondError(res, error); }
}

async function previewDocument(req, res) {
    try {
        if (!mongoose.isObjectIdOrHexString(req.params.id)) throw fail("Invalid document ID.");
        const record = await Document.findById(req.params.id).select("preview +previewData");
        const previews = Array.isArray(record?.preview) ? record.preview : (record?.preview ? [record.preview] : []);
        const index = Math.max(0, Math.min(Number(req.query.index) || 0, previews.length - 1));
        const previewBuffers = Array.isArray(record?.previewData) ? record.previewData : (record?.previewData ? [record.previewData] : []);
        if (!record || !previews.length || !previewBuffers[index]) throw fail("Preview not found.", 404);
        const preview = previews[index];
        res.set({
            "Content-Type": preview.mimeType,
            "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(preview.name)}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        }).send(previewBuffers[index]);
    } catch (error) { respondError(res, error); }
}

async function deleteDocument(req, res) {
    try {
        if (!mongoose.isObjectIdOrHexString(req.params.id)) throw fail("Invalid document ID.");
        if (!(await Document.findByIdAndDelete(req.params.id))) throw fail("Document not found.", 404);
        res.json({ message: "Document deleted." });
    } catch (error) { respondError(res, error); }
}

module.exports = { listDocuments, saveDocument, previewDocument, deleteDocument };
