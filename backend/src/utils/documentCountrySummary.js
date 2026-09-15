// The dashboard shows one document collection per country, including all sections and stages.
function summarizeDocumentCountries(records, since) {
    const groups = new Map();
    for (const record of records) {
        const title = `${record.country?.name || 'Unknown country'} documents`;
        const countryId = String(record.country?._id || record.country || '');
        const key = countryId;
        const createdAt = record.createdAt ? new Date(record.createdAt) : null;
        if (!groups.has(key)) {
            groups.set(key, { _id: key, title, country: record.country, createdAt });
        } else if (createdAt && (!groups.get(key).createdAt || createdAt < groups.get(key).createdAt)) {
            groups.get(key).createdAt = createdAt;
        }
    }
    const countries = [...groups.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || a._id.localeCompare(b._id));
    return {
        total: countries.length,
        addedRecently: countries.filter(country => country.createdAt && country.createdAt >= since).length,
        latest: countries.slice(0, 5),
    };
}
module.exports = { summarizeDocumentCountries };
