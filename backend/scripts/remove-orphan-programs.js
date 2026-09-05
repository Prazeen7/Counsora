const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");

require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

// Treat legacy string references like ObjectIds so valid programs are preserved.
const orphanPipeline = [
    { $lookup: {
        from: "institutions",
        let: { reference: { $convert: { input: "$institutionId", to: "string", onError: null, onNull: null } } },
        pipeline: [
            { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$reference"] } } },
            { $project: { _id: 1 } },
        ],
        as: "__institutionMatch",
    } },
    { $match: { "__institutionMatch.0": { $exists: false } } },
    { $unset: "__institutionMatch" },
];

async function main() {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== "--apply")) throw new Error("Usage: node scripts/remove-orphan-programs.js [--apply]");
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required in backend/.env");
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, autoIndex: false });
    const db = mongoose.connection.db;
    const programs = db.collection("programs");
    const institutions = await db.collection("institutions").countDocuments();
    const total = await programs.countDocuments();
    const orphans = await programs.aggregate(orphanPipeline).toArray();
    console.log(JSON.stringify({ database: db.databaseName, institutions, programs: total, orphanPrograms: orphans.length }, null, 2));
    if (!args.includes("--apply") || !orphans.length) return;
    if (!institutions) throw new Error("Refusing cleanup because the institutions collection is empty; check the database configuration.");

    const backupDirectory = path.join(__dirname, "../import-output");
    fs.mkdirSync(backupDirectory, { recursive: true });
    const backup = path.join(backupDirectory, `orphan-programs-${Date.now()}.ejson`);
    fs.writeFileSync(backup, EJSON.stringify(orphans, { relaxed: false }), { flag: "wx" });
    console.log(`Backup: ${backup}`);

    let deleted = 0;
    for (let offset = 0; offset < orphans.length; offset += 500) {
        const batch = orphans.slice(offset, offset + 500);
        // Recheck references immediately before deletion, and skip changed documents.
        const current = await programs.aggregate([
            { $match: { _id: { $in: batch.map(doc => doc._id) } } },
            ...orphanPipeline,
        ]).toArray();
        const originals = new Map(batch.map(doc => [String(doc._id), EJSON.stringify(doc)]));
        const unchanged = current.filter(doc => originals.get(String(doc._id)) === EJSON.stringify(doc));
        if (!unchanged.length) continue;
        const result = await programs.bulkWrite(unchanged.map(doc => ({ deleteOne: { filter: doc } })));
        deleted += result.deletedCount;
    }
    const remaining = await programs.aggregate([...orphanPipeline, { $count: "count" }]).toArray();
    console.log(JSON.stringify({ deleted, remainingOrphans: remaining[0]?.count || 0 }, null, 2));
}

main().catch(error => {
    console.error(`Cleanup failed (${error.name}). ${error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, "[redacted URI]")}`);
    process.exitCode = 1;
}).finally(() => mongoose.disconnect());
