function parseListQuery(query = {}) {
    const { page = "1", limit = "25", search = "" } = query;
    if (typeof page !== "string" || !/^\d+$/.test(page) || !Number.isSafeInteger(Number(page)) || Number(page) < 1 ||
        typeof limit !== "string" || !/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100 ||
        !Number.isSafeInteger((Number(page) - 1) * Number(limit))) {
        throw new Error("Page must be a positive integer and limit must be between 1 and 100.");
    }
    if (typeof search !== "string" || search.length > 200) throw new Error("Search must be text with at most 200 characters.");
    return { page: Number(page), limit: Number(limit), search: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") };
}

module.exports = { parseListQuery };
