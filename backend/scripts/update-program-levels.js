const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const { classifyProgramLevel } = require("../src/utils/programLevel");

// Run from backend; defaults to a preview. Pass --apply to save the changes.
async function main() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    try {
        const collection = mongoose.connection.collection("programs");
        const rows = await collection.find({ $or: [
            { degree_name: /\b(?:post[ -]?graduate|graduate|pg)\s+diploma\b|\bpgdip/i },
            { degree_name: /\bcertificate\b|\bpgcert/i },
            { level: /diploma|certificate/i },
        ] }).project({ degree_name: 1, level: 1 }).toArray();
        const changes = rows.map(row => {
            const level = classifyProgramLevel(row.degree_name, row.level);
            return { ...row, nextLevel: level };
        }).filter(row => row.level !== row.nextLevel);
        const counts = changes.reduce((result, row) => {
            result[row.nextLevel] = (result[row.nextLevel] || 0) + 1;
            return result;
        }, {});
        console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "preview", counts }));
        if (process.argv.includes("--apply") && changes.length) {
            const directory = path.join(__dirname, "../import-output");
            fs.mkdirSync(directory, { recursive: true });
            const backup = path.join(directory, `program-levels-backup-${Date.now()}.json`);
            fs.writeFileSync(backup, JSON.stringify(changes, null, 2));
            const result = await collection.bulkWrite(changes.map(row => ({ updateOne: {
                filter: { _id: row._id, level: row.level ?? null },
                update: { $set: { level: row.nextLevel } },
            } })));
            console.log(JSON.stringify({ modified: result.modifiedCount, backup }));
        }
        const updated = await collection.find({ _id: { $in: rows.map(row => row._id) } }).project({ degree_name: 1, level: 1 }).toArray();
        const remaining = updated.filter(row => classifyProgramLevel(row.degree_name, row.level) !== row.level).length;
        console.log(JSON.stringify({ remaining }));
    } finally {
        await mongoose.disconnect();
    }
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; });
