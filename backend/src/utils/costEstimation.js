const MAX_AMOUNT = 1_000_000_000_000;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isAmount = (value) => typeof value === "number" && Number.isFinite(value)
    && value >= 0 && value <= MAX_AMOUNT && Number(value.toFixed(2)) === value;

function validateCostSheet(sheet, options = {}) {
    const fail = (message) => { throw new Error(message); };
    const keysOnly = (value, allowed) => isObject(value) && Object.keys(value).every((key) => allowed.includes(key));
    const text = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 500;
    const key = (value) => typeof value === "string" && /^[a-z][a-z0-9_]{0,63}$/.test(value);
    const allowedCurrencies = new Set(["NPR", ...(options.countryCurrency ? [options.countryCurrency] : [])].map((value) => String(value).trim().toLowerCase()));
    // `currency` is accepted transiently for backwards compatibility with
    // older clients, but it is ignored; currency belongs to each field.
    if (!keysOnly(sheet, ["title", "stages", "currency"]) || !text(sheet.title)) fail("Provide a valid sheet title and stages.");
    if (!Array.isArray(sheet.stages) || !sheet.stages.length || sheet.stages.length > 20) fail("Provide between 1 and 20 stages.");
    const stageKeys = new Set();
    const itemKeys = new Set();
    for (const stage of sheet.stages) {
        if (!keysOnly(stage, ["key", "title", "items"]) || !key(stage.key) || !text(stage.title) || stageKeys.has(stage.key)) fail("Stages require unique keys and titles.");
        stageKeys.add(stage.key);
        if (!Array.isArray(stage.items) || !stage.items.length || stage.items.length > 50) fail("Each stage needs between 1 and 50 items.");
        for (const item of stage.items) {
            if (!keysOnly(item, ["key", "label", "amount", "note", "currency", "unit", "includeInTotal", "calculation"]) || !key(item.key) || !text(item.label) || itemKeys.has(item.key) || typeof item.currency !== "string" || !/^[A-Za-z][A-Za-z0-9 ._-]{0,31}$/.test(item.currency.trim()) || (!options.skipCurrencyValidation && !allowedCurrencies.has(item.currency.trim().toLowerCase()))) fail(`Each cost field requires a currency of NPR or the selected country's currency${options.countryCurrency ? ` (${options.countryCurrency})` : ""}.`);
            itemKeys.add(item.key);
            if (item.amount !== null && !isAmount(item.amount)) fail("Amounts must be null or non-negative numbers with at most two decimal places, up to 1 trillion.");
            if (item.note !== undefined && (typeof item.note !== "string" || item.note.length > 1000)) fail("Item notes must be text of at most 1000 characters.");
            if (item.unit !== undefined && !["money", "percent", "months"].includes(item.unit)) fail("Invalid field unit.");
            if (item.unit === "months" && (item.includeInTotal !== false || (item.amount !== null && (!Number.isInteger(item.amount) || item.amount < 1 || item.amount > 600)))) fail("Loan term must be a whole number from 1 to 600 months and excluded from totals.");
            if (item.includeInTotal !== undefined && typeof item.includeInTotal !== "boolean") fail("Invalid total setting.");
            if (item.unit === "percent" && (item.includeInTotal !== false || (item.amount !== null && item.amount > 100))) fail("Percentage fields must be between 0 and 100 and excluded from totals.");
        }
    }
    const items = new Map(sheet.stages.flatMap(stage => stage.items.map(item => [item.key, item])));
    const visiting = new Set(), done = new Set();
    function check(item) {
        if (done.has(item.key)) return;
        if (visiting.has(item.key)) fail("Cost formulas cannot contain cycles.");
        visiting.add(item.key);
        const formula = item.calculation;
        if (formula !== undefined && formula !== null) {
            if (!keysOnly(formula, ["type", "baseKey", "rateKey", "rate", "termKey"]) || !["copy", "percentage", "emi"].includes(formula.type) || !key(formula.baseKey) || !items.has(formula.baseKey)) fail("Invalid cost formula or base field.");
            const base = items.get(formula.baseKey);
            if (["percent", "months"].includes(item.unit) || ["percent", "months"].includes(base.unit) || base.currency !== item.currency) fail("Formula amounts must use the same currency.");
            if (formula.type !== "emi" && formula.termKey !== undefined) fail("Only EMI formulas have a loan term.");
            if (formula.type === "emi") {
                if (item.includeInTotal !== false || !items.has(formula.termKey) || items.get(formula.termKey).unit !== "months") fail("EMI needs a loan term and must be excluded from upfront totals.");
                check(items.get(formula.termKey));
            }
            if (["percentage", "emi"].includes(formula.type)) {
                if (formula.rateKey !== undefined) {
                    if (formula.rate !== undefined || !items.has(formula.rateKey) || items.get(formula.rateKey).unit !== "percent") fail("Invalid formula percentage field.");
                    check(items.get(formula.rateKey));
                } else if (!isAmount(formula.rate) || formula.rate > 100) fail("Formula percentage must be between 0 and 100.");
            } else if (formula.rate !== undefined || formula.rateKey !== undefined) fail("Copy formulas cannot have a percentage.");
            check(base);
        }
        visiting.delete(item.key); done.add(item.key);
    }
    items.forEach(check);
}

