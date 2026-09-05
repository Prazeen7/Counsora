const scoreFields = {
    testScore: "overall",
    listeningScore: "listening",
    readingScore: "reading",
    writingScore: "writing",
    speakingScore: "speaking",
};

module.exports = function programEnglishFilter(query) {
    const test = query.englishTest;
    const supplied = Object.entries(scoreFields).filter(([key]) => query[key] !== undefined && query[key] !== "");
    if (!test && !supplied.length) return null;
    if (typeof test !== "string" || !["ielts", "toefl", "pte", "duolingo"].includes(test)) {
        throw new Error("Select a valid English proficiency test");
    }
    const path = `entry_requirements.language_requirements.english.${test}`;
    const conditions = [{
        // Require evidence that the program accepts the selected test.
        $or: Object.values(scoreFields).map(field => ({ [`${path}.${field}`]: { $gte: 0 } })),
    }];
    for (const [key, field] of supplied) {
        const score = Number(query[key]);
        if (typeof query[key] !== "string" || !query[key].trim() || !Number.isFinite(score) || score < 0) {
            throw new Error(`${key} must be a non-negative number`);
        }
        // An unspecified program minimum adds no restriction for that component.
        conditions.push({ $or: [
            { [`${path}.${field}`]: null },
            { [`${path}.${field}`]: { $lte: score } },
        ] });
    }
    return { $and: conditions };
};
