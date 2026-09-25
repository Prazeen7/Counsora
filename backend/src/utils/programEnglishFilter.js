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
    for (const [key] of supplied) {
        const score = Number(query[key]);
        if (typeof query[key] !== "string" || !query[key].trim() || !Number.isFinite(score) || score < 0) {
            throw new Error(`${key} must be a non-negative number`);
        }
    }
    return require("./resolvedEnglishFilter")(test, Object.fromEntries(supplied.map(([key, field]) => [field, Number(query[key])])));
};
