// Prefer structured amounts; legacy and manually edited fees may only have text.
const amountPattern = "[0-9]+(?:,[0-9]{3})*(?:\\.[0-9]+)?";
const textAmount = {
    $let: {
        vars: { text: { $convert: { input: "$$fee.display_text", to: "string", onError: "", onNull: "" } } },
        in: { $let: {
            vars: { match: { $ifNull: [
                { $regexFind: { input: "$$text", regex: `(?:EUR|USD|AUD|CAD|GBP|NZD|€|£|\\$)\\s*(${amountPattern})`, options: "i" } },
                { $regexFind: { input: "$$text", regex: `\\b(?:points?|credits?|ECTS)\\s*:\\s*(${amountPattern})`, options: "i" } },
                { $regexFind: { input: "$$text", regex: `^\\s*(${amountPattern})(?![\\d,.]|\\s*(?:points?|credits?|ECTS)\\b)`, options: "i" } },
            ] } },
            in: { $convert: {
                input: { $replaceAll: { input: { $arrayElemAt: ["$$match.captures", 0] }, find: ",", replacement: "" } },
                to: "double", onError: null, onNull: null,
            } },
        } },
    },
};

function programFeeSort(sortOrder) {
    return [
        { $addFields: { sortFee: { $let: {
            vars: { amounts: { $filter: {
                input: { $map: {
                    input: { $ifNull: ["$tuition_fees", []] }, as: "fee",
                    in: { $ifNull: [
                        { $convert: { input: "$$fee.annual_fee_eur", to: "double", onError: null, onNull: null } },
                        textAmount,
                    ] },
                } },
                as: "amount", cond: { $and: [{ $ne: ["$$amount", null] }, { $gte: ["$$amount", 0] }] },
            } } },
            // Use the first available amount, matching the order shown on cards.
            in: { $ifNull: [{ $arrayElemAt: ["$$amounts", 0] }, null] },
        } } } },
        { $addFields: { sortFeeMissing: { $cond: [{ $eq: ["$sortFee", null] }, 1, 0] } } },
        { $sort: { sortFeeMissing: 1, sortFee: sortOrder === "highToLow" ? -1 : 1, listingRank: 1, _id: 1 } },
    ];
}

module.exports = programFeeSort;
