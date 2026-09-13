const MAX_AMOUNT = 1_000_000_000_000;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isAmount = (value) => typeof value === "number" && Number.isFinite(value)
    && value >= 0 && value <= MAX_AMOUNT && Number(value.toFixed(2)) === value;

function validateCostSheet(sheet) {
    const fail = (message) => { throw new Error(message); };
    const keysOnly = (value, allowed) => isObject(value) && Object.keys(value).every((key) => allowed.includes(key));
    const text = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 500;
    const key = (value) => typeof value === "string" && /^[a-z][a-z0-9_]{0,63}$/.test(value);
    if (!keysOnly(sheet, ["title", "currency", "stages"]) || !text(sheet.title) || sheet.currency !== "NPR") fail("Provide title, currency (NPR), and stages only.");
    if (!Array.isArray(sheet.stages) || !sheet.stages.length || sheet.stages.length > 20) fail("Provide between 1 and 20 stages.");
    const stageKeys = new Set();
    const itemKeys = new Set();
    for (const stage of sheet.stages) {
        if (!keysOnly(stage, ["key", "title", "items"]) || !key(stage.key) || !text(stage.title) || stageKeys.has(stage.key)) fail("Stages require unique keys and titles.");
        stageKeys.add(stage.key);
        if (!Array.isArray(stage.items) || !stage.items.length || stage.items.length > 50) fail("Each stage needs between 1 and 50 items.");
        for (const item of stage.items) {
            if (!keysOnly(item, ["key", "label", "amount", "note"]) || !key(item.key) || !text(item.label) || itemKeys.has(item.key)) fail("Items require globally unique keys and labels.");
            itemKeys.add(item.key);
            if (item.amount !== null && !isAmount(item.amount)) fail("Amounts must be null or non-negative numbers with at most two decimal places, up to 1 trillion.");
            if (item.note !== undefined && (typeof item.note !== "string" || item.note.length > 1000)) fail("Item notes must be text of at most 1000 characters.");
        }
    }
}

function calculateEstimate(sheet, values = {}) {
    if (!isObject(values)) throw new Error("values must be an object keyed by cost item key.");
    const items = new Map(sheet.stages.flatMap((stage) => stage.items.map((item) => [item.key, item])));
    for (const [key, value] of Object.entries(values)) {
        if (!items.has(key)) throw new Error(`Unknown cost item: ${key}`);
        if (value !== null && value !== "" && !isAmount(value)) throw new Error(`Invalid amount for ${key}. Use a non-negative number with at most two decimal places, up to 1 trillion.`);
    }
    const missingFields = [];
    let totalCents = 0;
    const stages = sheet.stages.map((stage) => {
        let subtotalCents = 0;
        const resolvedItems = stage.items.map((item) => {
            const supplied = Object.hasOwn(values, item.key) && values[item.key] !== null && values[item.key] !== "";
            const amount = supplied ? values[item.key] : item.amount;
            if (amount === null) missingFields.push(item.key);
            else subtotalCents += Math.round(amount * 100);
            return { ...item, defaultAmount: item.amount, amount, editable: true,
                requiresInput: amount === null, source: supplied ? "user" : amount === null ? "missing" : "default" };
        });
        totalCents += subtotalCents;
        // Existing database sheets use label; expose the same title field used
        // by newer sheets, the estimator UI, and PDF reports.
        const title = typeof stage.title === "string" && stage.title.trim()
            ? stage.title : stage.label;
        return { ...stage, title, items: resolvedItems, subtotal: subtotalCents / 100,
            isComplete: resolvedItems.every((item) => !item.requiresInput) };
    });
    return { title: sheet.title, currency: sheet.currency, stages, total: totalCents / 100,
        isComplete: missingFields.length === 0, missingFields };
}

module.exports = { calculateEstimate, validateCostSheet, isAmount, MAX_AMOUNT };
