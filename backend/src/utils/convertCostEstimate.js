const { findRate } = require("./nrbForex");

function convertCostEstimate(estimate, rates) {
    let totalCents = 0, conversionMissing = false;
    const stages = estimate.stages.map(stage => {
        let stageCents = 0, stageMissing = false;
        const items = stage.items.map(item => {
            if (item.amount === null || ["percent", "months"].includes(item.unit)) return { ...item, convertedNpr: null };
            const rate = findRate(rates, item.currency);
            const convertedNpr = rate ? Math.round(item.amount * rate.sell / (Number(rate.currency?.unit) || 1) * 100) / 100 : null;
            if (item.includeInTotal !== false) {
                if (convertedNpr === null) stageMissing = true;
                else stageCents += Math.round(convertedNpr * 100);
            }
            return { ...item, convertedNpr, forexRate: rate ? { buy: rate.buy, sell: rate.sell, unit: rate.currency?.unit || 1, date: rate.date } : null };
        });
        totalCents += stageCents;
        conversionMissing ||= stageMissing;
        return { ...stage, items, subtotalNpr: stageMissing ? null : stageCents / 100 };
    });
    return { stages, totalNpr: conversionMissing ? null : totalCents / 100 };
}
module.exports = { convertCostEstimate };
