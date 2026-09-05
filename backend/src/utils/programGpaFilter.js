const Institution = require("../models/Institution");

// The counselor GPA input uses a four-point scale. Percentages are not GPA scores.
const numericGpa = (score, type) => ({
    $cond: [
        { $in: [{ $ifNull: [type, ""] }, ["GPA", ""]] },
        { $convert: { input: score, to: "double", onError: null, onNull: null } },
        null,
    ],
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
            programGpa: numericGpa("$entry_requirements.academic.score", "$entry_requirements.academic.score_type"),
            fallbackGpa: numericGpa("$institutionGpa.score", "$institutionGpa.type"),
        } },
        { $set: {
            requiredGpa: { $cond: [
                { $ne: ["$programGpa", null] },
                { $cond: [
                    { $gt: ["$entry_requirements.academic.scale", 0] },
                    { $multiply: [{ $divide: ["$programGpa", "$entry_requirements.academic.scale"] }, 4] },
                    "$programGpa",
                ] },
                "$fallbackGpa",
            ] },
        } },
        { $match: { $or: [{ requiredGpa: null }, { requiredGpa: { $lte: gpa } }] } },
    ];
};
