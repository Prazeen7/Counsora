const components = ["overall", "minimum_band", "minimum", "listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"];
const number = input => ({ $convert: { input, to: "double", onError: null, onNull: null } });
const hasScores = path => ({ $or: components.map(key => ({ $ne: [{ $ifNull: [`${path}.${key}`, ""] }, ""] })) });
const nonemptyTests = input => ({ $filter: { input: { $ifNull: [input, []] }, as: "exam", cond: hasScores("$$exam") } });
const normalizedFields = { $map: {
    input: { $reduce: {
        input: { $cond: [{ $isArray: "$field" }, "$field", [{ $ifNull: ["$field", ""] }]] }, initialValue: [],
        in: { $concatArrays: ["$$value", { $split: [{ $replaceAll: { input: { $replaceAll: {
            input: "$$this", find: ";", replacement: "|",
        } }, find: "\n", replacement: "|" } }, "|"] }] },
    } }, as: "name", in: { $let: { vars: { name: { $trim: { input: "$$name" } } }, in: { $cond: [
        { $eq: [{ $toLower: "$$name" }, "creative, performing and visual arts"] },
        "Creative Media, Communication and Arts", "$$name",
    ] } } },
} };

// Resolve the same program > field > institution precedence used by the cards.
// Keep filtering before pagination so counts and page sizes stay accurate.
module.exports = function resolvedEnglishFilter(test, supplied) {
    const lang = "$entry_requirements.language_requirements";
    const specificTests = [
        ...["ielts", "toefl", "pte", "duolingo"].map(name => ({ testType: name, scores: { $ifNull: [`${lang}.english.${name}`, {}] } })),
        ...["testdaf", "dsh"].map(name => ({ testType: name, scores: { $ifNull: [`${lang}.german.${name}`, {}] } })),
        ...[["cambridge", "english"], ["cefr", "english"], ["cefr", "german"]].map(([name, language]) => ({ testType: name, scores: { overall: `${lang}.${language}.${name}` } })),
    ];
    const knownSelectedTest = { $and: [
        { $eq: [{ $toLower: { $ifNull: ["$$exam.testType", ""] } }, test] },
        { $or: components.map(key => ({ $gte: [number(`$$exam.${key}`), 0] })) },
    ] };
    const accepts = tests => ({ $or: [
        // No recorded scores for this test means unknown, which stays in results.
        { $not: [{ $anyElementTrue: [{ $map: { input: tests, as: "exam", in: knownSelectedTest } }] }] },
        { $anyElementTrue: [{ $map: { input: tests, as: "exam", in: {
        $and: [
            { $eq: [{ $toLower: { $ifNull: ["$$exam.testType", ""] } }, test] },
            { $or: components.map(key => ({ $gte: [number(`$$exam.${key}`), 0] })) },
            ...Object.entries(supplied).map(([field, score]) => ({ $and: [
                { $lte: [number(`$$exam.${field}`), score] },
                ...(field === "overall" ? [] : [{ $lte: [number({ $ifNull: ["$$exam.minimum_band", "$$exam.minimum"] }), score] }]),
            ] })),
        ],
    } } }] },
    ] });
    const levelMatches = regex => ({ $regexMatch: { input: { $ifNull: ["$level", ""] }, regex, options: "i" } });
    return { $expr: { $let: {
        vars: {
            institution: { $arrayElemAt: ["$programInstitution", 0] },
            levelKey: { $switch: { branches: [
                { case: levelMatches("master|postgraduate|phd|doctoral|doctorate|research"), then: "postgraduate" },
                { case: levelMatches("diploma"), then: "diploma" },
                { case: levelMatches("foundation|associate|bachelor|undergraduate"), then: "undergraduate" },
            ], default: "unknown" } },
            specific: { $map: { input: { $filter: { input: specificTests, as: "item", cond: hasScores("$$item.scores") } }, as: "item",
                in: { $mergeObjects: ["$$item.scores", { testType: "$$item.testType" }] } } },
        },
        in: { $let: {
            vars: {
                general: { $switch: { branches: ["diploma", "undergraduate", "postgraduate"].map(level => ({
                    case: { $eq: ["$$levelKey", level] }, then: nonemptyTests(`$$institution.entryRequirements.${level}.languageRequirement`),
                })), default: [] } },
                matching: { $filter: { input: { $ifNull: ["$$institution.entryRequirements.fields", []] }, as: "group", cond: { $and: [
                    { $eq: ["$$group.level", "$$levelKey"] },
                    { $in: ["$$group.field", normalizedFields] },
                ] } } },
            },
            in: { $cond: [
                { $gt: [{ $size: "$$specific" }, 0] }, accepts("$$specific"),
                { $cond: [
                    { $gt: [{ $size: "$$matching" }, 0] },
                    { $allElementsTrue: [{ $map: { input: "$$matching", as: "group", in: { $let: {
                        vars: { tests: nonemptyTests("$$group.requirements.languageRequirement") },
                        in: accepts({ $cond: [{ $gt: [{ $size: "$$tests" }, 0] }, "$$tests", "$$general"] }),
                    } } } }] },
                    accepts("$$general"),
                ] },
            ] },
        } },
    } } };
};
