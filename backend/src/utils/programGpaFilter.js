const Institution = require("../models/Institution");

// Proportional filtering estimate on a common four-point scale.
const numericGpa = (score, type, scale) => ({
    $let: {
        vars: {
            score: { $convert: { input: score, to: "double", onError: null, onNull: null } },
            scale: { $convert: { input: scale, to: "double", onError: null, onNull: null } },
            type: { $ifNull: [type, ""] },
        },
        in: { $cond: [
            { $and: [{ $ne: ["$$score", null] }, { $gte: ["$$score", 0] },
                { $in: ["$$type", ["GPA", "Percentage", ""]] }] },
            { $multiply: [{ $divide: ["$$score", { $cond: [
                { $eq: ["$$type", "Percentage"] }, 100,
                { $cond: [{ $gt: ["$$scale", 0] }, "$$scale", 4] },
            ] }] }, 4] },
            null,
        ] },
    },
});

module.exports = function programGpaFilter(gpa) {
    const level = { $toLower: { $ifNull: ["$level", ""] } };
    const nameMatches = regex => ({ $regexMatch: { input: { $ifNull: ["$degree_name", ""] }, regex, options: "i" } });
    return [
        { $lookup: {
            from: Institution.collection.name,
            localField: "institutionId",
            foreignField: "_id",
            as: "gpaInstitution",
        } },
        { $set: {
            gpaInstitution: { $arrayElemAt: ["$gpaInstitution", 0] },
            gpaLevel: { $switch: {
                branches: [
                    { case: { $in: [level, ["bachelor", "diploma", "foundation", "undergraduate"]] }, then: "undergraduate" },
                    { case: { $in: [level, ["master", "phd", "doctoral", "research", "postgraduate"]] }, then: "postgraduate" },
                    { case: nameMatches("bachelor|undergraduate"), then: "undergraduate" },
                    { case: nameMatches("master|phd|postgraduate|doctorate"), then: "postgraduate" },
                ],
                default: "other",
            } },
        } },
        { $set: {
            institutionGpa: { $switch: {
                branches: [
                    { case: { $eq: ["$gpaLevel", "undergraduate"] }, then: "$gpaInstitution.entryRequirements.undergraduate.gpa" },
                    { case: { $eq: ["$gpaLevel", "postgraduate"] }, then: "$gpaInstitution.entryRequirements.postgraduate.gpa" },
                ],
                default: null,
            } },
        } },
        { $set: {
            programGpa: numericGpa("$entry_requirements.academic.score", "$entry_requirements.academic.score_type", "$entry_requirements.academic.scale"),
            fallbackGpa: numericGpa("$institutionGpa.score", "$institutionGpa.type", "$institutionGpa.scale"),
        } },
        { $set: {
            requiredGpa: { $ifNull: ["$programGpa", "$fallbackGpa"] },
        } },
        { $match: { $or: [{ requiredGpa: null }, { requiredGpa: { $lte: gpa } }] } },
    ];
};