function calculateEstimate(sheet, values = {}) {
    if (!isObject(values)) throw new Error("values must be an object keyed by cost item key.");
    const items = new Map(sheet.stages.flatMap((stage) => stage.items.map((item) => [item.key, item])));
    for (const [key, value] of Object.entries(values)) {
        if (!items.has(key)) throw new Error(`Unknown cost item: ${key}`);
        if (items.get(key).calculation && value !== null && value !== "") throw new Error(`Calculated field cannot be overridden: ${key}`);
        if (value !== null && value !== "" && !isAmount(value)) throw new Error(`Invalid amount for ${key}. Use a non-negative number with at most two decimal places, up to 1 trillion.`);
        if (items.get(key).unit === "percent" && value > 100) throw new Error(`Percentage must not exceed 100: ${key}`);
        if (items.get(key).unit === "months" && value !== null && value !== "" && (!Number.isInteger(value) || value < 1 || value > 600)) throw new Error("Loan term must be a whole number from 1 to 600 months.");
    }
    const resolved = new Map(), visiting = new Set();
    function resolve(item) {
        if (resolved.has(item.key)) return resolved.get(item.key);
        if (visiting.has(item.key)) throw new Error("Cost formulas cannot contain cycles.");
        visiting.add(item.key);
        const supplied = Object.hasOwn(values, item.key) && values[item.key] !== null && values[item.key] !== "";
        let amount = supplied ? values[item.key] : item.amount;
        if (item.calculation) {
            const f = item.calculation, base = items.get(f.baseKey);
            if (!base) throw new Error("Missing formula base.");
            amount = resolve(base);
            if (f.type === "percentage") {
                const rate = f.rateKey ? resolve(items.get(f.rateKey)) : f.rate;
                amount = amount === null || rate === null ? null : Math.round((amount * rate / 100 + Number.EPSILON) * 100) / 100;
            }
            if (f.type === "emi") {
                const rate = f.rateKey ? resolve(items.get(f.rateKey)) : f.rate;
                const months = resolve(items.get(f.termKey));
                if (amount === null || rate === null || months === null) amount = null;
                else {
                    const monthlyRate = rate / 1200;
                    amount = Math.round((monthlyRate === 0 ? amount / months : amount * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate))) * 100) / 100;
                }
            }
        }
        if (amount !== null && !isAmount(amount)) throw new Error(`Calculated amount is out of range: ${item.key}`);
        visiting.delete(item.key); resolved.set(item.key, amount);
        return amount;
    }
    const missingFields = [];
    let totalCents = 0;
    const stages = sheet.stages.map((stage) => {
        let subtotalCents = 0;
        const resolvedItems = stage.items.map((item) => {
            const supplied = Object.hasOwn(values, item.key) && values[item.key] !== null && values[item.key] !== "";
            const amount = resolve(item);
            if (amount === null) missingFields.push(item.key);
            else if (item.includeInTotal !== false && item.unit !== "percent") subtotalCents += Math.round(amount * 100);
            return { ...item, currency: item.currency || "NPR", defaultAmount: item.amount, amount, editable: !item.calculation,
                requiresInput: amount === null, source: item.calculation ? "calculated" : supplied ? "user" : amount === null ? "missing" : "default" };
        });
        totalCents += subtotalCents;
        // Existing database sheets use label; expose the same title field used
        // by newer sheets, the estimator UI, and PDF reports.
        const title = typeof stage.title === "string" && stage.title.trim()
            ? stage.title : stage.label;
        return { ...stage, title, items: resolvedItems, subtotal: subtotalCents / 100,
            isComplete: resolvedItems.every((item) => !item.requiresInput) };
    });
    return { title: sheet.title, stages, total: totalCents / 100,
        isComplete: missingFields.length === 0, missingFields };
}

module.exports = { calculateEstimate, validateCostSheet, isAmount, MAX_AMOUNT };
