const axios = require("axios");

const cache = new Map();
const isoDate = () => new Date().toISOString().slice(0, 10);

async function getTodayRates() {
    const date = isoDate();
    if (cache.has(date)) return cache.get(date);
    const response = await axios.get("https://www.nrb.org.np/api/forex/v1/rates", {
        params: { page: 1, per_page: 100, from: date, to: date }, timeout: 10000,
    });
    const payload = response.data?.data?.payload;
    const records = Array.isArray(payload) ? payload : payload ? [payload] : [];
    const rates = records.flatMap((record) => (record.rates || []).map((rate) => ({
        date: record.date, publishedOn: record.published_on,
        currency: rate.currency, buy: Number(rate.buy), sell: Number(rate.sell),
    })));
    const result = { date, requestedDate: date, rates: rates.filter((rate) => rate.date === date) };
    cache.set(date, result);
    return result;
}

const ISO_ALIASES = { euro: "EUR", euros: "EUR", "new zealand dollar": "NZD", "australian dollar": "AUD", "us dollar": "USD", dollar: "USD", pound: "GBP" };
function currencyIso(currency) {
    const value = String(currency || "").trim();
    return /^[A-Za-z]{3}$/.test(value) ? value.toUpperCase() : ISO_ALIASES[value.toLowerCase()];
}

async function getFallbackRate(currency) {
    const iso = currencyIso(currency);
    if (!iso || iso === "NPR") return null;
    const response = await axios.get(`https://open.er-api.com/v6/latest/${iso}`, { timeout: 10000 });
    const npr = Number(response.data?.rates?.NPR);
    if (!Number.isFinite(npr) || npr <= 0) return null;
    return { date: new Date().toISOString().slice(0, 10), publishedOn: response.data?.time_last_update_utc || null,
        currency: { iso3: iso, name: currency, unit: 1 }, buy: npr, sell: npr, source: "open.er-api.com" };
}

function findRate(rates, currency) {
    const wanted = String(currency || "").trim().toLowerCase();
    if (wanted === "npr" || wanted === "nepalese rupee") return { currency: "NPR", unit: 1, buy: 1, sell: 1 };
    return rates.find((rate) => [rate.currency?.ISO3, rate.currency?.iso3, rate.currency?.name].filter(Boolean).some((value) => {
        const candidate = String(value).toLowerCase();
        return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
    }));
}

module.exports = { getTodayRates, findRate, getFallbackRate, currencyIso };
