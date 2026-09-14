const mongoose = require('mongoose');
const StudyGuide = require('../models/StudyGuide');
const Country = require('../models/Country');

async function saveOrderedStudyGuide(record) {
    await record.validate();
    await mongoose.connection.transaction(async session => {
        // Serialize ordering changes within this country, including inserts into
        // currently empty positions. Concurrent transactions retry on conflicts.
        const country = await Country.updateOne({ _id: record.country }, { $inc: { __v: 1 } }, { session });
        if (!country.matchedCount) throw Object.assign(new Error('Country not found.'), { status: 400 });
        const others = { country: record.country, _id: { $ne: record._id } };
        const collision = await StudyGuide.exists({ ...others, order: record.order }).session(session);
        if (collision) {
            const overflow = await StudyGuide.exists({ ...others, order: { $gte: Number.MAX_SAFE_INTEGER } }).session(session);
            if (overflow) throw Object.assign(new Error('Display order is too large to shift. Reduce the highest display order first.'), { status: 400 });
            await StudyGuide.updateMany({ ...others, order: { $gte: record.order } }, { $inc: { order: 1 } }, { session });
        }
        // A failed save (including a duplicate label) rolls back all shifts.
        await record.save({ session });
    });
}

async function deleteOrderedStudyGuide(id) {
    await mongoose.connection.transaction(async session => {
        const record = await StudyGuide.findById(id).session(session);
        if (!record) throw Object.assign(new Error('Study guide not found.'), { status: 404 });
        // Use the same country lock as saves so inserts and deletes cannot race.
        const country = await Country.updateOne({ _id: record.country }, { $inc: { __v: 1 } }, { session });
        if (!country.matchedCount) throw Object.assign(new Error('Country not found.'), { status: 400 });
        await StudyGuide.deleteOne({ _id: record._id }, { session });
        await StudyGuide.updateMany(
            { country: record.country, order: { $gt: record.order } },
            { $inc: { order: -1 } },
            { session }
        );
    });
}

module.exports = { saveOrderedStudyGuide, deleteOrderedStudyGuide };
